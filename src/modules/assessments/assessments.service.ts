import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildMeta } from "../../lib/pagination";
import { writeAuditLog } from "../../utils/audit";
import { resolveCompanyId } from "../../utils/resolveCompany";
import { cacheDelByPrefix, acquireLock } from "../../config/redis";

const LIST_CACHE_PREFIX = "assessments:list:";

export async function createAssessment(userId: string, input: Record<string, unknown>) {
  const companyId = await resolveCompanyId(userId);

  const assessment = await prisma.assessment.create({
    data: { ...input, companyId, createdById: userId } as Prisma.AssessmentUncheckedCreateInput,
  });

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_CREATED",
    entity: "Assessment",
    entityId: assessment.id,
    newState: { title: assessment.title, status: assessment.status },
  });

  return assessment;
}

interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listMyAssessments(userId: string, query: ListParams) {
  const companyId = await resolveCompanyId(userId);
  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.AssessmentWhereInput = {
    companyId,
    deletedAt: null,
    ...(query.status ? { status: query.status as Prisma.EnumAssessmentStatusFilter["equals"] } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.AssessmentOrderByWithRelationInput = {
    [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc",
  };

  const [items, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { _count: { select: { problems: true, invitations: true, attempts: true } } },
    }),
    prisma.assessment.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

async function findOwnedAssessment(userId: string, id: string, role: "COMPANY" | "ADMIN") {
  if (role === "ADMIN") {
    const assessment = await prisma.assessment.findFirst({
      where: { id, deletedAt: null },
      include: { problems: { include: { problem: true }, orderBy: { order: "asc" } }, company: true },
    });
    if (!assessment) throw ApiError.notFound("Assessment not found");
    return assessment;
  }

  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { problems: { include: { problem: true }, orderBy: { order: "asc" } }, company: true },
  });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  return assessment;
}

export async function getAssessmentById(userId: string, id: string, role: "COMPANY" | "ADMIN") {
  return findOwnedAssessment(userId, id, role);
}

export async function updateAssessment(userId: string, id: string, input: Record<string, unknown>) {
  const companyId = await resolveCompanyId(userId);
  const existing = await prisma.assessment.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Assessment not found");
  if (existing.status !== "DRAFT") {
    throw ApiError.conflict("Only assessments in DRAFT status can be edited. Archive and duplicate instead.");
  }

  const updated = await prisma.assessment.update({ where: { id }, data: input });
  await cacheDelByPrefix(LIST_CACHE_PREFIX);

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_UPDATED",
    entity: "Assessment",
    entityId: id,
    previousState: { title: existing.title },
    newState: { title: updated.title },
  });

  return updated;
}

export async function softDeleteAssessment(userId: string, id: string) {
  const companyId = await resolveCompanyId(userId);
  const existing = await prisma.assessment.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Assessment not found");

  const attemptCount = await prisma.attempt.count({ where: { assessmentId: id } });
  if (attemptCount > 0 && existing.status === "PUBLISHED") {
    throw ApiError.conflict("Cannot delete a published assessment that already has candidate attempts. Archive it instead.");
  }

  await prisma.assessment.update({ where: { id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
  await cacheDelByPrefix(LIST_CACHE_PREFIX);

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_DELETED",
    entity: "Assessment",
    entityId: id,
    previousState: { title: existing.title },
  });
}

export async function attachProblem(
  userId: string,
  assessmentId: string,
  input: { problemId: string; order?: number; pointsOverride?: number },
) {
  const companyId = await resolveCompanyId(userId);

  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  if (assessment.status !== "DRAFT") {
    throw ApiError.conflict("Problems can only be attached while the assessment is in DRAFT status");
  }

  const problem = await prisma.problem.findFirst({ where: { id: input.problemId, companyId, deletedAt: null } });
  if (!problem) throw ApiError.notFound("Problem not found in your problem bank");

  const existingLink = await prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId: input.problemId } },
  });
  if (existingLink) throw ApiError.conflict("This problem is already attached to the assessment");

  const link = await prisma.assessmentProblem.create({
    data: {
      assessmentId,
      problemId: input.problemId,
      order: input.order ?? 0,
      pointsOverride: input.pointsOverride,
    },
    include: { problem: true },
  });

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_PROBLEM_ATTACHED",
    entity: "Assessment",
    entityId: assessmentId,
    newState: { problemId: input.problemId },
  });

  return link;
}

export async function detachProblem(userId: string, assessmentId: string, problemId: string) {
  const companyId = await resolveCompanyId(userId);

  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  if (assessment.status !== "DRAFT") {
    throw ApiError.conflict("Problems can only be removed while the assessment is in DRAFT status");
  }

  const link = await prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId } },
  });
  if (!link) throw ApiError.notFound("This problem is not attached to the assessment");

  await prisma.assessmentProblem.delete({ where: { id: link.id } });

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_PROBLEM_DETACHED",
    entity: "Assessment",
    entityId: assessmentId,
    previousState: { problemId },
  });
}

/**
 * Publishing an assessment consumes exactly one assessment credit from the
 * company's balance. This is the core "spend" business operation that must
 * be race-condition-safe: two concurrent publish requests must not both
 * succeed off a single remaining credit. We serialize via a short Redis
 * lock (best-effort, skipped gracefully if Redis is down) and enforce the
 * real guarantee with an atomic conditional update inside a DB transaction.
 */
export async function publishAssessment(userId: string, id: string) {
  const companyId = await resolveCompanyId(userId);

  const release = await acquireLock(`lock:publish:${companyId}`, 8000);
  if (release === null) {
    throw ApiError.tooManyRequests("Another publish operation is already in progress for your account. Try again shortly.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.findFirst({
        where: { id, companyId, deletedAt: null },
        include: { problems: true },
      });
      if (!assessment) throw ApiError.notFound("Assessment not found");
      if (assessment.status !== "DRAFT") {
        throw ApiError.conflict("Only DRAFT assessments can be published");
      }
      if (assessment.problems.length === 0) {
        throw ApiError.badRequest("Attach at least one problem before publishing");
      }

      // Atomic conditional decrement — only succeeds if credits are still > 0,
      // preventing a race between two simultaneous publish calls.
      const decremented = await tx.companyProfile.updateMany({
        where: { id: companyId, assessmentCredits: { gt: 0 } },
        data: { assessmentCredits: { decrement: 1 } },
      });

      if (decremented.count === 0) {
        throw ApiError.forbidden(
          "No assessment credits remaining. Purchase credits via POST /api/v1/payments/initiate before publishing.",
        );
      }

      const published = await tx.assessment.update({ where: { id }, data: { status: "PUBLISHED" } });

      await writeAuditLog(tx, {
        actorId: userId,
        action: "ASSESSMENT_PUBLISHED",
        entity: "Assessment",
        entityId: id,
        previousState: { status: "DRAFT" },
        newState: { status: "PUBLISHED" },
        metadata: { creditsSpent: 1 },
      });

      return published;
    });
  } finally {
    await release();
    await cacheDelByPrefix(LIST_CACHE_PREFIX);
  }
}
