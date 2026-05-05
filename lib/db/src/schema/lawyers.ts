import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
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
  phone: text("phone"),
  website: text("website"),
  linkedin: text("linkedin"),
  twitter: text("twitter"),
  yearsExperience: integer("years_experience"),
  languages: text("languages").array().notNull().default([]),
  status: text("status", { enum: ["draft", "pending_review", "published", "suspended"] }).notNull().default("draft"),
  tier: text("tier", { enum: ["free", "featured", "premium"] }).notNull().default("free"),
  featuredUntil: timestamp("featured_until", { withTimezone: true }),
  claimedByUserId: text("claimed_by_user_id"),
  createdBy: text("created_by", { enum: ["admin", "self_signup", "claimed"] }).notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLawyerSchema = createInsertSchema(lawyersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLawyer = z.infer<typeof insertLawyerSchema>;
export type Lawyer = typeof lawyersTable.$inferSelect;
