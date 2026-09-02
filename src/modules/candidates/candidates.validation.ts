import { z } from "zod";

export const updateCandidateSchema = z.object({
  headline: z.string().trim().max(150).optional(),
  bio: z.string().trim().max(2000).optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(50).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  resumeUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});
