import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";

export { AppError } from "../lib/errors.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      req.log.error({ err, stack: err.stack }, err.message);
    } else {
      req.log.warn({ code: err.code, status: err.statusCode }, err.message);
    }
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details != null ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof z.ZodError) {
    req.log.warn({ zodError: err.flatten() }, "Zod validation error");
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: err.flatten(),
      },
    });
    return;
  }

  req.log.error({ err, stack: (err as Error)?.stack }, "Unexpected error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
};

export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
}
