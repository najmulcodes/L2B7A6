import { Router } from "express";
import * as paymentsController from "./payments.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { paymentRateLimiter } from "../../middleware/rateLimit.middleware";
import { initiatePaymentSchema, listPaymentsQuerySchema, idParamSchema } from "./payments.validation";

const router = Router();

// NOTE: the raw-body webhook endpoint (POST /api/v1/payments/webhook) is
// registered directly in app.ts, BEFORE the global express.json() parser,
// because Stripe signature verification requires the untouched raw bytes.
// It is intentionally not repeated here to avoid double-registering it with
// a JSON-parsed body.

router.post(
  "/initiate",
  authenticate,
  authorize("COMPANY"),
  paymentRateLimiter,
  validate({ body: initiatePaymentSchema }),
  paymentsController.initiate,
);
router.get("/me", authenticate, authorize("COMPANY"), validate({ query: listPaymentsQuerySchema }), paymentsController.listMine);
router.get(
  "/:id",
  authenticate,
  authorize("COMPANY", "ADMIN"),
  validate({ params: idParamSchema }),
  paymentsController.getById,
);

export default router;
