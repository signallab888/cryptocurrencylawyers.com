import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Types matching api.ts (passed as props, not re-fetched) ──────────────────

interface SpecialtyItem {
  id: number;
  slug: string;
  name: string;
  practiceAreaId: number;
}

interface JurisdictionItem {
  id: number;
  slug: string;
  name: string;
  countryCode: string;
  type: "state" | "country" | "province";
}

interface Props {
  specialties: SpecialtyItem[];
  jurisdictions: JurisdictionItem[];
}

// ── Form validation schema ────────────────────────────────────────────────────

const schema = z.object({
  clientName: z.string().min(2, "Name must be at least 2 characters").max(200),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientPhone: z.string().optional(),
  caseTypeSpecialtyId: z.number().optional(),
  jurisdictionId: z.number().optional(),
  budgetRange: z
    .enum(["under_10k", "10k_50k", "50k_250k", "250k_plus", "unknown"])
    .optional(),
  urgency: z.enum(["immediate", "weeks", "planning"]).optional(),
  description: z.string().max(5000, "Description must be under 5,000 characters").optional(),
});

type FormValues = z.infer<typeof schema>;

const BUDGET_OPTIONS = [
  { value: "under_10k", label: "Under $10,000" },
  { value: "10k_50k", label: "$10,000 – $50,000" },
  { value: "50k_250k", label: "$50,000 – $250,000" },
  { value: "250k_plus", label: "$250,000+" },
  { value: "unknown", label: "Not sure yet" },
] as const;

const URGENCY_OPTIONS = [
  { value: "immediate", label: "Immediate (days)" },
  { value: "weeks", label: "Within a few weeks" },
  { value: "planning", label: "Just planning ahead" },
] as const;

// ── Turnstile helpers ─────────────────────────────────────────────────────────

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, opts: object) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LeadFormIsland({ specialties, jurisdictions }: Props) {
  // Vite/Astro exposes PUBLIC_ vars on import.meta.env at build time
  const siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;

  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Capture UTMs + referrer from URL on mount (stored in a ref, not form state)
  const leadMetaRef = useRef<{
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    sourcePage?: string;
  }>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    leadMetaRef.current = {
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      sourcePage: window.location.href,
    };
  }, []);

  // Mount Turnstile widget once the script loads
  useEffect(() => {
    if (!siteKey || !turnstileRef.current) return;

    function tryMount() {
      if (!window.turnstile || !turnstileRef.current) return;
      if (widgetIdRef.current) return; // already mounted
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: siteKey,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
      });
    }

    // Script might already be loaded
    tryMount();

    // Or wait for it
    const id = setInterval(() => {
      if (window.turnstile) {
        tryMount();
        clearInterval(id);
      }
    }, 200);

    return () => clearInterval(id);
  }, [siteKey]);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const meta = leadMetaRef.current;
    const token = siteKey ? turnstileToken : "dev-bypass";

    if (siteKey && !token) {
      setServerError("Please complete the captcha before submitting.");
      return;
    }

    const body = {
      ...data,
      turnstileToken: token,
      ...meta,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        window.location.href = "/thank-you";
        return;
      }

      if (res.status === 422) {
        // Captcha failed — reset widget
        if (siteKey && widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
          setTurnstileToken("");
        }
        setServerError("Captcha verification failed. Please try again.");
        return;
      }

      const payload = await res.json().catch(() => ({}));
      setServerError(
        (payload as { message?: string }).message ??
          "Something went wrong. Please try again."
      );
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-xl border border-border bg-bg-secondary p-6 space-y-5"
    >
      <h2 className="text-lg font-bold text-text-primary">Tell Us About Your Case</h2>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="clientName">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="clientName"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            {...register("clientName")}
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          {errors.clientName && (
            <p className="mt-1 text-xs text-red-400">{errors.clientName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="clientEmail">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            id="clientEmail"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            {...register("clientEmail")}
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          {errors.clientEmail && (
            <p className="mt-1 text-xs text-red-400">{errors.clientEmail.message}</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="clientPhone">
          Phone Number <span className="text-text-muted">(optional)</span>
        </label>
        <input
          id="clientPhone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 (555) 000-0000"
          {...register("clientPhone")}
          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* Specialty + Jurisdiction */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="specialty">
            Legal Specialty
          </label>
          <select
            id="specialty"
            onChange={(e) =>
              setValue("caseTypeSpecialtyId", e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">Select specialty…</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="jurisdiction">
            Jurisdiction
          </label>
          <select
            id="jurisdiction"
            onChange={(e) =>
              setValue("jurisdictionId", e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="">Select jurisdiction…</option>
            {jurisdictions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
                {j.type === "state" || j.type === "province" ? `, ${j.countryCode}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget */}
      <div>
        <p className="block text-xs font-medium text-text-secondary mb-2">Estimated Budget</p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                {...register("budgetRange")}
                className="accent-accent"
              />
              <span className="text-sm text-text-secondary">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Urgency */}
      <div>
        <p className="block text-xs font-medium text-text-secondary mb-2">Urgency</p>
        <div className="flex flex-wrap gap-4">
          {URGENCY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt.value}
                {...register("urgency")}
                className="accent-accent"
              />
              <span className="text-sm text-text-secondary">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="description">
          Describe Your Situation
        </label>
        <textarea
          id="description"
          rows={5}
          placeholder="Briefly describe your legal question or situation — the more context you provide, the better match we can make."
          {...register("description")}
          className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Turnstile */}
      {siteKey && (
        <div>
          <div ref={turnstileRef} />
          {!turnstileToken && (
            <p className="mt-1 text-xs text-text-muted">Please complete the captcha above.</p>
          )}
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg bg-red-900/20 border border-red-900/40 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || (!!siteKey && !turnstileToken)}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Submitting…" : "Request Free Match"}
      </button>

      <p className="text-center text-xs text-text-muted">
        By submitting, you agree to be contacted by attorneys from our network. No spam.
      </p>
    </form>
  );
}
