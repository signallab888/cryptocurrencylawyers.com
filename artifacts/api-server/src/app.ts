import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./env.js";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk middleware — parses JWT if present; no-op when keys are absent
if (env.CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware());
}

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

export default app;
