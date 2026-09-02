import { Router } from "express";
import * as usersController from "./users.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { updateMeSchema, updatePasswordSchema } from "./users.validation";

const router = Router();

router.use(authenticate);

router.get("/me", usersController.getMe);
router.patch("/me", validate({ body: updateMeSchema }), usersController.updateMe);
router.patch("/me/password", validate({ body: updatePasswordSchema }), usersController.updateMyPassword);

export default router;
