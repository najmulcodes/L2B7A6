import { Router } from "express";
import * as invitationsController from "./invitations.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listInvitationsQuerySchema, idParamSchema } from "./invitations.validation";

const router = Router();

router.use(authenticate, authorize("CANDIDATE"));

router.get("/me", validate({ query: listInvitationsQuerySchema }), invitationsController.listMine);
router.post("/:id/accept", validate({ params: idParamSchema }), invitationsController.accept);
router.post("/:id/decline", validate({ params: idParamSchema }), invitationsController.decline);

export default router;
