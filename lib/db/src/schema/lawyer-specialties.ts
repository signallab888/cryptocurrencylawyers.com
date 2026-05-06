import { pgTable, integer, boolean, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { lawyersTable } from "./lawyers";
import { specialtiesTable } from "./specialties";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lawyerSpecialtiesTable = pgTable("lawyer_specialties", {
  lawyerId: integer("lawyer_id").notNull().references(() => lawyersTable.id, { onDelete: "cascade" }),
  specialtyId: integer("specialty_id").notNull().references(() => specialtiesTable.id, { onDelete: "restrict" }),
  yearsExperience: integer("years_experience"),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.lawyerId, t.specialtyId] })]);

export const insertLawyerSpecialtySchema = createInsertSchema(lawyerSpecialtiesTable).omit({ createdAt: true });
export type InsertLawyerSpecialty = z.infer<typeof insertLawyerSpecialtySchema>;
export type LawyerSpecialty = typeof lawyerSpecialtiesTable.$inferSelect;
