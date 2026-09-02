import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as problemsService from "./problems.service";

export const create = catchAsync(async (req: Request, res: Response) => {
  const problem = await problemsService.createProblem(req.user!.id, req.body);
  sendSuccess(res, problem, "Problem created successfully", 201);
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await problemsService.listCompanyProblems(req.user!.id, req.query as any);
  sendSuccess(res, items, "Problems fetched successfully", 200, meta);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const problem = await problemsService.getProblemById(req.user!.id, req.params.id);
  sendSuccess(res, problem, "Problem fetched successfully");
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const problem = await problemsService.updateProblem(req.user!.id, req.params.id, req.body);
  sendSuccess(res, problem, "Problem updated successfully");
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await problemsService.softDeleteProblem(req.user!.id, req.params.id);
  sendSuccess(res, null, "Problem deleted successfully");
});
