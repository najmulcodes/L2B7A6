import { Router } from "express";
import * as candidatesController from "./candidates.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { updateCandidateSchema, idParamSchema } from "./candidates.validation";

const router = Router();

router.patch(
  "/me",
  authenticate,
  authorize("CANDIDATE"),
  validate({ body: updateCandidateSchema }),
  candidatesController.updateMyProfile,
);

router.get(
  "/:id",
  authenticate,
  authorize("COMPANY", "ADMIN"),
  validate({ params: idParamSchema }),
  candidatesController.getById,
);

export default router;
