import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { practiceAreasTable } from "./practice-areas";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const specialtiesTable = pgTable("specialties", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  practiceAreaId: integer("practice_area_id").notNull().references(() => practiceAreasTable.id, { onDelete: "restrict" }),
  seoMetaTitle: text("seo_meta_title"),
  seoMetaDescription: text("seo_meta_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("specialties_practice_area_idx").on(t.practiceAreaId),
]);

export const insertSpecialtySchema = createInsertSchema(specialtiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialtiesTable.$inferSelect;
