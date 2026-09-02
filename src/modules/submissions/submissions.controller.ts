import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as submissionsService from "./submissions.service";

export const getById = catchAsync(async (req: Request, res: Response) => {
  const submission = await submissionsService.getSubmissionById(req.user!.id, req.params.id);
  sendSuccess(res, submission, "Submission fetched successfully");
});

export const evaluate = catchAsync(async (req: Request, res: Response) => {
  const submission = await submissionsService.evaluateSubmission(req.user!.id, req.params.id, req.body);
  sendSuccess(res, submission, "Submission evaluated successfully");
});
