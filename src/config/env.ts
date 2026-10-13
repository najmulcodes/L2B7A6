import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  REDIS_URL: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().optional(),
  STRIPE_CANCEL_URL: z.string().optional(),

  ADMIN_EMAIL: z.string().email().default("admin@devassess.com"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),

  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/**
 * Known-good production frontend origin. This is a hard safety net, not the
 * primary config path: STRIPE_SUCCESS_URL / STRIPE_CANCEL_URL in Vercel are
 * still the source of truth. But a misconfigured env var (e.g. left at a
 * localhost/dev value) must never leak into a production Stripe redirect —
 * that sends paying users to a URL their browser can't resolve. In
 * production, any configured success/cancel URL that points at localhost,
 * 127.0.0.1, or is simply missing is ignored in favor of the real frontend.
 */
const PRODUCTION_FRONTEND_URL = "https://coderankk.vercel.app";

function isUnsafeForProduction(url: string | undefined): boolean {
  if (!url) return true;
  return /localhost|127\.0\.0\.1/i.test(url);
}

export const resolvedStripeSuccessUrl = isProd && isUnsafeForProduction(env.STRIPE_SUCCESS_URL)
  ? `${PRODUCTION_FRONTEND_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`
  : env.STRIPE_SUCCESS_URL;

export const resolvedStripeCancelUrl = isProd && isUnsafeForProduction(env.STRIPE_CANCEL_URL)
  ? `${PRODUCTION_FRONTEND_URL}/payments/cancel`
  : env.STRIPE_CANCEL_URL;
