import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { specialtiesTable } from "./specialties";
import { jurisdictionsTable } from "./jurisdictions";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  caseTypeSpecialtyId: integer("case_type_specialty_id").references(() => specialtiesTable.id, { onDelete: "set null" }),
  jurisdictionId: integer("jurisdiction_id").references(() => jurisdictionsTable.id, { onDelete: "set null" }),
  budgetRange: text("budget_range", { enum: ["under_10k", "10k_50k", "50k_250k", "250k_plus", "unknown"] }).notNull().default("unknown"),
  urgency: text("urgency", { enum: ["immediate", "weeks", "planning"] }).notNull().default("planning"),
  description: text("description"),
  sourcePage: text("source_page"),
  status: text("status", { enum: ["new", "qualified", "sold", "closed", "spam"] }).notNull().default("new"),
  captchaScore: real("captcha_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, status: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
