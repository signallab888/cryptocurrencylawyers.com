CREATE TYPE "public"."article_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."bar_status" AS ENUM('active', 'inactive', 'retired');--> statement-breakpoint
CREATE TYPE "public"."budget_range" AS ENUM('under_10k', '10k_50k', '50k_250k', '250k_plus', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_type" AS ENUM('state', 'country', 'province');--> statement-breakpoint
CREATE TYPE "public"."lawyer_created_by" AS ENUM('admin', 'self_signup', 'claimed');--> statement-breakpoint
CREATE TYPE "public"."lawyer_status" AS ENUM('draft', 'pending_review', 'published', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."lawyer_tier" AS ENUM('free', 'featured', 'premium');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'qualified', 'sold', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."presence_level" AS ENUM('licensed', 'licensed_inactive', 'serves');--> statement-breakpoint
CREATE TYPE "public"."purchase_type" AS ENUM('exclusive', 'shared');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('immediate', 'weeks', 'planning');--> statement-breakpoint
CREATE TABLE "lawyers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"firm_name" text,
	"photo_url" text,
	"bio_short" text,
	"bio_long" text,
	"email_public" text,
	"contact_email" text NOT NULL,
	"phone" text,
	"website" text,
	"linkedin" text,
	"twitter" text,
	"years_experience" integer,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"location_city" text,
	"location_country_code" text,
	"accepts_crypto_payment" boolean DEFAULT false NOT NULL,
	"free_consultation" boolean DEFAULT false NOT NULL,
	"profile_views_count" integer DEFAULT 0 NOT NULL,
	"status" "lawyer_status" DEFAULT 'draft' NOT NULL,
	"tier" "lawyer_tier" DEFAULT 'free' NOT NULL,
	"featured_until" timestamp with time zone,
	"claimed_by_user_id" text,
	"created_by" "lawyer_created_by" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lawyers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jurisdictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country_code" text NOT NULL,
	"type" "jurisdiction_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jurisdictions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lawyer_jurisdictions" (
	"lawyer_id" integer NOT NULL,
	"jurisdiction_id" integer NOT NULL,
	"bar_number" text,
	"admitted_year" integer,
	"is_primary" boolean DEFAULT false NOT NULL,
	"presence_level" "presence_level" DEFAULT 'licensed' NOT NULL,
	"bar_status" "bar_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lawyer_jurisdictions_lawyer_id_jurisdiction_id_pk" PRIMARY KEY("lawyer_id","jurisdiction_id")
);
--> statement-breakpoint
CREATE TABLE "practice_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "specialties" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"practice_area_id" integer NOT NULL,
	"seo_meta_title" text,
	"seo_meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specialties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lawyer_specialties" (
	"lawyer_id" integer NOT NULL,
	"specialty_id" integer NOT NULL,
	"years_experience" integer,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lawyer_specialties_lawyer_id_specialty_id_pk" PRIMARY KEY("lawyer_id","specialty_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"client_phone" text,
	"case_type_specialty_id" integer,
	"jurisdiction_id" integer,
	"budget_range" "budget_range" DEFAULT 'unknown' NOT NULL,
	"urgency" "urgency" DEFAULT 'planning' NOT NULL,
	"description" text,
	"source_page" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"captcha_score" real,
	"ip_address" text,
	"user_agent" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"lawyer_id" integer NOT NULL,
	"amount_paid" numeric(10, 2),
	"purchase_type" "purchase_type" DEFAULT 'shared' NOT NULL,
	"stripe_payment_id" text,
	"notified_at" timestamp with time zone,
	"contacted_client_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image_url" text,
	"featured_image_alt" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"practice_area_id" integer,
	"specialty_id" integer,
	"jurisdiction_id" integer,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"author_name" text,
	"reading_time_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source_page" text,
	"confirmed" boolean DEFAULT false NOT NULL,
	"confirmation_token" text,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "newsletter_subscribers_confirmation_token_unique" UNIQUE("confirmation_token")
);
--> statement-breakpoint
ALTER TABLE "lawyer_jurisdictions" ADD CONSTRAINT "lawyer_jurisdictions_lawyer_id_lawyers_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_jurisdictions" ADD CONSTRAINT "lawyer_jurisdictions_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialties" ADD CONSTRAINT "specialties_practice_area_id_practice_areas_id_fk" FOREIGN KEY ("practice_area_id") REFERENCES "public"."practice_areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_specialties" ADD CONSTRAINT "lawyer_specialties_lawyer_id_lawyers_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_specialties" ADD CONSTRAINT "lawyer_specialties_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_case_type_specialty_id_specialties_id_fk" FOREIGN KEY ("case_type_specialty_id") REFERENCES "public"."specialties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_lawyer_id_lawyers_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_practice_area_id_practice_areas_id_fk" FOREIGN KEY ("practice_area_id") REFERENCES "public"."practice_areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lawyers_status_idx" ON "lawyers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lawyers_tier_idx" ON "lawyers" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "lawyers_claimed_by_idx" ON "lawyers" USING btree ("claimed_by_user_id");--> statement-breakpoint
CREATE INDEX "jurisdictions_country_code_idx" ON "jurisdictions" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "specialties_practice_area_idx" ON "specialties" USING btree ("practice_area_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_matching_idx" ON "leads" USING btree ("case_type_specialty_id","jurisdiction_id");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_purchases_lawyer_idx" ON "lead_purchases" USING btree ("lawyer_id");--> statement-breakpoint
CREATE INDEX "lead_purchases_lead_idx" ON "lead_purchases" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "articles_specialty_idx" ON "articles" USING btree ("specialty_id");--> statement-breakpoint
CREATE INDEX "articles_jurisdiction_idx" ON "articles" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "articles_practice_area_idx" ON "articles" USING btree ("practice_area_id");