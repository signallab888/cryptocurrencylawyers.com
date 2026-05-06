import { type ZodTypeAny, type output } from "zod";
import { AppError } from "../middleware/error.js";

export function parseInput<S extends ZodTypeAny>(schema: S, data: unknown): output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid input", result.error.flatten());
  }
  return result.data as output<S>;
}

export function parseOutput<S extends ZodTypeAny>(
  schema: S,
  data: unknown,
  log?: (msg: string) => void,
): output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    log?.(`Response validation failed: ${JSON.stringify(result.error.flatten())}`);
    throw new AppError(500, "INTERNAL_ERROR", "Response shape mismatch");
  }
  return result.data as output<S>;
}
