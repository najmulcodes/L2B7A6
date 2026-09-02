import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

export async function updateMyCandidateProfile(userId: string, data: Record<string, unknown>) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound("Candidate profile not found");

  return prisma.candidateProfile.update({ where: { userId }, data });
}

/**
 * Companies/Admins may view a candidate's public profile — for example when
 * reviewing an attempt or invitation. Email is intentionally omitted here;
 * companies see it via the attempt/invitation record they're authorized for.
 */
export async function getCandidateProfileById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      role: true,
      candidateProfile: true,
    },
  });
  if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
    throw ApiError.notFound("Candidate not found");
  }
  return user;
}
