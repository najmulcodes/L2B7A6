import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as adminService from "./admin.service";

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await adminService.listUsers(req.query as any);
  sendSuccess(res, items, "Users fetched successfully", 200, meta);
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.updateUserRole(req.user!.id, req.params.id, req.body.role);
  sendSuccess(res, user, "User role updated successfully");
});

export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.updateUserStatus(req.user!.id, req.params.id, req.body.isActive);
  sendSuccess(res, user, "User status updated successfully");
});

export const dashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  sendSuccess(res, stats, "Dashboard stats fetched successfully");
});

export const auditLogs = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await adminService.listAuditLogs(req.query as any);
  sendSuccess(res, items, "Audit logs fetched successfully", 200, meta);
});
