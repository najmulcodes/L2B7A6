import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as assessmentsService from "./assessments.service";

export const create = catchAsync(async (req: Request, res: Response) => {
  const assessment = await assessmentsService.createAssessment(req.user!.id, req.body);
  sendSuccess(res, assessment, "Assessment created successfully", 201);
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await assessmentsService.listMyAssessments(req.user!.id, req.query as any);
  sendSuccess(res, items, "Assessments fetched successfully", 200, meta);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const role = req.user!.role === "ADMIN" ? "ADMIN" : "COMPANY";
  const assessment = await assessmentsService.getAssessmentById(req.user!.id, req.params.id, role);
  sendSuccess(res, assessment, "Assessment fetched successfully");
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const assessment = await assessmentsService.updateAssessment(req.user!.id, req.params.id, req.body);
  sendSuccess(res, assessment, "Assessment updated successfully");
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await assessmentsService.softDeleteAssessment(req.user!.id, req.params.id);
  sendSuccess(res, null, "Assessment deleted successfully");
});

export const attachProblem = catchAsync(async (req: Request, res: Response) => {
  const link = await assessmentsService.attachProblem(req.user!.id, req.params.id, req.body);
  sendSuccess(res, link, "Problem attached to assessment successfully", 201);
});

export const detachProblem = catchAsync(async (req: Request, res: Response) => {
  await assessmentsService.detachProblem(req.user!.id, req.params.id, req.params.problemId);
  sendSuccess(res, null, "Problem removed from assessment successfully");
});

export const publish = catchAsync(async (req: Request, res: Response) => {
  const assessment = await assessmentsService.publishAssessment(req.user!.id, req.params.id);
  sendSuccess(res, assessment, "Assessment published successfully");
});
