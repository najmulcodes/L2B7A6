import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as companiesService from "./companies.service";

export const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await companiesService.getMyCompanyProfile(req.user!.id);
  sendSuccess(res, profile, "Company profile fetched successfully");
});

export const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await companiesService.updateMyCompanyProfile(req.user!.id, req.body);
  sendSuccess(res, profile, "Company profile updated successfully");
});

export const getPublicProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await companiesService.getPublicCompanyProfile(req.params.id);
  sendSuccess(res, profile, "Company profile fetched successfully");
});
