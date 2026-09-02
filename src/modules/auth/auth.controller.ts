import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as authService from "./auth.service";

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body, req.ip);
  sendSuccess(res, result, "Registration successful", 201);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body, req.ip);
  sendSuccess(res, result, "Login successful");
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.refreshUserToken(req.body.refreshToken);
  sendSuccess(res, result, "Token refreshed successfully");
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logoutUser(req.user!.id);
  sendSuccess(res, null, "Logged out successfully");
});

export const google = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.googleAuth(req.body, req.ip);
  sendSuccess(res, result, "Google authentication successful");
});
