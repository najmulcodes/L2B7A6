import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as candidatesService from "./candidates.service";

export const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await candidatesService.updateMyCandidateProfile(req.user!.id, req.body);
  sendSuccess(res, profile, "Candidate profile updated successfully");
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const profile = await candidatesService.getCandidateProfileById(req.params.id);
  sendSuccess(res, profile, "Candidate profile fetched successfully");
});
