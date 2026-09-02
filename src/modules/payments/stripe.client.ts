import Stripe from "stripe";
import { env } from "../../config/env";

export const stripeClient = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

export function requireStripe(): Stripe {
  if (!stripeClient) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET) in your environment.",
    );
  }
  return stripeClient;
}
