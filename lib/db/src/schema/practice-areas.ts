import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const practiceAreasTable = pgTable("practice_areas", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertPracticeAreaSchema = createInsertSchema(practiceAreasTable).omit({ id: true });
export type InsertPracticeArea = z.infer<typeof insertPracticeAreaSchema>;
export type PracticeArea = typeof practiceAreasTable.$inferSelect;
