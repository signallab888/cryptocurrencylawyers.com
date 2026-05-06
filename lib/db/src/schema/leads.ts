import { pgTable, text, serial, integer, real, timestamp, index } from "drizzle-orm/pg-core";
import { specialtiesTable } from "./specialties";
import { jurisdictionsTable } from "./jurisdictions";
import { budgetRangeEnum, urgencyEnum, leadStatusEnum } from "./enums";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  caseTypeSpecialtyId: integer("case_type_specialty_id").references(() => specialtiesTable.id, { onDelete: "set null" }),
  jurisdictionId: integer("jurisdiction_id").references(() => jurisdictionsTable.id, { onDelete: "set null" }),
  budgetRange: budgetRangeEnum("budget_range").notNull().default("unknown"),
  urgency: urgencyEnum("urgency").notNull().default("planning"),
  description: text("description"),
  sourcePage: text("source_page"),
  status: leadStatusEnum("status").notNull().default("new"),
  captchaScore: real("captcha_score"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("leads_status_idx").on(t.status),
  index("leads_matching_idx").on(t.caseTypeSpecialtyId, t.jurisdictionId),
  index("leads_created_at_idx").on(t.createdAt),
]);

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true, status: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
