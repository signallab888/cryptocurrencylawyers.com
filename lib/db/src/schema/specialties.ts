import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
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
});

export const insertSpecialtySchema = createInsertSchema(specialtiesTable).omit({ id: true });
export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialtiesTable.$inferSelect;
