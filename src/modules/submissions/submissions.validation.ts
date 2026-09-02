import { z } from "zod";

export const evaluateSubmissionSchema = z.object({
  score: z.number().int().min(0).max(1000),
  feedback: z.string().trim().max(3000).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});
