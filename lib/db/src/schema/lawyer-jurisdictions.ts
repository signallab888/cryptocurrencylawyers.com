import { pgTable, text, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { lawyersTable } from "./lawyers";
import { jurisdictionsTable } from "./jurisdictions";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lawyerJurisdictionsTable = pgTable("lawyer_jurisdictions", {
  lawyerId: integer("lawyer_id").notNull().references(() => lawyersTable.id, { onDelete: "cascade" }),
  jurisdictionId: integer("jurisdiction_id").notNull().references(() => jurisdictionsTable.id, { onDelete: "cascade" }),
  barNumber: text("bar_number"),
  admittedYear: integer("admitted_year"),
  isPrimary: boolean("is_primary").notNull().default(false),
  presenceLevel: text("presence_level", { enum: ["licensed", "licensed_inactive", "serves"] }).notNull().default("licensed"),
}, (t) => [primaryKey({ columns: [t.lawyerId, t.jurisdictionId] })]);

export const insertLawyerJurisdictionSchema = createInsertSchema(lawyerJurisdictionsTable);
export type InsertLawyerJurisdiction = z.infer<typeof insertLawyerJurisdictionSchema>;
export type LawyerJurisdiction = typeof lawyerJurisdictionsTable.$inferSelect;
