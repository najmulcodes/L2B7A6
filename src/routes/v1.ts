import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import companiesRoutes from "../modules/companies/companies.routes";
import candidatesRoutes from "../modules/candidates/candidates.routes";
import problemsRoutes from "../modules/problems/problems.routes";
import assessmentsRoutes from "../modules/assessments/assessments.routes";
import invitationsMeRoutes from "../modules/invitations/invitations.me.routes";
import attemptsTopRoutes from "../modules/attempts/attempts.top.routes";
import submissionsRoutes from "../modules/submissions/submissions.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/companies", companiesRoutes);
router.use("/candidates", candidatesRoutes);
router.use("/problems", problemsRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/invitations", invitationsMeRoutes);
router.use("/attempts", attemptsTopRoutes);
router.use("/submissions", submissionsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/admin", adminRoutes);

export default router;
