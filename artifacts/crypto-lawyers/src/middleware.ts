import { clerkMiddleware } from "@clerk/astro/server";
import type { MiddlewareHandler } from "astro";

// Call clerkMiddleware() only when the secret key is set —
// avoids the "Missing publishableKey" client error on dev without Clerk.
const _clerk = import.meta.env.CLERK_SECRET_KEY ? clerkMiddleware() : null;

export const onRequest: MiddlewareHandler = (context, next) => {
  if (_clerk) return _clerk(context, next);
  return next();
};
