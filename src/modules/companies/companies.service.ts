import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

export async function getMyCompanyProfile(userId: string) {
  const profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound("Company profile not found");
  return profile;
}

export async function updateMyCompanyProfile(userId: string, data: Record<string, unknown>) {
  const profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound("Company profile not found");

  return prisma.companyProfile.update({ where: { userId }, data });
}

export async function getPublicCompanyProfile(id: string) {
  const profile = await prisma.companyProfile.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      website: true,
      industry: true,
      about: true,
      logoUrl: true,
      verified: true,
      createdAt: true,
    },
  });
  if (!profile) throw ApiError.notFound("Company not found");
  return profile;
}
