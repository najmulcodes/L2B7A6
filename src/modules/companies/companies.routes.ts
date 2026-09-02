import { Router } from "express";
import * as companiesController from "./companies.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { updateCompanySchema, idParamSchema } from "./companies.validation";

const router = Router();

router.get("/me", authenticate, authorize("COMPANY"), companiesController.getMyProfile);
router.patch(
  "/me",
  authenticate,
  authorize("COMPANY"),
  validate({ body: updateCompanySchema }),
  companiesController.updateMyProfile,
);
router.get("/:id", validate({ params: idParamSchema }), companiesController.getPublicProfile);

export default router;
