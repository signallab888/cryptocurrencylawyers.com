import { pgEnum } from "drizzle-orm/pg-core";

export const lawyerStatusEnum = pgEnum("lawyer_status", ["draft", "pending_review", "published", "suspended"]);
export const lawyerTierEnum = pgEnum("lawyer_tier", ["free", "featured", "premium"]);
export const lawyerCreatedByEnum = pgEnum("lawyer_created_by", ["admin", "self_signup", "claimed"]);

export const jurisdictionTypeEnum = pgEnum("jurisdiction_type", ["state", "country", "province"]);

export const presenceLevelEnum = pgEnum("presence_level", ["licensed", "licensed_inactive", "serves"]);
export const barStatusEnum = pgEnum("bar_status", ["active", "inactive", "retired"]);

export const budgetRangeEnum = pgEnum("budget_range", ["under_10k", "10k_50k", "50k_250k", "250k_plus", "unknown"]);
export const urgencyEnum = pgEnum("urgency", ["immediate", "weeks", "planning"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "qualified", "sold", "closed", "spam"]);

export const purchaseTypeEnum = pgEnum("purchase_type", ["exclusive", "shared"]);

export const articleStatusEnum = pgEnum("article_status", ["draft", "published"]);
