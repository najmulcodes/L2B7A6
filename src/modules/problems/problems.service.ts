import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildMeta } from "../../lib/pagination";
import { cacheDelByPrefix } from "../../config/redis";
import { writeAuditLog } from "../../utils/audit";
import { resolveCompanyId as getCompanyIdForUser } from "../../utils/resolveCompany";

const CACHE_PREFIX = "problems:list:";

export async function createProblem(userId: string, input: Record<string, unknown>) {
  const companyId = await getCompanyIdForUser(userId);

  const problem = await prisma.problem.create({
    data: {
      ...input,
      companyId,
      createdById: userId,
    } as Prisma.ProblemUncheckedCreateInput,
  });

  await cacheDelByPrefix(CACHE_PREFIX);
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PROBLEM_CREATED",
    entity: "Problem",
    entityId: problem.id,
    newState: { title: problem.title, type: problem.type },
  });

  return problem;
}

interface ListParams {
  page?: number;
  limit?: number;
  type?: string;
  difficulty?: string;
  q?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listCompanyProblems(userId: string, query: ListParams) {
  const companyId = await getCompanyIdForUser(userId);
  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.ProblemWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.type ? { type: query.type as Prisma.EnumProblemTypeFilter["equals"] } : {}),
    ...(query.difficulty ? { difficulty: query.difficulty as Prisma.EnumDifficultyFilter["equals"] } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
            { tags: { has: query.q } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProblemOrderByWithRelationInput = {
    [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc",
  };

  const [items, total] = await Promise.all([
    prisma.problem.findMany({ where, orderBy, skip, take }),
    prisma.problem.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getProblemById(userId: string, id: string) {
  const companyId = await getCompanyIdForUser(userId);
  const problem = await prisma.problem.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!problem) throw ApiError.notFound("Problem not found");
  return problem;
}

export async function updateProblem(userId: string, id: string, input: Record<string, unknown>) {
  const companyId = await getCompanyIdForUser(userId);
  const existing = await prisma.problem.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Problem not found");

  const updated = await prisma.problem.update({ where: { id }, data: input });
  await cacheDelByPrefix(CACHE_PREFIX);

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PROBLEM_UPDATED",
    entity: "Problem",
    entityId: id,
    previousState: { title: existing.title },
    newState: { title: updated.title },
  });

  return updated;
}

export async function softDeleteProblem(userId: string, id: string) {
  const companyId = await getCompanyIdForUser(userId);
  const existing = await prisma.problem.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Problem not found");

  const inUse = await prisma.assessmentProblem.findFirst({
    where: { problemId: id, assessment: { status: "PUBLISHED", deletedAt: null } },
  });
  if (inUse) {
    throw ApiError.conflict("Cannot delete a problem that is attached to a published assessment");
  }

  await prisma.problem.update({ where: { id }, data: { deletedAt: new Date() } });
  await cacheDelByPrefix(CACHE_PREFIX);

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PROBLEM_DELETED",
    entity: "Problem",
    entityId: id,
    previousState: { title: existing.title },
  });
}
