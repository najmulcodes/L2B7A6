import { z } from "zod";

export const createAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  durationMinutes: z.number().int().min(5).max(600).default(60),
  passingScore: z.number().int().min(0).max(100).default(60),
});

export const updateAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
});

export const attachProblemSchema = z.object({
  problemId: z.string().uuid("Invalid problemId"),
  order: z.number().int().min(0).optional(),
  pointsOverride: z.number().int().min(1).max(1000).optional(),
});

export const listAssessmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  q: z.string().trim().max(200).optional(),
  sortBy: z.enum(["createdAt", "title", "durationMinutes"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});

export const assessmentProblemParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
  problemId: z.string().uuid("Invalid problemId format"),
});
