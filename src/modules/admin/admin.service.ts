import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildMeta } from "../../lib/pagination";
import { writeAuditLog } from "../../utils/audit";

interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  q?: string;
  isActive?: string;
}

export async function listUsers(query: ListUsersParams) {
  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(query.role ? { role: query.role as Prisma.EnumRoleFilter["equals"] } : {}),
    ...(query.isActive ? { isActive: query.isActive === "true" } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        provider: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function updateUserRole(adminId: string, targetId: string, role: "CANDIDATE" | "COMPANY" | "ADMIN") {
  if (adminId === targetId) {
    throw ApiError.badRequest("Admins cannot change their own role");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.deletedAt) throw ApiError.notFound("User not found");
  if (target.role === role) return target;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: targetId }, data: { role } });

    // Ensure the profile matching the new role exists so downstream module
    // guards (resolveCompanyId, candidate profile lookups) keep working.
    if (role === "COMPANY") {
      const exists = await tx.companyProfile.findUnique({ where: { userId: targetId } });
      if (!exists) {
        await tx.companyProfile.create({ data: { userId: targetId, companyName: `${user.name}'s Company` } });
      }
    } else if (role === "CANDIDATE") {
      const exists = await tx.candidateProfile.findUnique({ where: { userId: targetId } });
      if (!exists) {
        await tx.candidateProfile.create({ data: { userId: targetId } });
      }
    }

    await writeAuditLog(tx, {
      actorId: adminId,
      action: "USER_ROLE_CHANGED",
      entity: "User",
      entityId: targetId,
      previousState: { role: target.role },
      newState: { role },
    });

    return user;
  });

  return updated;
}

export async function updateUserStatus(adminId: string, targetId: string, isActive: boolean) {
  if (adminId === targetId) {
    throw ApiError.badRequest("Admins cannot deactivate their own account");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.deletedAt) throw ApiError.notFound("User not found");

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { isActive, refreshToken: isActive ? target.refreshToken : null },
  });

  await writeAuditLog(prisma, {
    actorId: adminId,
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entity: "User",
    entityId: targetId,
    previousState: { isActive: target.isActive },
    newState: { isActive },
  });

  return updated;
}

export async function getDashboardStats() {
  const [
    totalUsers,
    totalCandidates,
    totalCompanies,
    totalAssessments,
    publishedAssessments,
    totalAttempts,
    completedAttempts,
    totalPaymentsSuccess,
    revenueAgg,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "CANDIDATE", deletedAt: null } }),
    prisma.user.count({ where: { role: "COMPANY", deletedAt: null } }),
    prisma.assessment.count({ where: { deletedAt: null } }),
    prisma.assessment.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.attempt.count(),
    prisma.attempt.count({ where: { status: "EVALUATED" } }),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
  ]);

  return {
    users: { total: totalUsers, candidates: totalCandidates, companies: totalCompanies },
    assessments: { total: totalAssessments, published: publishedAssessments },
    attempts: { total: totalAttempts, completed: completedAttempts },
    payments: { successfulCount: totalPaymentsSuccess, totalRevenueCents: revenueAgg._sum.amount ?? 0 },
  };
}

interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
  actorId?: string;
}

export async function listAuditLogs(query: ListAuditLogsParams) {
  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.AuditLogWhereInput = {
    ...(query.entity ? { entity: query.entity } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.actorId ? { actorId: query.actorId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}
