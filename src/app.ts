import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { env, isProd } from "./config/env";
import v1Router from "./routes/v1";
import * as paymentsController from "./modules/payments/payments.controller";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";
import { sendSuccess } from "./lib/response";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(morgan(isProd ? "combined" : "dev"));

  // Stripe webhook needs the untouched raw request body to verify the
  // signature — it MUST be registered before express.json() below.
  app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), paymentsController.webhook);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() }, "Service is healthy");
  });

  // API documentation (Swagger UI backed by docs/openapi.yaml).
  const openapiPath = path.join(__dirname, "..", "docs", "openapi.yaml");
  if (fs.existsSync(openapiPath)) {
    const swaggerDocument = YAML.load(openapiPath);
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  app.use("/api/v1", apiRateLimiter, v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
