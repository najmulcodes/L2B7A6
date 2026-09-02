import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: passwordSchema,
    role: z.enum(["CANDIDATE", "COMPANY"]).default("CANDIDATE"),
    companyName: z.string().trim().min(2).max(150).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "COMPANY" && !data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "companyName is required when registering as a COMPANY",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, "refreshToken is required"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10, "Google idToken is required"),
  role: z.enum(["CANDIDATE", "COMPANY"]).default("CANDIDATE"),
  companyName: z.string().trim().min(2).max(150).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
