import { pgTable, serial, integer, numeric, text, timestamp, index } from "drizzle-orm/pg-core";
import { leadsTable } from "./leads";
import { lawyersTable } from "./lawyers";
import { purchaseTypeEnum } from "./enums";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadPurchasesTable = pgTable("lead_purchases", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leadsTable.id, { onDelete: "cascade" }),
  lawyerId: integer("lawyer_id").notNull().references(() => lawyersTable.id, { onDelete: "restrict" }),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull(),
  purchaseType: purchaseTypeEnum("purchase_type").notNull().default("shared"),
  stripePaymentId: text("stripe_payment_id"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  contactedClientAt: timestamp("contacted_client_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("lead_purchases_lawyer_idx").on(t.lawyerId),
  index("lead_purchases_lead_idx").on(t.leadId),
]);

export const insertLeadPurchaseSchema = createInsertSchema(leadPurchasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLeadPurchase = z.infer<typeof insertLeadPurchaseSchema>;
export type LeadPurchase = typeof leadPurchasesTable.$inferSelect;
