import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db/schema";
import { CreateLeadBody } from "@workspace/api-zod";
import { parseInput } from "../lib/validate.js";
import { AppError } from "../lib/errors.js";
import { env } from "../env.js";

const router: IRouter = Router();

async function verifyTurnstile(token: string): Promise<number | null> {
  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY ?? "",
      response: token,
    }),
  });
  const data = (await resp.json()) as { success: boolean; score?: number };
  if (!data.success) return null;
  return data.score ?? 1;
}

// ── POST /leads ───────────────────────────────────────────────────────────────
router.post("/leads", async (req, res, next) => {
  try {
    const body = parseInput(CreateLeadBody, req.body);
    const { turnstileToken, ...leadData } = body;

    // Require Turnstile in production; allow bypass in dev when key not set
    if (env.TURNSTILE_SECRET_KEY) {
      const score = await verifyTurnstile(turnstileToken);
      if (score === null) {
        throw new AppError(422, "CAPTCHA_FAILED", "Turnstile verification failed. Please try again.");
      }
      const [inserted] = await db
        .insert(leadsTable)
        .values({
          clientName: leadData.clientName,
          clientEmail: leadData.clientEmail,
          clientPhone: leadData.clientPhone ?? null,
          caseTypeSpecialtyId: leadData.caseTypeSpecialtyId ?? null,
          jurisdictionId: leadData.jurisdictionId ?? null,
          budgetRange: leadData.budgetRange ?? "unknown",
          urgency: leadData.urgency ?? "planning",
          description: leadData.description ?? null,
          sourcePage: leadData.sourcePage ?? null,
          utmSource: leadData.utmSource ?? null,
          utmMedium: leadData.utmMedium ?? null,
          utmCampaign: leadData.utmCampaign ?? null,
          captchaScore: score,
          ipAddress: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
          status: "new",
        })
        .returning({ id: leadsTable.id });

      req.log.info({ leadId: inserted?.id, score }, "Lead created");
      res.status(201).json({ id: inserted?.id, status: "new" });
    } else {
      // Dev mode — skip captcha
      req.log.warn("TURNSTILE_SECRET_KEY not set — skipping captcha in dev");
      const [inserted] = await db
        .insert(leadsTable)
        .values({
          clientName: leadData.clientName,
          clientEmail: leadData.clientEmail,
          clientPhone: leadData.clientPhone ?? null,
          caseTypeSpecialtyId: leadData.caseTypeSpecialtyId ?? null,
          jurisdictionId: leadData.jurisdictionId ?? null,
          budgetRange: leadData.budgetRange ?? "unknown",
          urgency: leadData.urgency ?? "planning",
          description: leadData.description ?? null,
          sourcePage: leadData.sourcePage ?? null,
          utmSource: leadData.utmSource ?? null,
          utmMedium: leadData.utmMedium ?? null,
          utmCampaign: leadData.utmCampaign ?? null,
          captchaScore: null,
          ipAddress: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
          status: "new",
        })
        .returning({ id: leadsTable.id });

      req.log.info({ leadId: inserted?.id }, "Lead created (dev, no captcha)");
      res.status(201).json({ id: inserted?.id, status: "new" });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
