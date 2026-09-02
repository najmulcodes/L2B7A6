import { Router } from "express";
import * as adminController from "./admin.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  listUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  listAuditLogsQuerySchema,
  idParamSchema,
} from "./admin.validation";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/users", validate({ query: listUsersQuerySchema }), adminController.listUsers);
router.patch(
  "/users/:id/role",
  validate({ params: idParamSchema, body: updateUserRoleSchema }),
  adminController.updateUserRole,
);
router.patch(
  "/users/:id/status",
  validate({ params: idParamSchema, body: updateUserStatusSchema }),
  adminController.updateUserStatus,
);
router.get("/dashboard-stats", adminController.dashboardStats);
router.get("/audit-logs", validate({ query: listAuditLogsQuerySchema }), adminController.auditLogs);

export default router;
