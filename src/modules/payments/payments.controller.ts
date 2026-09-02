import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as paymentsService from "./payments.service";

export const initiate = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentsService.initiatePayment(req.user!.id, req.body.package);
  sendSuccess(res, result, "Payment session created successfully", 201);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const role = req.user!.role === "ADMIN" ? "ADMIN" : "COMPANY";
  const payment = await paymentsService.getPaymentById(req.user!.id, role, req.params.id);
  sendSuccess(res, payment, "Payment fetched successfully");
});

export const listMine = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await paymentsService.listMyPayments(req.user!.id, req.query as any);
  sendSuccess(res, items, "Payments fetched successfully", 200, meta);
});

// Note: no catchAsync wrapper transforms the response shape here because the
// webhook must return Stripe's expected minimal JSON body directly.
export const webhook = async (req: Request, res: Response) => {
  try {
    const result = await paymentsService.handleStripeWebhook(req.body, req.headers["stripe-signature"]);
    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    res.status(400).json({ success: false, message, errors: [] });
  }
};
