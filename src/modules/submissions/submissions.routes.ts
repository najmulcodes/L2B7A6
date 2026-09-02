import { Router } from "express";
import * as submissionsController from "./submissions.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { evaluateSubmissionSchema, idParamSchema } from "./submissions.validation";

const router = Router();

router.use(authenticate, authorize("COMPANY"));

router.get("/:id", validate({ params: idParamSchema }), submissionsController.getById);
router.patch(
  "/:id/evaluate",
  validate({ params: idParamSchema, body: evaluateSubmissionSchema }),
  submissionsController.evaluate,
);

export default router;
