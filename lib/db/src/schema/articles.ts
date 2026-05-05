import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { practiceAreasTable } from "./practice-areas";
import { specialtiesTable } from "./specialties";
import { jurisdictionsTable } from "./jurisdictions";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  practiceAreaId: integer("practice_area_id").references(() => practiceAreasTable.id, { onDelete: "set null" }),
  specialtyId: integer("specialty_id").references(() => specialtiesTable.id, { onDelete: "set null" }),
  jurisdictionId: integer("jurisdiction_id").references(() => jurisdictionsTable.id, { onDelete: "set null" }),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  authorName: text("author_name"),
  readingTimeMinutes: integer("reading_time_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
