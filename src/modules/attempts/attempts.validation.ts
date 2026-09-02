import { z } from "zod";

export const submitAnswerSchema = z
  .object({
    problemId: z.string().uuid("Invalid problemId"),
    selectedOption: z.string().min(1).max(10).optional(),
    answerText: z.string().max(20000).optional(),
    code: z.string().max(50000).optional(),
    language: z.string().trim().max(30).optional(),
  })
  .refine((d) => d.selectedOption || d.answerText || d.code, {
    message: "Provide at least one of selectedOption, answerText, or code",
  });

export const listAttemptsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["IN_PROGRESS", "SUBMITTED", "EVALUATED", "EXPIRED"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});

export const assessmentIdParamSchema = z.object({
  assessmentId: z.string().uuid("Invalid assessmentId format"),
});
