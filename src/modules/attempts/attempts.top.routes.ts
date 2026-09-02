import { Router } from "express";
import * as attemptsController from "./attempts.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { submitAnswerSchema, listAttemptsQuerySchema, idParamSchema } from "./attempts.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/me",
  authorize("CANDIDATE"),
  validate({ query: listAttemptsQuerySchema }),
  attemptsController.listMine,
);
router.get(
  "/:id",
  authorize("CANDIDATE", "COMPANY", "ADMIN"),
  validate({ params: idParamSchema }),
  attemptsController.getById,
);
router.get(
  "/:id/report",
  authorize("CANDIDATE", "COMPANY", "ADMIN"),
  validate({ params: idParamSchema }),
  attemptsController.report,
);
router.post(
  "/:id/answers",
  authorize("CANDIDATE"),
  validate({ params: idParamSchema, body: submitAnswerSchema }),
  attemptsController.submitAnswer,
);
router.post(
  "/:id/submit",
  authorize("CANDIDATE"),
  validate({ params: idParamSchema }),
  attemptsController.finalize,
);

export default router;
