# CryptocurrencyLawyers.com

SEO-first lawyer directory for cryptocurrency/blockchain attorneys with freemium listings and lead-gen monetization. Target domain: cryptocurrencylawyers.com. Portable to VPS/Coolify — no Replit-specific dependencies.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/crypto-lawyers run dev` — run Astro frontend locally

Required env vars: `DATABASE_URL` (others optional; see `artifacts/crypto-lawyers/.env.example`)

## Stack

- **Frontend**: Astro 6.2.2 + React islands + Tailwind v4 (`@tailwindcss/vite` plugin)
- **Backend**: Express 5 + Pino logging
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API contract**: OpenAPI 3.1 → Orval codegen → React Query hooks + Zod schemas
- **Auth**: Clerk (`@clerk/astro` v3; only activated when `PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` are set)
- **Captcha**: Cloudflare Turnstile (skipped in dev if key missing)
- **Build**: esbuild (API), Astro build (frontend)
- **Monorepo**: pnpm workspaces, Node 24

## Where things live

```
artifacts/
  api-server/src/routes/   — Express route handlers (admin/, articles.ts, lawyers.ts, leads.ts …)
  crypto-lawyers/src/
    layouts/BaseLayout.astro — OG meta, JSON-LD, canonical
    middleware.ts            — Clerk session middleware (conditional on CLERK_SECRET_KEY)
    pages/
      index.astro                              — home
      articles/index.astro                     — articles list (SSG)
      articles/[slug].astro                    — article detail (SSG, Article JSON-LD)
      lawyers/index.astro                      — lawyer search (SSR + LawyerSearchIsland)
      lawyers/[slug].astro                     — attorney profile (SSG, Attorney JSON-LD)
      practice-areas/[slug].astro              — practice area (SSG)
      specialties/[slug].astro                 — specialty overview (SSG)
      specialties/[specialty]/[jurisdiction].astro — SEO gold page (SSG, LegalService + FAQPage JSON-LD)
      jurisdictions/[slug].astro               — jurisdiction overview (SSG)
      find-a-lawyer.astro                      — lead-capture form (SSG + LeadFormIsland)
      admin/leads/index.astro                  — leads dashboard (SSR, Clerk-gated)
      admin/leads/[id].astro                   — lead detail + PATCH status (SSR, Clerk-gated)
      admin/sign-in.astro                      — Clerk sign-in widget
    components/              — Nav.astro, Footer.astro, React islands
    lib/api.ts               — build-time fetch client (all types + admin auth functions)
    styles/global.css        — Tailwind v4 @theme design tokens
lib/
  db/src/schema.ts           — Drizzle schema (source of truth)
  api-spec/openapi.yaml      — OpenAPI 3.1 contract
  api-zod/src/generated/     — Zod schemas (generated)
  api-client-react/src/generated/ — React Query hooks (generated)
```

## Architecture decisions

- **Astro output: server + prerender per-page**: SSR for admin + search; `prerender=true` for all public pages
- **Contract-first API**: OpenAPI spec drives both server validation (Zod) and client hooks (React Query) via Orval codegen
- **Clerk conditional**: `clerk()` integration + `clerkMiddleware()` only activated when `PUBLIC_CLERK_PUBLISHABLE_KEY` is set — avoids client-side errors in dev without keys
- **Anti-N+1 specialty/jurisdiction**: `getStaticPaths` does 3 parallel fetches (specialties, jurisdictions, allLawyers) then groups in memory — generates all 1,342 SEO pages at build time
- **No Replit plugins**: removed `@replit/vite-plugin-*` so the build is portable to any Node host

## Product

- Public directory: browse lawyers by practice area, jurisdiction, specialty
- SEO gold pages: `/specialties/[specialty]/[jurisdiction]` — 1,342 pages with LegalService + FAQPage schema
- Articles/blog: `/articles` index + `/articles/[slug]` with Article JSON-LD
- Lead capture: `/find-a-lawyer` form → POST /api/leads (Turnstile captcha in prod)
- Newsletter subscription: POST /api/newsletter/subscribe
- Admin panel: `/admin/leads` — Clerk-gated dashboard + lead detail + status PATCH

## User preferences

- GitHub repo: `signallab888/cryptocurrencylawyers.com`, main branch
- Push via GitHub REST API (git commit blocked by Replit platform)
- Zod import: use `zod` (not `zod/v4`) in api-server
- No emojis in UI copy

## Gotchas

- **CSS @import order**: Google Fonts `@import url(...)` must come BEFORE `@import "tailwindcss"` in global.css
- **Astro build outDir**: set to `./dist/public` to match artifact.toml `publicDir`
- **PORT**: crypto-lawyers uses PORT=23588 (set in artifact.toml env); `astro dev --port $PORT` reads it
- **Lawyers pageSize max**: 100 (not 1000) — `getStaticPaths` in specialty/jurisdiction paginates with `while` loop
- **Astro getStaticPaths scope**: helper functions must be declared INSIDE `getStaticPaths`, not in module scope above it
- `pnpm run dev` at workspace root has no script — use workflows or `--filter`
- Admin routes return 401 (not 403) when Clerk keys missing — by design

## Pointers

- API endpoints: `artifacts/api-server/src/routes/`
- DB schema: `lib/db/src/schema.ts`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Design tokens: `artifacts/crypto-lawyers/src/styles/global.css`
- Frontend env template: `artifacts/crypto-lawyers/.env.example`
