import { z } from "zod";

export const CREDIT_PACKAGES = {
  SMALL: { credits: 5, amount: 2500, label: "5 Assessment Credits" }, // amount in cents (USD)
  MEDIUM: { credits: 15, amount: 6000, label: "15 Assessment Credits" },
  LARGE: { credits: 50, amount: 18000, label: "50 Assessment Credits" },
} as const;

export type CreditPackageKey = keyof typeof CREDIT_PACKAGES;

export const initiatePaymentSchema = z.object({
  package: z.enum(["SMALL", "MEDIUM", "LARGE"]),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});
