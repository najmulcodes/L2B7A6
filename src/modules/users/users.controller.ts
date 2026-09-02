import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as usersService from "./users.service";

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await usersService.getMe(req.user!.id);
  sendSuccess(res, user, "Profile fetched successfully");
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = await usersService.updateMe(req.user!.id, req.body);
  sendSuccess(res, user, "Profile updated successfully");
});

export const updateMyPassword = catchAsync(async (req: Request, res: Response) => {
  await usersService.updateMyPassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, null, "Password updated successfully");
});
