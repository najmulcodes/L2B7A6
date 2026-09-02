import { prisma } from "../config/prisma";
import { ApiError } from "./ApiError";

export async function resolveCompanyId(userId: string): Promise<string> {
  const profile = await prisma.companyProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw ApiError.notFound("Company profile not found for this account");
  return profile.id;
}
