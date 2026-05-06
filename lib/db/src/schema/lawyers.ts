import { pgTable, text, serial, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { lawyerStatusEnum, lawyerTierEnum, lawyerCreatedByEnum } from "./enums";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lawyersTable = pgTable("lawyers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  firmName: text("firm_name"),
  photoUrl: text("photo_url"),
  bioShort: text("bio_short"),
  bioLong: text("bio_long"),
  emailPublic: text("email_public"),
  contactEmail: text("contact_email").notNull(),
  phone: text("phone"),
  website: text("website"),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  yearsExperience: integer("years_experience"),
  languages: text("languages").array().notNull().default([]),
  locationCity: text("location_city"),
  locationCountryCode: text("location_country_code"),
  acceptsCryptoPayment: boolean("accepts_crypto_payment").notNull().default(false),
  freeConsultation: boolean("free_consultation").notNull().default(false),
  profileViewsCount: integer("profile_views_count").notNull().default(0),
  status: lawyerStatusEnum("status").notNull().default("draft"),
  tier: lawyerTierEnum("tier").notNull().default("free"),
  featuredUntil: timestamp("featured_until", { withTimezone: true }),
  claimedByUserId: text("claimed_by_user_id"),
  createdBy: lawyerCreatedByEnum("created_by").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("lawyers_status_idx").on(t.status),
  index("lawyers_tier_idx").on(t.tier),
  index("lawyers_claimed_by_idx").on(t.claimedByUserId),
]);

export const insertLawyerSchema = createInsertSchema(lawyersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLawyer = z.infer<typeof insertLawyerSchema>;
export type Lawyer = typeof lawyersTable.$inferSelect;
