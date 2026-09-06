import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import fs from "fs";
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

  // API documentation, backed by docs/openapi.yaml.
  //
  // Not using swagger-ui-express's swaggerUi.serve/setup here: its CSS/JS
  // assets live in swagger-ui-dist and are served via express.static() at
  // runtime rather than require()'d, so Vercel's file tracer prunes them
  // from the deployed function — assets 404 as text/html and the UI never
  // renders. Serving the spec as JSON and loading the UI shell/assets from
  // a CDN sidesteps that entirely.
  //
  // helmet()'s default CSP (script-src/default-src 'self') correctly blocks
  // the CDN bundle and would also block an inline <script>. Don't loosen the
  // global CSP for this — that same header is protecting /api/v1. Instead,
  // override it only on these three paths, and keep the init code in an
  // external same-origin file so 'unsafe-inline' is never needed at all.
  const docsCsp = helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      styleSrc: ["'self'", "https://unpkg.com"],
      connectSrc: ["'self'", "https://unpkg.com"],
    },
  });

  const openapiPath = path.join(__dirname, "..", "docs", "openapi.yaml");
  if (fs.existsSync(openapiPath)) {
    const swaggerDocument = YAML.load(openapiPath);

    app.get("/api-docs/openapi.json", docsCsp, (_req, res) => {
      res.json(swaggerDocument);
    });

    app.get("/api-docs/init.js", docsCsp, (_req, res) => {
      res
        .type("application/javascript")
        .send(
          `window.onload = () => { SwaggerUIBundle({ url: "/api-docs/openapi.json", dom_id: "#swagger-ui" }); };`,
        );
    });

    app.get("/api-docs", docsCsp, (_req, res) => {
      res.type("html").send(`<!DOCTYPE html>
<html>
<head>
  <title>CodeRank API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script src="/api-docs/init.js"></script>
</body>
</html>`);
    });
  }

  app.use("/api/v1", apiRateLimiter, v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
