import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { newsletterSubscribersTable } from "@workspace/db/schema";
import {
  SubscribeNewsletterBody,
  SubscribeNewsletterResponse,
} from "@workspace/api-zod";
import { parseInput, parseOutput } from "../lib/validate.js";

const router: IRouter = Router();

// ── POST /newsletter/subscribe ────────────────────────────────────────────────
router.post("/newsletter/subscribe", async (req, res, next) => {
  try {
    const body = parseInput(SubscribeNewsletterBody, req.body);
    const { email, sourcePage } = body;

    const existing = await db
      .select()
      .from(newsletterSubscribersTable)
      .where(eq(newsletterSubscribersTable.email, email))
      .limit(1);

    let responseStatus: "subscribed" | "already_subscribed";

    if (existing.length === 0) {
      const token = crypto.randomUUID();
      await db.insert(newsletterSubscribersTable).values({
        email,
        sourcePage: sourcePage ?? null,
        confirmed: false,
        confirmationToken: token,
      });
      responseStatus = "subscribed";
      req.log.info({ email }, "Newsletter subscription created");
    } else {
      const sub = existing[0]!;
      if (sub.unsubscribedAt !== null) {
        // Re-subscribe: clear unsubscribedAt
        await db
          .update(newsletterSubscribersTable)
          .set({ unsubscribedAt: null, sourcePage: sourcePage ?? sub.sourcePage })
          .where(eq(newsletterSubscribersTable.id, sub.id));
        responseStatus = "subscribed";
        req.log.info({ email }, "Newsletter re-subscribed");
      } else {
        responseStatus = "already_subscribed";
      }
    }

    const payload = { status: responseStatus };
    const validated = parseOutput(SubscribeNewsletterResponse, payload, req.log.error.bind(req.log));
    res.status(200).json(validated);
  } catch (err) {
    next(err);
  }
});

export default router;
