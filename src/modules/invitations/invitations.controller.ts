import type { Request, Response } from "express";
import { catchAsync } from "../../lib/catchAsync";
import { sendSuccess } from "../../lib/response";
import * as invitationsService from "./invitations.service";

export const create = catchAsync(async (req: Request, res: Response) => {
  const invitation = await invitationsService.createInvitation(req.user!.id, req.params.assessmentId, req.body);
  sendSuccess(res, invitation, "Candidate invited successfully", 201);
});

export const listForAssessment = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await invitationsService.listAssessmentInvitations(
    req.user!.id,
    req.params.assessmentId,
    req.query as any,
  );
  sendSuccess(res, items, "Invitations fetched successfully", 200, meta);
});

export const listMine = catchAsync(async (req: Request, res: Response) => {
  const { items, meta } = await invitationsService.listMyInvitations(req.user!.id, req.query as any);
  sendSuccess(res, items, "Your invitations fetched successfully", 200, meta);
});

export const accept = catchAsync(async (req: Request, res: Response) => {
  const attempt = await invitationsService.acceptInvitation(req.user!.id, req.params.id);
  sendSuccess(res, attempt, "Invitation accepted. Your attempt has started.", 201);
});

export const decline = catchAsync(async (req: Request, res: Response) => {
  const invitation = await invitationsService.declineInvitation(req.user!.id, req.params.id);
  sendSuccess(res, invitation, "Invitation declined");
});
