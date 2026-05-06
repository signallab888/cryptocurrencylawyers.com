import { pgTable, text, serial, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { jurisdictionTypeEnum } from "./enums";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jurisdictionsTable = pgTable("jurisdictions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  countryCode: text("country_code").notNull(),
  type: jurisdictionTypeEnum("type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("jurisdictions_country_code_idx").on(t.countryCode),
]);

export const insertJurisdictionSchema = createInsertSchema(jurisdictionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJurisdiction = z.infer<typeof insertJurisdictionSchema>;
export type Jurisdiction = typeof jurisdictionsTable.$inferSelect;
