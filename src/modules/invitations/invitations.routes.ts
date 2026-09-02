import { Router } from "express";
import * as invitationsController from "./invitations.controller";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createInvitationSchema, listInvitationsQuerySchema } from "./invitations.validation";

// mergeParams so we can read :assessmentId from the parent router.
// authenticate() is already applied by the parent assessments router.
const router = Router({ mergeParams: true });

router.post("/", authorize("COMPANY"), validate({ body: createInvitationSchema }), invitationsController.create);
router.get(
  "/",
  authorize("COMPANY"),
  validate({ query: listInvitationsQuerySchema }),
  invitationsController.listForAssessment,
);

export default router;
