import { Router } from "express";
import * as authController from "./auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";
import { registerSchema, loginSchema, refreshTokenSchema, googleAuthSchema } from "./auth.validation";

const router = Router();

router.post("/register", authRateLimiter, validate({ body: registerSchema }), authController.register);
router.post("/login", authRateLimiter, validate({ body: loginSchema }), authController.login);
router.post("/refresh-token", authRateLimiter, validate({ body: refreshTokenSchema }), authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.post("/google", authRateLimiter, validate({ body: googleAuthSchema }), authController.google);

export default router;
