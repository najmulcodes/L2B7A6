import { Router } from "express";
import * as assessmentsController from "./assessments.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  attachProblemSchema,
  listAssessmentsQuerySchema,
  idParamSchema,
  assessmentProblemParamSchema,
} from "./assessments.validation";
import invitationsRouter from "../invitations/invitations.routes";
import attemptsRouter from "../attempts/attempts.routes";

const router = Router();

router.use(authenticate);

router.post("/", authorize("COMPANY"), validate({ body: createAssessmentSchema }), assessmentsController.create);
router.get("/", authorize("COMPANY"), validate({ query: listAssessmentsQuerySchema }), assessmentsController.list);
router.get(
  "/:id",
  authorize("COMPANY", "ADMIN"),
  validate({ params: idParamSchema }),
  assessmentsController.getById,
);
router.patch(
  "/:id",
  authorize("COMPANY"),
  validate({ params: idParamSchema, body: updateAssessmentSchema }),
  assessmentsController.update,
);
router.delete("/:id", authorize("COMPANY"), validate({ params: idParamSchema }), assessmentsController.remove);

router.post(
  "/:id/problems",
  authorize("COMPANY"),
  validate({ params: idParamSchema, body: attachProblemSchema }),
  assessmentsController.attachProblem,
);
router.delete(
  "/:id/problems/:problemId",
  authorize("COMPANY"),
  validate({ params: assessmentProblemParamSchema }),
  assessmentsController.detachProblem,
);

router.patch(
  "/:id/publish",
  authorize("COMPANY"),
  validate({ params: idParamSchema }),
  assessmentsController.publish,
);

// Nested resource routers (assessment-scoped invitations & attempts)
router.use("/:assessmentId/invitations", invitationsRouter);
router.use("/:assessmentId/attempts", attemptsRouter);

export default router;
