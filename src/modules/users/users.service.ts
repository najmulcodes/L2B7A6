import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashValue, compareValue } from "../../utils/hash";
import { writeAuditLog } from "../../utils/audit";

const ME_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
  candidateProfile: true,
  companyProfile: true,
} as const;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: ME_SELECT });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function updateMe(userId: string, data: { name?: string; avatarUrl?: string }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: ME_SELECT,
  });
  return user;
}

export async function updateMyPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  if (!user.password) {
    throw ApiError.badRequest("This account signs in with Google and has no password to change");
  }

  const valid = await compareValue(currentPassword, user.password);
  if (!valid) throw ApiError.unauthorized("Current password is incorrect");

  const hashed = await hashValue(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed, refreshToken: null } });

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PASSWORD_CHANGED",
    entity: "User",
    entityId: userId,
  });
}
