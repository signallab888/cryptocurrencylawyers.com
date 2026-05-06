import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  jurisdictionsTable,
  lawyerJurisdictionsTable,
  lawyerSpecialtiesTable,
  lawyersTable,
  specialtiesTable,
} from "@workspace/db/schema";
import {
  GetLawyerBySlugParams,
  GetLawyerBySlugResponse,
  ListLawyersQueryParams,
  ListLawyersResponse,
} from "@workspace/api-zod";
import { AppError } from "../lib/errors.js";
import { parseInput, parseOutput } from "../lib/validate.js";

const router: IRouter = Router();

type ListParams = ReturnType<(typeof ListLawyersQueryParams)["parse"]>;

function buildWhere(p: ListParams) {
  const conditions = [eq(lawyersTable.status, "published")];

  if (p.tier) conditions.push(eq(lawyersTable.tier, p.tier));
  if (p.acceptsCryptoPayment != null)
    conditions.push(eq(lawyersTable.acceptsCryptoPayment, p.acceptsCryptoPayment));
  if (p.freeConsultation != null)
    conditions.push(eq(lawyersTable.freeConsultation, p.freeConsultation));

  if (p.language) {
    conditions.push(
      sql`${lawyersTable.languages} @> ARRAY[${p.language}]::text[]`,
    );
  }

  if (p.q) {
    const like = `%${p.q}%`;
    conditions.push(
      or(
        ilike(lawyersTable.name, like),
        ilike(lawyersTable.firmName, like),
        ilike(lawyersTable.bioShort, like),
      )!,
    );
  }

  if (p.specialtySlug) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM lawyer_specialties ls
        JOIN specialties s ON s.id = ls.specialty_id
        WHERE ls.lawyer_id = ${lawyersTable.id}
        AND s.slug = ${p.specialtySlug}
      )`,
    );
  }

  if (p.jurisdictionSlug) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM lawyer_jurisdictions lj
        JOIN jurisdictions j ON j.id = lj.jurisdiction_id
        WHERE lj.lawyer_id = ${lawyersTable.id}
        AND j.slug = ${p.jurisdictionSlug}
      )`,
    );
  }

  if (p.practiceAreaSlug) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM lawyer_specialties ls
        JOIN specialties s ON s.id = ls.specialty_id
        JOIN practice_areas pa ON pa.id = s.practice_area_id
        WHERE ls.lawyer_id = ${lawyersTable.id}
        AND pa.slug = ${p.practiceAreaSlug}
      )`,
    );
  }

  if (p.presenceLevel) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM lawyer_jurisdictions lj
        WHERE lj.lawyer_id = ${lawyersTable.id}
        AND lj.presence_level = ${p.presenceLevel}::presence_level
      )`,
    );
  }

  return and(...conditions);
}

function buildSort(sort: ListParams["sort"]) {
  if (sort === "tier") {
    return [
      sql`CASE
        WHEN ${lawyersTable.tier} = 'premium' THEN 0
        WHEN ${lawyersTable.tier} = 'featured' THEN 1
        ELSE 2
      END`,
      asc(lawyersTable.name),
    ] as const;
  }
  if (sort === "name") return [asc(lawyersTable.name)] as const;
  if (sort === "yearsExperience")
    return [desc(lawyersTable.yearsExperience), asc(lawyersTable.name)] as const;
  return [
    sql`CASE
      WHEN ${lawyersTable.tier} = 'premium' THEN 0
      WHEN ${lawyersTable.tier} = 'featured' THEN 1
      ELSE 2
    END`,
    asc(lawyersTable.name),
  ] as const;
}

async function batchFetchRelations(lawyerIds: number[]) {
  if (lawyerIds.length === 0) return { jurisdictions: [], specialties: [] };

  const [jurisdictions, specialties] = await Promise.all([
    db
      .select({
        lawyerId: lawyerJurisdictionsTable.lawyerId,
        jurisdictionId: lawyerJurisdictionsTable.jurisdictionId,
        slug: jurisdictionsTable.slug,
        name: jurisdictionsTable.name,
        barNumber: lawyerJurisdictionsTable.barNumber,
        admittedYear: lawyerJurisdictionsTable.admittedYear,
        isPrimary: lawyerJurisdictionsTable.isPrimary,
        presenceLevel: lawyerJurisdictionsTable.presenceLevel,
        barStatus: lawyerJurisdictionsTable.barStatus,
      })
      .from(lawyerJurisdictionsTable)
      .innerJoin(
        jurisdictionsTable,
        eq(jurisdictionsTable.id, lawyerJurisdictionsTable.jurisdictionId),
      )
      .where(inArray(lawyerJurisdictionsTable.lawyerId, lawyerIds)),
    db
      .select({
        lawyerId: lawyerSpecialtiesTable.lawyerId,
        id: specialtiesTable.id,
        slug: specialtiesTable.slug,
        name: specialtiesTable.name,
        practiceAreaId: specialtiesTable.practiceAreaId,
        description: specialtiesTable.description,
        yearsExperience: lawyerSpecialtiesTable.yearsExperience,
        isFeatured: lawyerSpecialtiesTable.isFeatured,
      })
      .from(lawyerSpecialtiesTable)
      .innerJoin(
        specialtiesTable,
        eq(specialtiesTable.id, lawyerSpecialtiesTable.specialtyId),
      )
      .where(inArray(lawyerSpecialtiesTable.lawyerId, lawyerIds)),
  ]);

  return { jurisdictions, specialties };
}

// ── GET /lawyers ──────────────────────────────────────────────────────────────
router.get("/lawyers", async (req, res, next) => {
  try {
    const params = parseInput(ListLawyersQueryParams, req.query);
    const where = buildWhere(params);
    const offset = (params.page - 1) * params.pageSize;
    const orderExprs = buildSort(params.sort);

    const [countResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(lawyersTable).where(where),
      db
        .select({
          id: lawyersTable.id,
          slug: lawyersTable.slug,
          name: lawyersTable.name,
          firmName: lawyersTable.firmName,
          photoUrl: lawyersTable.photoUrl,
          bioShort: lawyersTable.bioShort,
          emailPublic: lawyersTable.emailPublic,
          phone: lawyersTable.phone,
          website: lawyersTable.website,
          locationCity: lawyersTable.locationCity,
          locationCountryCode: lawyersTable.locationCountryCode,
          yearsExperience: lawyersTable.yearsExperience,
          languages: lawyersTable.languages,
          acceptsCryptoPayment: lawyersTable.acceptsCryptoPayment,
          freeConsultation: lawyersTable.freeConsultation,
          tier: lawyersTable.tier,
        })
        .from(lawyersTable)
        .where(where)
        .orderBy(...orderExprs)
        .limit(params.pageSize)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / params.pageSize);
    const lawyerIds = rows.map((r) => r.id);

    const { jurisdictions: jurRows, specialties: specRows } =
      await batchFetchRelations(lawyerIds);

    const jurByLawyer = new Map<number, typeof jurRows>();
    for (const j of jurRows) {
      const list = jurByLawyer.get(j.lawyerId) ?? [];
      list.push(j);
      jurByLawyer.set(j.lawyerId, list);
    }

    const specByLawyer = new Map<number, typeof specRows>();
    for (const s of specRows) {
      const list = specByLawyer.get(s.lawyerId) ?? [];
      list.push(s);
      specByLawyer.set(s.lawyerId, list);
    }

    const data = rows.map((l) => ({
      ...l,
      jurisdictions: (jurByLawyer.get(l.id) ?? []).map((j) => ({
        jurisdictionId: j.jurisdictionId,
        slug: j.slug,
        name: j.name,
        barNumber: j.barNumber,
        admittedYear: j.admittedYear,
        isPrimary: j.isPrimary,
        presenceLevel: j.presenceLevel,
        barStatus: j.barStatus,
      })),
      specialties: (specByLawyer.get(l.id) ?? []).map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        practiceAreaId: s.practiceAreaId,
        description: s.description,
        yearsExperience: s.yearsExperience,
        isFeatured: s.isFeatured,
      })),
    }));

    const payload = {
      data,
      meta: { page: params.page, pageSize: params.pageSize, total, totalPages },
    };
    const validated = parseOutput(ListLawyersResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

// ── GET /lawyers/:slug ────────────────────────────────────────────────────────
router.get("/lawyers/:slug", async (req, res, next) => {
  try {
    const { slug } = parseInput(GetLawyerBySlugParams, req.params);

    const rows = await db
      .select()
      .from(lawyersTable)
      .where(and(eq(lawyersTable.slug, slug), eq(lawyersTable.status, "published")))
      .limit(1);

    if (rows.length === 0) {
      throw new AppError(404, "NOT_FOUND", `Lawyer '${slug}' not found`);
    }

    const l = rows[0]!;

    // Increment profile_views_count in background (non-blocking)
    db.execute(
      sql`UPDATE lawyers SET profile_views_count = profile_views_count + 1 WHERE id = ${l.id}`,
    ).catch((err: unknown) => req.log.error({ err }, "Failed to increment profile views"));

    const { jurisdictions: jurRows, specialties: specRows } = await batchFetchRelations([l.id]);

    const payload = {
      id: l.id,
      slug: l.slug,
      name: l.name,
      firmName: l.firmName,
      photoUrl: l.photoUrl,
      bioShort: l.bioShort,
      emailPublic: l.emailPublic,
      phone: l.phone,
      website: l.website,
      locationCity: l.locationCity,
      locationCountryCode: l.locationCountryCode,
      yearsExperience: l.yearsExperience,
      languages: l.languages,
      acceptsCryptoPayment: l.acceptsCryptoPayment,
      freeConsultation: l.freeConsultation,
      tier: l.tier,
      bioLong: l.bioLong,
      linkedin: l.linkedin,
      twitter: l.twitter,
      profileViewsCount: l.profileViewsCount,
      jurisdictions: jurRows.map((j) => ({
        jurisdictionId: j.jurisdictionId,
        slug: j.slug,
        name: j.name,
        barNumber: j.barNumber,
        admittedYear: j.admittedYear,
        isPrimary: j.isPrimary,
        presenceLevel: j.presenceLevel,
        barStatus: j.barStatus,
      })),
      specialties: specRows.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        practiceAreaId: s.practiceAreaId,
        description: s.description,
        yearsExperience: s.yearsExperience,
        isFeatured: s.isFeatured,
      })),
    };

    const validated = parseOutput(GetLawyerBySlugResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

export default router;
