# CryptocurrencyLawyers.com

SEO-first lawyer directory for cryptocurrency/blockchain attorneys with freemium listings and lead-gen monetization. Target domain: cryptocurrencylawyers.com. Portable to VPS/Coolify — no Replit-specific dependencies.

## Run & Operate

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/crypto-lawyers run dev` — run Astro frontend locally

Required env vars: `DATABASE_URL` (others optional; see api-server `.env.example`)

## Stack

- **Frontend**: Astro 6.2.2 + React islands + Tailwind v4 (`@tailwindcss/vite` plugin)
- **Backend**: Express 5 + Pino logging
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API contract**: OpenAPI 3.1 → Orval codegen → React Query hooks + Zod schemas
- **Auth**: Clerk (optional; admin routes gate on `CLERK_SECRET_KEY` presence)
- **Captcha**: Cloudflare Turnstile (skipped in dev if key missing)
- **Build**: esbuild (API), Astro build (frontend)
- **Monorepo**: pnpm workspaces, Node 24

## Where things live

```
artifacts/
  api-server/src/routes/   — all 11 Express route handlers
  crypto-lawyers/src/
    layouts/BaseLayout.astro — OG meta, JSON-LD, canonical
    pages/index.astro        — static home page
    components/              — Nav.astro, Footer.astro, React islands
    styles/global.css        — Tailwind v4 @theme design tokens
lib/
  db/src/schema.ts           — Drizzle schema (source of truth)
  api-spec/openapi.yaml      — OpenAPI 3.1 contract
  api-zod/src/generated/     — Zod schemas (generated)
  api-client-react/src/generated/ — React Query hooks (generated)
```

## Architecture decisions

- **Astro static-first**: `output: 'static'` for all public pages; switch to hybrid when admin SSR is needed
- **Contract-first API**: OpenAPI spec drives both server validation (Zod) and client hooks (React Query) via Orval codegen
- **Clerk conditional**: `clerkMiddleware()` only applied when `CLERK_SECRET_KEY` is set, so dev works without keys
- **Anti-N+1 lawyers endpoint**: single JOIN query + in-memory grouping for specialties/jurisdictions
- **No Replit plugins**: removed `@replit/vite-plugin-*` so the build is portable to any Node host

## Product

- Public directory: browse lawyers by practice area, jurisdiction, specialty
- Lead capture: `/find-a-lawyer` form → POST /api/leads (Turnstile captcha in prod)
- Newsletter subscription: POST /api/newsletter/subscribe
- Articles/blog: SEO content pages
- Admin panel: authenticated lead management (Clerk)
- Freemium tiers: free listing + premium featured placement (future Stripe integration)

## User preferences

- GitHub repo: `signallab888/cryptocurrencylawyers.com`, main branch
- Push via GitHub REST API (git commit blocked by Replit platform)
- Zod import: use `zod` (not `zod/v4`) in api-server
- No emojis in UI copy

## Gotchas

- **CSS @import order**: Google Fonts `@import url(...)` must come BEFORE `@import "tailwindcss"` in global.css
- **Astro build outDir**: set to `./dist/public` to match artifact.toml `publicDir`
- **PORT**: crypto-lawyers uses PORT=23588 (set in artifact.toml env); `astro dev --port $PORT` reads it
- `pnpm run dev` at workspace root has no script — use workflows or `--filter`
- Admin routes return 401 (not 403) when Clerk keys missing — by design

## Pointers

- API endpoints: `artifacts/api-server/src/routes/`
- DB schema: `lib/db/src/schema.ts`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Design tokens: `artifacts/crypto-lawyers/src/styles/global.css`
