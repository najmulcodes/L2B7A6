import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as attemptsService from "./attempts.service";

export const getById = catchAsync(async (req: Request, res: Response) => {
  const role = req.user!.role as "CANDIDATE" | "COMPANY" | "ADMIN";
  const attempt = await attemptsService.getAttemptById(req.user!.id, role, req.params.id);
  sendSuccess(res, attempt, "Attempt fetched successfully");
});

export const listMine = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await attemptsService.listMyAttempts(req.user!.id, req.query as any);
  sendSuccess(res, items, "Your attempts fetched successfully", 200, meta);
});

export const listForAssessment = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await attemptsService.listAssessmentAttempts(
    req.user!.id,
    req.params.assessmentId,
    req.query as any,
  );
  sendSuccess(res, items, "Attempts fetched successfully", 200, meta);
});

export const submitAnswer = catchAsync(async (req: Request, res: Response) => {
  const submission = await attemptsService.submitAnswer(req.user!.id, req.params.id, req.body);
  sendSuccess(res, submission, "Answer saved successfully");
});

export const finalize = catchAsync(async (req: Request, res: Response) => {
  const attempt = await attemptsService.finalizeAttempt(req.user!.id, req.params.id);
  sendSuccess(res, attempt, "Attempt submitted successfully");
});

export const report = catchAsync(async (req: Request, res: Response) => {
  const role = req.user!.role as "CANDIDATE" | "COMPANY" | "ADMIN";
  const data = await attemptsService.getAttemptReport(req.user!.id, role, req.params.id);
  sendSuccess(res, data, "Attempt report fetched successfully");
});
