import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jurisdictionsTable = pgTable("jurisdictions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  countryCode: text("country_code").notNull(),
  type: text("type", { enum: ["state", "country", "province"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertJurisdictionSchema = createInsertSchema(jurisdictionsTable).omit({ id: true });
export type InsertJurisdiction = z.infer<typeof insertJurisdictionSchema>;
export type Jurisdiction = typeof jurisdictionsTable.$inferSelect;
