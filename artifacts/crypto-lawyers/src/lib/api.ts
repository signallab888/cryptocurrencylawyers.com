/**
 * Build-time API client for Astro getStaticPaths and server-side rendering.
 * Uses raw fetch — NOT TanStack Query hooks (those are for React islands at runtime).
 *
 * API_BASE_URL env var overrides the default — set it in production (Coolify/VPS)
 * to the API server's actual address, e.g. http://api:8080/api.
 *
 * Default: localhost:80/api — this goes through the Replit shared reverse proxy,
 * which routes /api → api-server on port 8080. Port 80 is correct here; calling
 * port 8080 directly is disallowed by the workspace proxy rules. Outside Replit,
 * set API_BASE_URL explicitly.
 */
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:80/api";

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`API ${r.status} ${url}`);
  return r.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type SpecialtyItem = {
  id: number;
  slug: string;
  name: string;
  practiceAreaId: number;
  description?: string | null;
  lawyerCount?: number;
};

export type PracticeAreaItem = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  specialties?: SpecialtyItem[];
};

export type JurisdictionItem = {
  id: number;
  slug: string;
  name: string;
  countryCode: string;
  type: "state" | "country" | "province";
  lawyerCount?: number;
};

export type LawyerItem = {
  id: number;
  slug: string;
  name: string;
  firmName?: string | null;
  photoUrl?: string | null;
  bioShort?: string | null;
  locationCity?: string | null;
  locationCountryCode?: string | null;
  yearsExperience?: number | null;
  languages: string[];
  acceptsCryptoPayment: boolean;
  freeConsultation: boolean;
  tier: "free" | "featured" | "premium";
  jurisdictions?: Array<{
    jurisdictionId: number;
    slug: string;
    name: string;
    isPrimary?: boolean;
    presenceLevel: "licensed" | "licensed_inactive" | "serves";
    barStatus: "active" | "inactive" | "retired";
  }>;
  specialties?: Array<{
    id: number;
    slug: string;
    name: string;
    practiceAreaId: number;
  }>;
};

export type LawyerMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ListLawyersParams = {
  specialtySlug?: string;
  jurisdictionSlug?: string;
  practiceAreaSlug?: string;
  tier?: "free" | "featured" | "premium";
  freeConsultation?: boolean;
  page?: number;
  pageSize?: number;
};

// ── Fetchers ──────────────────────────────────────────────────────────────────

export async function listPracticeAreas() {
  return apiFetch<{ data: PracticeAreaItem[] }>("/practice-areas");
}

export async function listSpecialties() {
  return apiFetch<{ data: SpecialtyItem[] }>("/specialties");
}

export async function listJurisdictions(params?: { type?: string; countryCode?: string }) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.countryCode) qs.set("countryCode", params.countryCode);
  const q = qs.size ? `?${qs}` : "";
  return apiFetch<{ data: JurisdictionItem[] }>(`/jurisdictions${q}`);
}

export async function listLawyers(params: ListLawyersParams = {}) {
  const qs = new URLSearchParams();
  if (params.specialtySlug) qs.set("specialtySlug", params.specialtySlug);
  if (params.jurisdictionSlug) qs.set("jurisdictionSlug", params.jurisdictionSlug);
  if (params.practiceAreaSlug) qs.set("practiceAreaSlug", params.practiceAreaSlug);
  if (params.tier) qs.set("tier", params.tier);
  if (params.freeConsultation !== undefined) qs.set("freeConsultation", String(params.freeConsultation));
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const q = qs.size ? `?${qs}` : "";
  return apiFetch<{ data: LawyerItem[]; meta: LawyerMeta }>(`/lawyers${q}`);
}

export type LawyerProfile = Omit<LawyerItem, "specialties" | "jurisdictions"> & {
  emailPublic?: string | null;
  phone?: string | null;
  website?: string | null;
  bioLong?: string | null;
  linkedin?: string | null;
  jurisdictions?: Array<{
    jurisdictionId: number;
    slug: string;
    name: string;
    barNumber?: string | null;
    admittedYear?: number | null;
    isPrimary?: boolean;
    presenceLevel: "licensed" | "licensed_inactive" | "serves";
    barStatus: "active" | "inactive" | "retired";
  }>;
  specialties?: Array<{
    id: number;
    slug: string;
    name: string;
    practiceAreaId: number;
    description?: string | null;
    lawyerCount?: number;
    yearsExperience?: number | null;
    isFeatured?: boolean;
  }>;
};

export async function getLawyerBySlug(slug: string) {
  return apiFetch<LawyerProfile>(`/lawyers/${encodeURIComponent(slug)}`);
}

// ── Articles ──────────────────────────────────────────────────────────────────

export type ArticleSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  featuredImageAlt?: string | null;
  tags: string[];
  viewCount: number;
  practiceAreaId?: number | null;
  specialtyId?: number | null;
  jurisdictionId?: number | null;
  status: "draft" | "published";
  publishedAt?: string | null;
  authorName?: string | null;
  readingTimeMinutes?: number | null;
};

export type ArticleFull = ArticleSummary & {
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticlesParams = {
  practiceAreaSlug?: string;
  specialtySlug?: string;
  jurisdictionSlug?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
};

export type PaginationMeta = { page: number; pageSize: number; total: number; totalPages: number };
/** @deprecated use PaginationMeta */
export type ArticlesMeta = PaginationMeta;
export type LeadMeta = PaginationMeta;

export async function listArticles(params: ArticlesParams = {}) {
  const qs = new URLSearchParams();
  if (params.practiceAreaSlug) qs.set("practiceAreaSlug", params.practiceAreaSlug);
  if (params.specialtySlug) qs.set("specialtySlug", params.specialtySlug);
  if (params.jurisdictionSlug) qs.set("jurisdictionSlug", params.jurisdictionSlug);
  if (params.tag) qs.set("tag", params.tag);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const q = qs.size ? `?${qs}` : "";
  return apiFetch<{ data: ArticleSummary[]; meta: ArticlesMeta }>(`/articles${q}`);
}

export async function getArticleBySlug(slug: string) {
  return apiFetch<ArticleFull>(`/articles/${encodeURIComponent(slug)}`);
}

// ── Admin (auth-gated) ────────────────────────────────────────────────────────

export type LeadAdminItem = {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  caseTypeSpecialtyId?: number | null;
  specialtyName?: string | null;
  jurisdictionId?: number | null;
  jurisdictionName?: string | null;
  budgetRange: "under_10k" | "10k_50k" | "50k_250k" | "250k_plus" | "unknown";
  urgency: "immediate" | "weeks" | "planning";
  description?: string | null;
  sourcePage?: string | null;
  status: "new" | "qualified" | "sold" | "closed" | "spam";
  captchaScore?: number | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  createdAt: string;
  updatedAt: string;
};

async function apiFetchAuth<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`API ${r.status} ${url}`);
  if (r.status === 204) return null as T;
  return r.json() as Promise<T>;
}

export type AdminLeadsParams = {
  status?: "new" | "qualified" | "sold" | "closed" | "spam";
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "status";
  order?: "asc" | "desc";
};

export async function adminListLeads(token: string, params: AdminLeadsParams = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  const q = qs.size ? `?${qs}` : "";
  return apiFetchAuth<{ data: LeadAdminItem[]; meta: LeadMeta }>( token, `/admin/leads${q}`);
}

export async function adminGetLead(token: string, id: number) {
  return apiFetchAuth<LeadAdminItem>(token, `/admin/leads/${id}`);
}

export async function adminPatchLead(token: string, id: number, status: LeadAdminItem["status"]) {
  return apiFetchAuth<LeadAdminItem>(token, `/admin/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
