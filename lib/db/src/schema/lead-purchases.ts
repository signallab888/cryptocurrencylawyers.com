import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { leadsTable } from "./leads";
import { lawyersTable } from "./lawyers";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadPurchasesTable = pgTable("lead_purchases", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leadsTable.id, { onDelete: "cascade" }),
  lawyerId: integer("lawyer_id").notNull().references(() => lawyersTable.id, { onDelete: "cascade" }),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }),
  purchaseType: text("purchase_type", { enum: ["exclusive", "shared"] }).notNull().default("shared"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadPurchaseSchema = createInsertSchema(leadPurchasesTable).omit({ id: true, createdAt: true });
export type InsertLeadPurchase = z.infer<typeof insertLeadPurchaseSchema>;
export type LeadPurchase = typeof leadPurchasesTable.$inferSelect;
