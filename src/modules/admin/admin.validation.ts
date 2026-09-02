import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.enum(["CANDIDATE", "COMPANY", "ADMIN"]).optional(),
  q: z.string().trim().max(200).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["CANDIDATE", "COMPANY", "ADMIN"]),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  entity: z.string().trim().max(100).optional(),
  action: z.string().trim().max(100).optional(),
  actorId: z.string().uuid().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});
