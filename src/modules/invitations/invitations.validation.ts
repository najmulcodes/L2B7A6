import { z } from "zod";

export const createInvitationSchema = z.object({
  candidateEmail: z.string().trim().toLowerCase().email("Invalid candidate email"),
  expiresInDays: z.number().int().min(1).max(90).default(14),
});

export const listInvitationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "COMPLETED"]).optional(),
});

export const assessmentIdParamSchema = z.object({
  assessmentId: z.string().uuid("Invalid assessmentId format"),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});
