import { pgTable, text, integer, boolean, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { lawyersTable } from "./lawyers";
import { jurisdictionsTable } from "./jurisdictions";
import { presenceLevelEnum, barStatusEnum } from "./enums";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lawyerJurisdictionsTable = pgTable("lawyer_jurisdictions", {
  lawyerId: integer("lawyer_id").notNull().references(() => lawyersTable.id, { onDelete: "cascade" }),
  jurisdictionId: integer("jurisdiction_id").notNull().references(() => jurisdictionsTable.id, { onDelete: "restrict" }),
  barNumber: text("bar_number"),
  admittedYear: integer("admitted_year"),
  isPrimary: boolean("is_primary").notNull().default(false),
  presenceLevel: presenceLevelEnum("presence_level").notNull().default("licensed"),
  barStatus: barStatusEnum("bar_status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.lawyerId, t.jurisdictionId] })]);

export const insertLawyerJurisdictionSchema = createInsertSchema(lawyerJurisdictionsTable).omit({ createdAt: true });
export type InsertLawyerJurisdiction = z.infer<typeof insertLawyerJurisdictionSchema>;
export type LawyerJurisdiction = typeof lawyerJurisdictionsTable.$inferSelect;
