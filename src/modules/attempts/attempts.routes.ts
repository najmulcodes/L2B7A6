import { Router } from "express";
import * as attemptsController from "./attempts.controller";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listAttemptsQuerySchema } from "./attempts.validation";

// mergeParams so we can read :assessmentId from the parent (assessments) router.
// authenticate() is already applied by the parent router.
const router = Router({ mergeParams: true });

router.get(
  "/",
  authorize("COMPANY"),
  validate({ query: listAttemptsQuerySchema }),
  attemptsController.listForAssessment,
);

export default router;
