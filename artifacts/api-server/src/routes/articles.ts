import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";
import {
  ListArticlesQueryParams,
  ListArticlesResponse,
  GetArticleBySlugParams,
  GetArticleBySlugResponse,
} from "@workspace/api-zod";
import { parseInput, parseOutput } from "../lib/validate.js";
import { AppError } from "../lib/errors.js";

const router: IRouter = Router();

// ── GET /articles ─────────────────────────────────────────────────────────────
router.get("/articles", async (req, res, next) => {
  try {
    const params = parseInput(ListArticlesQueryParams, req.query);

    const conditions = [eq(articlesTable.status, "published")];
    if (params.practiceAreaSlug) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM practice_areas pa
          WHERE pa.id = ${articlesTable.practiceAreaId}
          AND pa.slug = ${params.practiceAreaSlug}
        )`,
      );
    }
    if (params.specialtySlug) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM specialties s
          WHERE s.id = ${articlesTable.specialtyId}
          AND s.slug = ${params.specialtySlug}
        )`,
      );
    }
    if (params.jurisdictionSlug) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM jurisdictions j
          WHERE j.id = ${articlesTable.jurisdictionId}
          AND j.slug = ${params.jurisdictionSlug}
        )`,
      );
    }
    if (params.tag) {
      conditions.push(sql`${articlesTable.tags} @> ARRAY[${params.tag}]::text[]`);
    }

    const where = and(...conditions);
    const offset = (params.page - 1) * params.pageSize;

    const [countResult, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(articlesTable)
        .where(where),
      db
        .select({
          id: articlesTable.id,
          slug: articlesTable.slug,
          title: articlesTable.title,
          excerpt: articlesTable.excerpt,
          featuredImageUrl: articlesTable.featuredImageUrl,
          featuredImageAlt: articlesTable.featuredImageAlt,
          tags: articlesTable.tags,
          viewCount: articlesTable.viewCount,
          practiceAreaId: articlesTable.practiceAreaId,
          specialtyId: articlesTable.specialtyId,
          jurisdictionId: articlesTable.jurisdictionId,
          status: articlesTable.status,
          publishedAt: articlesTable.publishedAt,
          authorName: articlesTable.authorName,
          readingTimeMinutes: articlesTable.readingTimeMinutes,
        })
        .from(articlesTable)
        .where(where)
        .orderBy(desc(articlesTable.publishedAt))
        .limit(params.pageSize)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / params.pageSize);

    const payload = {
      data: rows,
      meta: { page: params.page, pageSize: params.pageSize, total, totalPages },
    };
    const validated = parseOutput(ListArticlesResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

// ── GET /articles/:slug ───────────────────────────────────────────────────────
router.get("/articles/:slug", async (req, res, next) => {
  try {
    const { slug } = parseInput(GetArticleBySlugParams, req.params);

    const rows = await db
      .select()
      .from(articlesTable)
      .where(and(eq(articlesTable.slug, slug), eq(articlesTable.status, "published")))
      .limit(1);

    if (rows.length === 0) {
      throw new AppError(404, "NOT_FOUND", `Article '${slug}' not found`);
    }

    const a = rows[0]!;
    const payload = {
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      featuredImageUrl: a.featuredImageUrl,
      featuredImageAlt: a.featuredImageAlt,
      tags: a.tags,
      viewCount: a.viewCount,
      practiceAreaId: a.practiceAreaId,
      specialtyId: a.specialtyId,
      jurisdictionId: a.jurisdictionId,
      status: a.status,
      publishedAt: a.publishedAt,
      authorName: a.authorName,
      readingTimeMinutes: a.readingTimeMinutes,
      content: a.content,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
    const validated = parseOutput(GetArticleBySlugResponse, payload, req.log.error.bind(req.log));
    res.json(validated);
  } catch (err) {
    next(err);
  }
});

export default router;
