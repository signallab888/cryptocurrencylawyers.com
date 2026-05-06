import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { env } from "../env.js";

export function requireClerkAuth(req: Request, res: Response, next: NextFunction) {
  if (!env.CLERK_SECRET_KEY) {
    req.log.warn("Admin endpoint accessed but CLERK_SECRET_KEY is not configured");
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Admin authentication is not configured on this server",
      },
    });
    return;
  }

  const auth = getAuth(req);

  if (!auth.userId) {
    req.log.warn({ path: req.path }, "Unauthenticated admin request");
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  req.log.info({ userId: auth.userId, path: req.path }, "Authenticated admin request");
  next();
}
