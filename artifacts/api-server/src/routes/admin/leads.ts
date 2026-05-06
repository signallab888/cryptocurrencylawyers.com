import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { leadsTable, specialtiesTable, jurisdictionsTable } from "@workspace/db/schema";
import {
  AdminListLeadsQueryParams,
  AdminListLeadsResponse,
  AdminPatchLeadParams,
  AdminPatchLeadBody,
  AdminPatchLeadResponse,
} from "@workspace/api-zod";
import { parseInput, parseOutput } from "../../lib/validate.js";
import { AppError } from "../../lib/errors.js";
import { requireClerkAuth } from "../../middleware/auth.js";

const router: IRouter = Router();

router.use(requireClerkAuth);

// ── GET /admin/leads ──────────────────────────────────────────────────────────
router.get("/admin/leads", async (req, res, next) => {
  try {
    const params = parseInput(AdminListLeadsQueryParams, req.query);

    const conditions = [];
    if (params.status) conditions.push(eq(leadsTable.status, params.status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.pageSize;
    const orderCol = params.sort === "createdAt" ? leadsTable.createdAt : leadsTable.status;
    const orderExpr = params.order === "asc" ? asc(orderCol) : desc(orderCol);

    const [countResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(where),
      db
        .select({
          id: leadsTable.id,
          clientName: leadsTable.clientName,
          clientEmail: leadsTable.clientEmail,
          clientPhone: leadsTable.clientPhone,
          caseTypeSpecialtyId: leadsTable.caseTypeSpecialtyId,
          jurisdictionId: leadsTable.jurisdictionId,
          budgetRange: leadsTable.budgetRange,
          urgency: leadsTable.urgency,
          description: leadsTable.description,
          sourcePage: leadsTable.sourcePage,
          status: leadsTable.status,
          captchaScore: leadsTable.captchaScore,
          utmSource: leadsTable.utmSource,
          utmMedium: leadsTable.utmMedium,
          utmCampaign: leadsTable.utmCampaign,
          createdAt: leadsTable.createdAt,
          updatedAt: leadsTable.updatedAt,
        })
        .from(leadsTable)
        .where(where)
        .orderBy(orderExpr)
        .limit(params.pageSize)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / params.pageSize);

    // Batch resolve specialty and jurisdiction names
    const specialtyIds = [...new Set(rows.flatMap((r) => (r.caseTypeSpecialtyId ? [r.caseTypeSpecialtyId] : [])))];
    const jurisdictionIds = [...new Set(rows.flatMap((r) => (r.jurisdictionId ? [r.jurisdictionId] : [])))];

    const [specNames, jurNames] = await Promise.all([
      specialtyIds.length > 0
        ? db
            .select({ id: specialtiesTable.id, name: specialtiesTable.name })
            .from(specialtiesTable)
            .where(inArray(specialtiesTable.id, specialtyIds))
        : [],
      jurisdictionIds.length > 0
        ? db
            .select({ id: jurisdictionsTable.id, name: jurisdictionsTable.name })
            .from(jurisdictionsTable)
            .where(inArray(jurisdictionsTable.id, jurisdictionIds))
        : [],
    ]);

    const specMap = new Map(specNames.map((s) => [s.id, s.name]));
    const jurMap = new Map(jurNames.map((j) => [j.id, j.name]));

    const data = rows.map((r) => ({
      ...r,
      specialtyName: r.caseTypeSpecialtyId ? (specMap.get(r.caseTypeSpecialtyId) ?? null) : null,
      jurisdictionName: r.jurisdictionId ? (jurMap.get(r.jurisdictionId) ?? null) : null,
    }));

    const payload = {
      data,
      meta: { page: params.page, pageSize: params.pageSize, total, totalPages },
    };
    const validated = parseOutput(AdminListLeadsResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /admin/leads/:id ────────────────────────────────────────────────────
router.patch("/admin/leads/:id", async (req, res, next) => {
  try {
    const { id } = parseInput(AdminPatchLeadParams, req.params);
    const body = parseInput(AdminPatchLeadBody, req.body);

    const existing = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id))
      .limit(1);

    if (existing.length === 0) {
      throw new AppError(404, "NOT_FOUND", `Lead ${id} not found`);
    }

    const updates: Partial<typeof leadsTable.$inferInsert> = {};
    if (body.status != null) updates.status = body.status;

    const [updated] = await db
      .update(leadsTable)
      .set(updates)
      .where(eq(leadsTable.id, id))
      .returning();

    if (!updated) throw new AppError(500, "INTERNAL_ERROR", "Update failed");

    // Batch resolve names
    const [specRow, jurRow] = await Promise.all([
      updated.caseTypeSpecialtyId
        ? db
            .select({ name: specialtiesTable.name })
            .from(specialtiesTable)
            .where(eq(specialtiesTable.id, updated.caseTypeSpecialtyId))
            .limit(1)
        : [],
      updated.jurisdictionId
        ? db
            .select({ name: jurisdictionsTable.name })
            .from(jurisdictionsTable)
            .where(eq(jurisdictionsTable.id, updated.jurisdictionId))
            .limit(1)
        : [],
    ]);

    const payload = {
      ...updated,
      specialtyName: Array.isArray(specRow) && specRow[0] ? specRow[0].name : null,
      jurisdictionName: Array.isArray(jurRow) && jurRow[0] ? jurRow[0].name : null,
    };

    req.log.info({ leadId: id, status: updated.status }, "Lead updated");
    const validated = parseOutput(AdminPatchLeadResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

export default router;
