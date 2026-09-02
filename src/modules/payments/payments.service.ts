import type Stripe from "stripe";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildMeta } from "../../lib/pagination";
import { writeAuditLog } from "../../utils/audit";
import { resolveCompanyId } from "../../utils/resolveCompany";
import { requireStripe } from "./stripe.client";
import { CREDIT_PACKAGES, type CreditPackageKey } from "./payments.validation";

export async function initiatePayment(userId: string, packageKey: CreditPackageKey) {
  const companyId = await resolveCompanyId(userId);
  const stripe = requireStripe();
  const pkg = CREDIT_PACKAGES[packageKey];

  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: "STRIPE",
      purpose: "CREDIT_PURCHASE",
      amount: pkg.amount,
      currency: "usd",
      creditsPurchased: pkg.credits,
      status: "PENDING",
      metadata: { package: packageKey, companyId },
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pkg.amount,
          product_data: { name: pkg.label, description: "Developer Assessment Platform — assessment publish credits" },
        },
        quantity: 1,
      },
    ],
    success_url: env.STRIPE_SUCCESS_URL ?? "https://example.com/payments/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: env.STRIPE_CANCEL_URL ?? "https://example.com/payments/cancel",
    metadata: { paymentId: payment.id, companyId, credits: String(pkg.credits) },
  });

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { providerSessionId: session.id },
  });

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PAYMENT_INITIATED",
    entity: "Payment",
    entityId: payment.id,
    newState: { package: packageKey, amount: pkg.amount },
  });

  return { payment: updated, checkoutUrl: session.url };
}

export async function getPaymentById(userId: string, role: "COMPANY" | "ADMIN", id: string) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (role !== "ADMIN" && payment.userId !== userId) {
    throw ApiError.forbidden("You do not have access to this payment");
  }
  return payment;
}

export async function listMyPayments(userId: string, query: { page?: number; limit?: number; status?: string }) {
  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);
  const where = { userId, ...(query.status ? { status: query.status as never } : {}) };

  const [items, total] = await Promise.all([
    prisma.payment.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.payment.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

/**
 * Verifies the Stripe webhook signature and processes the event.
 * Never trusts a client-side redirect as proof of payment — the credit
 * balance is only ever incremented here, from a signature-verified
 * server-to-server event, inside a transaction for idempotency safety.
 */
export async function handleStripeWebhook(rawBody: Buffer, signature: string | string[] | undefined) {
  const stripe = requireStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw ApiError.internal("STRIPE_WEBHOOK_SECRET is not configured");
  }
  if (!signature) {
    throw ApiError.badRequest("Missing Stripe-Signature header");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${(err as Error).message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await creditPayment(session);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await markPaymentStatus(session.id, "CANCELLED");
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await markPaymentStatusByIntent(intent.id, "FAILED");
      break;
    }
    default:
      break; // unrelated event types are acknowledged and ignored
  }

  return { received: true };
}

async function creditPayment(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;
    // Idempotency: if this session was already processed, do nothing.
    if (payment.status === "SUCCESS") return;

    const companyId = (payment.metadata as Record<string, unknown> | null)?.companyId as string | undefined;
    if (!companyId) return;

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        providerRef: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      },
    });

    await tx.companyProfile.update({
      where: { id: companyId },
      data: { assessmentCredits: { increment: payment.creditsPurchased } },
    });

    await writeAuditLog(tx, {
      actorId: payment.userId,
      action: "PAYMENT_SUCCEEDED",
      entity: "Payment",
      entityId: paymentId,
      newState: { creditsGranted: payment.creditsPurchased },
    });
  });
}

async function markPaymentStatus(sessionId: string, status: "CANCELLED" | "FAILED") {
  const payment = await prisma.payment.findUnique({ where: { providerSessionId: sessionId } });
  if (!payment || payment.status === "SUCCESS") return;
  await prisma.payment.update({ where: { id: payment.id }, data: { status } });
  await writeAuditLog(prisma, {
    actorId: payment.userId,
    action: `PAYMENT_${status}`,
    entity: "Payment",
    entityId: payment.id,
  });
}

async function markPaymentStatusByIntent(intentId: string, status: "FAILED") {
  const payment = await prisma.payment.findFirst({ where: { providerRef: intentId } });
  if (!payment || payment.status === "SUCCESS") return;
  await prisma.payment.update({ where: { id: payment.id }, data: { status } });
}
