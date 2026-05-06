import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  setBaseUrl,
  useListLawyers,
  useListSpecialties,
  useListJurisdictions,
} from "@workspace/api-client-react";

// Configure the fetch client to use /api as the base path (Replit proxy → api-server)
setBaseUrl("/api");

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

interface Filters {
  specialtySlug: string;
  jurisdictionSlug: string;
  freeConsultation: boolean;
  acceptsCryptoPayment: boolean;
  page: number;
}

interface Props {
  initialSpecialtySlug?: string;
  initialJurisdictionSlug?: string;
}

function LawyerSearch({ initialSpecialtySlug, initialJurisdictionSlug }: Props) {
  const [filters, setFilters] = useState<Filters>({
    specialtySlug: initialSpecialtySlug ?? "",
    jurisdictionSlug: initialJurisdictionSlug ?? "",
    freeConsultation: false,
    acceptsCryptoPayment: false,
    page: 1,
  });

  // Sync URL whenever filters change (replaceState — no history entry)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.specialtySlug) params.set("specialtySlug", filters.specialtySlug);
    if (filters.jurisdictionSlug) params.set("jurisdictionSlug", filters.jurisdictionSlug);
    if (filters.freeConsultation) params.set("freeConsultation", "true");
    if (filters.acceptsCryptoPayment) params.set("acceptsCryptoPayment", "true");
    if (filters.page > 1) params.set("page", String(filters.page));
    const qs = params.size ? `?${params}` : "";
    window.history.replaceState(null, "", `${window.location.pathname}${qs}`);
  }, [filters]);

  const setFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    },
    []
  );

  // Data hooks
  const { data: specialtiesData } = useListSpecialties();
  const { data: jurisdictionsData } = useListJurisdictions();
  const {
    data: lawyersData,
    isLoading,
    isError,
  } = useListLawyers({
    ...(filters.specialtySlug ? { specialtySlug: filters.specialtySlug } : {}),
    ...(filters.jurisdictionSlug ? { jurisdictionSlug: filters.jurisdictionSlug } : {}),
    ...(filters.freeConsultation ? { freeConsultation: true } : {}),
    ...(filters.acceptsCryptoPayment ? { acceptsCryptoPayment: true } : {}),
    page: filters.page,
    pageSize: 20,
  });

  const lawyers = lawyersData?.data ?? [];
  const meta = lawyersData?.meta;
  const specialties = specialtiesData?.data ?? [];
  const jurisdictions = jurisdictionsData?.data ?? [];
  const hasActiveFilters =
    !!filters.specialtySlug ||
    !!filters.jurisdictionSlug ||
    filters.freeConsultation ||
    filters.acceptsCryptoPayment;

  const resetFilters = () =>
    setFilters({ specialtySlug: "", jurisdictionSlug: "", freeConsultation: false, acceptsCryptoPayment: false, page: 1 });

  return (
    <div>
      {/* ── FILTER BAR ─────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-bg-secondary p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Specialty */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Specialty
            </label>
            <select
              value={filters.specialtySlug}
              onChange={(e) => setFilter("specialtySlug", e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Jurisdiction */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Jurisdiction
            </label>
            <select
              value={filters.jurisdictionSlug}
              onChange={(e) => setFilter("jurisdictionSlug", e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">All jurisdictions</option>
              {jurisdictions.map((j) => (
                <option key={j.id} value={j.slug}>
                  {j.name}{j.type === "state" || j.type === "province" ? `, ${j.countryCode}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.freeConsultation}
                onChange={(e) => setFilter("freeConsultation", e.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg-primary text-accent accent-accent"
              />
              <span className="text-sm text-text-secondary whitespace-nowrap">Free consult</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.acceptsCryptoPayment}
                onChange={(e) => setFilter("acceptsCryptoPayment", e.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg-primary text-accent accent-accent"
              />
              <span className="text-sm text-text-secondary whitespace-nowrap">Crypto payment</span>
            </label>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-accent-muted hover:text-accent-light underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── RESULTS COUNT ──────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {isLoading ? (
            "Searching…"
          ) : isError ? (
            <span className="text-red-400">Error loading results</span>
          ) : meta ? (
            <>
              <span className="font-medium text-text-primary">{meta.total}</span>{" "}
              {meta.total === 1 ? "attorney" : "attorneys"} found
            </>
          ) : null}
        </p>
      </div>

      {/* ── RESULTS GRID ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-bg-secondary p-5 h-40" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-10 text-center">
          <p className="text-text-secondary text-sm">Failed to load attorneys. Please try again.</p>
          <button
            onClick={() => setFilters((f) => ({ ...f }))}
            className="mt-3 text-sm text-accent-muted hover:text-accent-light underline"
          >
            Retry
          </button>
        </div>
      ) : lawyers.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-secondary p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <svg className="h-6 w-6 text-accent-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
          </div>
          <h3 className="font-semibold text-text-primary mb-2">
            {hasActiveFilters ? "No attorneys match your filters" : "No attorneys listed yet"}
          </h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? "Try removing some filters or broadening your search."
              : "We're onboarding verified attorneys. Check back soon or submit a request and we'll match you manually."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="text-sm font-medium text-accent-muted hover:text-accent-light underline"
            >
              Clear all filters
            </button>
          ) : (
            <a
              href="/find-a-lawyer"
              className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Get Matched
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lawyers.map((lawyer) => (
            <a
              key={lawyer.id}
              href={`/lawyers/${lawyer.slug}`}
              className="group rounded-xl border border-border bg-bg-secondary p-5 transition-all hover:border-accent/40 hover:bg-surface-accent"
            >
              <div className="flex items-start gap-3 mb-3">
                {lawyer.photoUrl ? (
                  <img src={lawyer.photoUrl} alt={lawyer.name}
                    className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-muted font-bold text-sm">
                    {lawyer.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-text-primary group-hover:text-accent-muted truncate text-sm">
                    {lawyer.name}
                  </h3>
                  {lawyer.firmName && (
                    <p className="text-xs text-text-secondary truncate">{lawyer.firmName}</p>
                  )}
                  {lawyer.locationCity && (
                    <p className="text-xs text-text-muted">
                      {[lawyer.locationCity, lawyer.locationCountryCode].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {lawyer.bioShort && (
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
                  {lawyer.bioShort}
                </p>
              )}

              {(lawyer.specialties?.length ?? 0) > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {lawyer.specialties!.slice(0, 2).map((s) => (
                    <span key={s.id} className="rounded-full bg-bg-primary border border-border px-2 py-0.5 text-xs text-text-muted">
                      {s.name}
                    </span>
                  ))}
                  {(lawyer.specialties?.length ?? 0) > 2 && (
                    <span className="rounded-full bg-bg-primary border border-border px-2 py-0.5 text-xs text-text-muted">
                      +{lawyer.specialties!.length - 2}
                    </span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {lawyer.freeConsultation && (
                  <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                    Free consult
                  </span>
                )}
                {lawyer.acceptsCryptoPayment && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent-muted">
                    Crypto pay
                  </span>
                )}
                {lawyer.tier === "featured" && (
                  <span className="rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-400">
                    Featured
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ── PAGINATION ─────────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page <= 1}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary disabled:opacity-40 hover:bg-surface disabled:hover:bg-transparent transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setFilters((f) => ({ ...f, page }))}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    filters.page === page
                      ? "bg-accent text-white"
                      : "border border-border text-text-secondary hover:bg-surface"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {meta.totalPages > 7 && (
              <span className="px-1 text-text-muted">…</span>
            )}
          </div>

          <button
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            disabled={filters.page >= meta.totalPages}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary disabled:opacity-40 hover:bg-surface disabled:hover:bg-transparent transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function LawyerSearchIsland(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <LawyerSearch {...props} />
    </QueryClientProvider>
  );
}
