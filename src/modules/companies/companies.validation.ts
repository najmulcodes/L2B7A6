import { z } from "zod";

export const updateCompanySchema = z.object({
  companyName: z.string().trim().min(2).max(150).optional(),
  website: z.string().url().optional(),
  industry: z.string().trim().max(100).optional(),
  about: z.string().trim().max(2000).optional(),
  logoUrl: z.string().url().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});
