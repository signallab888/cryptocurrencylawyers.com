import { Router, type IRouter } from "express";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  specialtiesTable,
  jurisdictionsTable,
  practiceAreasTable,
  lawyerSpecialtiesTable,
  lawyerJurisdictionsTable,
} from "@workspace/db/schema";
import {
  ListSpecialtiesQueryParams,
  ListSpecialtiesResponse,
  ListJurisdictionsQueryParams,
  ListJurisdictionsResponse,
  ListPracticeAreasResponse,
} from "@workspace/api-zod";
import { parseInput, parseOutput } from "../lib/validate.js";

const router: IRouter = Router();

// ── GET /specialties ─────────────────────────────────────────────────────────
router.get("/specialties", async (req, res, next) => {
  try {
    const params = parseInput(ListSpecialtiesQueryParams, req.query);

    const rows = await db
      .select({
        id: specialtiesTable.id,
        slug: specialtiesTable.slug,
        name: specialtiesTable.name,
        practiceAreaId: specialtiesTable.practiceAreaId,
        description: specialtiesTable.description,
        lawyerCount: count(lawyerSpecialtiesTable.lawyerId),
      })
      .from(specialtiesTable)
      .leftJoin(
        lawyerSpecialtiesTable,
        eq(lawyerSpecialtiesTable.specialtyId, specialtiesTable.id),
      )
      .leftJoin(
        practiceAreasTable,
        eq(practiceAreasTable.id, specialtiesTable.practiceAreaId),
      )
      .where(
        params.practiceAreaSlug
          ? eq(practiceAreasTable.slug, params.practiceAreaSlug)
          : undefined,
      )
      .groupBy(specialtiesTable.id)
      .orderBy(specialtiesTable.name);

    const payload = { data: rows };
    const validated = parseOutput(ListSpecialtiesResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

// ── GET /jurisdictions ───────────────────────────────────────────────────────
router.get("/jurisdictions", async (req, res, next) => {
  try {
    const params = parseInput(ListJurisdictionsQueryParams, req.query);

    const conditions = [eq(jurisdictionsTable.isActive, true)];
    if (params.type) conditions.push(eq(jurisdictionsTable.type, params.type));
    if (params.countryCode) conditions.push(eq(jurisdictionsTable.countryCode, params.countryCode));

    const rows = await db
      .select({
        id: jurisdictionsTable.id,
        slug: jurisdictionsTable.slug,
        name: jurisdictionsTable.name,
        countryCode: jurisdictionsTable.countryCode,
        type: jurisdictionsTable.type,
        lawyerCount: count(lawyerJurisdictionsTable.lawyerId),
      })
      .from(jurisdictionsTable)
      .leftJoin(
        lawyerJurisdictionsTable,
        eq(lawyerJurisdictionsTable.jurisdictionId, jurisdictionsTable.id),
      )
      .where(and(...conditions))
      .groupBy(jurisdictionsTable.id)
      .orderBy(jurisdictionsTable.name);

    const payload = { data: rows };
    const validated = parseOutput(ListJurisdictionsResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

// ── GET /practice-areas ──────────────────────────────────────────────────────
router.get("/practice-areas", async (req, res, next) => {
  try {
    const areas = await db
      .select()
      .from(practiceAreasTable)
      .orderBy(practiceAreasTable.name);

    let specialties: (typeof specialtiesTable.$inferSelect)[] = [];
    let countMap = new Map<number, number>();

    if (areas.length > 0) {
      const areaIds = areas.map((a) => a.id);
      specialties = await db
        .select()
        .from(specialtiesTable)
        .where(inArray(specialtiesTable.practiceAreaId, areaIds))
        .orderBy(specialtiesTable.name);

      const specialtyIds = specialties.map((s) => s.id);
      if (specialtyIds.length > 0) {
        const counts = await db
          .select({
            specialtyId: lawyerSpecialtiesTable.specialtyId,
            count: count(lawyerSpecialtiesTable.lawyerId),
          })
          .from(lawyerSpecialtiesTable)
          .where(inArray(lawyerSpecialtiesTable.specialtyId, specialtyIds))
          .groupBy(lawyerSpecialtiesTable.specialtyId);
        countMap = new Map(counts.map((c) => [c.specialtyId, Number(c.count)]));
      }
    }

    const specialtiesByAreaId = new Map<number, typeof specialties>();
    for (const s of specialties) {
      const list = specialtiesByAreaId.get(s.practiceAreaId) ?? [];
      list.push(s);
      specialtiesByAreaId.set(s.practiceAreaId, list);
    }

    const data = areas.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description ?? null,
      specialties: (specialtiesByAreaId.get(a.id) ?? []).map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        practiceAreaId: s.practiceAreaId,
        description: s.description ?? null,
        lawyerCount: countMap.get(s.id) ?? 0,
      })),
    }));

    const payload = { data };
    const validated = parseOutput(ListPracticeAreasResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

export default router;
