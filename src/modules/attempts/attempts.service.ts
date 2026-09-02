import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildMeta } from "../../lib/pagination";
import { writeAuditLog } from "../../utils/audit";
import { resolveCompanyId } from "../../utils/resolveCompany";
import { acquireLock } from "../../config/redis";

/**
 * Lazily expires an in-progress attempt whose deadline has passed. Avoids
 * relying on a cron/setInterval (unavailable in serverless deployments) —
 * expiry is enforced on read/write access instead.
 */
async function expireIfPastDeadline(attempt: { id: string; status: string; deadlineAt: Date }) {
  if (attempt.status === "IN_PROGRESS" && attempt.deadlineAt < new Date()) {
    await prisma.attempt.update({ where: { id: attempt.id }, data: { status: "EXPIRED" } });
    return true;
  }
  return false;
}

async function assertCandidateOwnsAttempt(candidateId: string, attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { assessment: { include: { problems: true } }, submissions: true },
  });
  if (!attempt || attempt.candidateId !== candidateId) {
    throw ApiError.notFound("Attempt not found");
  }
  return attempt;
}

export async function getAttemptById(userId: string, role: "CANDIDATE" | "COMPANY" | "ADMIN", id: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      assessment: true,
      submissions: true,
    },
  });
  if (!attempt) throw ApiError.notFound("Attempt not found");

  if (role === "CANDIDATE" && attempt.candidateId !== userId) {
    throw ApiError.forbidden("You do not have access to this attempt");
  }
  if (role === "COMPANY") {
    const companyId = await resolveCompanyId(userId);
    if (attempt.assessment.companyId !== companyId) {
      throw ApiError.forbidden("You do not have access to this attempt");
    }
  }

  await expireIfPastDeadline(attempt);

  // Hide answer keys from the candidate while they can still see the attempt
  // (defense in depth — the candidate submission flow never returns them
  // either, but this keeps the read path safe too).
  if (role === "CANDIDATE") {
    return { ...attempt, submissions: attempt.submissions.map(({ score, feedback, ...rest }) => rest) };
  }

  return attempt;
}

export async function listMyAttempts(candidateId: string, query: { page?: number; limit?: number; status?: string }) {
  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);
  const where: Prisma.AttemptWhereInput = {
    candidateId,
    ...(query.status ? { status: query.status as Prisma.EnumAttemptStatusFilter["equals"] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.attempt.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { assessment: { select: { id: true, title: true, passingScore: true } } },
    }),
    prisma.attempt.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function listAssessmentAttempts(
  userId: string,
  assessmentId: string,
  query: { page?: number; limit?: number; status?: string },
) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");

  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);
  const where: Prisma.AttemptWhereInput = {
    assessmentId,
    ...(query.status ? { status: query.status as Prisma.EnumAttemptStatusFilter["equals"] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.attempt.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { candidate: { select: { id: true, name: true, email: true } } },
    }),
    prisma.attempt.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function submitAnswer(
  candidateId: string,
  attemptId: string,
  input: { problemId: string; selectedOption?: string; answerText?: string; code?: string; language?: string },
) {
  const attempt = await assertCandidateOwnsAttempt(candidateId, attemptId);

  const expired = await expireIfPastDeadline(attempt);
  if (expired || attempt.status !== "IN_PROGRESS") {
    throw ApiError.conflict("This attempt is no longer in progress");
  }

  const linked = attempt.assessment.problems.find((p) => p.problemId === input.problemId);
  if (!linked) {
    throw ApiError.badRequest("This problem is not part of the assessment for this attempt");
  }

  const submission = await prisma.submission.upsert({
    where: { attemptId_problemId: { attemptId, problemId: input.problemId } },
    update: {
      selectedOption: input.selectedOption,
      answerText: input.answerText,
      code: input.code,
      language: input.language,
    },
    create: {
      attemptId,
      problemId: input.problemId,
      selectedOption: input.selectedOption,
      answerText: input.answerText,
      code: input.code,
      language: input.language,
    },
  });

  return submission;
}

/**
 * Finalizes an attempt: locks the submission window, auto-scores MCQ
 * submissions, and either marks the attempt fully EVALUATED (if no
 * problems require manual grading) or SUBMITTED (awaiting company review
 * for WRITTEN/CODING problems).
 */
export async function finalizeAttempt(candidateId: string, attemptId: string) {
  const release = await acquireLock(`lock:submit-attempt:${attemptId}`, 10000);
  if (release === null) {
    throw ApiError.conflict("This attempt is already being submitted");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.findUnique({
        where: { id: attemptId },
        include: {
          assessment: { include: { problems: { include: { problem: true } } } },
          submissions: true,
          invitation: true,
        },
      });
      if (!attempt || attempt.candidateId !== candidateId) {
        throw ApiError.notFound("Attempt not found");
      }
      if (attempt.status !== "IN_PROGRESS") {
        throw ApiError.conflict("This attempt has already been submitted");
      }

      let totalScore = 0;
      let maxScore = 0;
      let hasPending = false;

      for (const link of attempt.assessment.problems) {
        const points = link.pointsOverride ?? link.problem.points;
        maxScore += points;

        const submission = attempt.submissions.find((s) => s.problemId === link.problemId);

        if (link.problem.type === "MCQ") {
          const isCorrect = !!submission?.selectedOption && submission.selectedOption === link.problem.correctOption;
          const score = isCorrect ? points : 0;
          totalScore += score;

          if (submission) {
            await tx.submission.update({
              where: { id: submission.id },
              data: { status: "AUTO_EVALUATED", score },
            });
          } else {
            await tx.submission.create({
              data: {
                attemptId,
                problemId: link.problemId,
                status: "AUTO_EVALUATED",
                score: 0,
              },
            });
          }
        } else {
          // WRITTEN / CODING require manual evaluation.
          if (!submission) {
            await tx.submission.create({
              data: { attemptId, problemId: link.problemId, status: "PENDING", score: 0 },
            });
          }
          hasPending = true;
        }
      }

      const newStatus = hasPending ? "SUBMITTED" : "EVALUATED";
      const passed = hasPending ? null : (totalScore / Math.max(maxScore, 1)) * 100 >= attempt.assessment.passingScore;

      const updated = await tx.attempt.update({
        where: { id: attemptId },
        data: {
          status: newStatus,
          submittedAt: new Date(),
          totalScore: hasPending ? null : totalScore,
          maxScore,
          passed,
        },
      });

      if (!hasPending) {
        await tx.invitation.update({ where: { id: attempt.invitationId }, data: { status: "COMPLETED" } });
      }

      await writeAuditLog(tx, {
        actorId: candidateId,
        action: "ATTEMPT_SUBMITTED",
        entity: "Attempt",
        entityId: attemptId,
        newState: { status: newStatus, totalScore: hasPending ? null : totalScore, maxScore },
      });

      return updated;
    });
  } finally {
    await release();
  }
}

export async function getAttemptReport(userId: string, role: "CANDIDATE" | "COMPANY" | "ADMIN", attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { select: { id: true, title: true, passingScore: true, companyId: true } },
      submissions: { include: { problem: { select: { id: true, title: true, type: true, points: true } } } },
    },
  });
  if (!attempt) throw ApiError.notFound("Attempt not found");

  if (role === "CANDIDATE" && attempt.candidateId !== userId) {
    throw ApiError.forbidden("You do not have access to this report");
  }
  if (role === "COMPANY") {
    const companyId = await resolveCompanyId(userId);
    if (attempt.assessment.companyId !== companyId) {
      throw ApiError.forbidden("You do not have access to this report");
    }
  }

  if (attempt.status !== "EVALUATED" && attempt.status !== "SUBMITTED") {
    throw ApiError.conflict("This attempt has not been submitted yet");
  }

  return {
    attemptId: attempt.id,
    assessment: attempt.assessment,
    status: attempt.status,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    breakdown: attempt.submissions.map((s) => ({
      problemId: s.problemId,
      problemTitle: s.problem.title,
      type: s.problem.type,
      status: s.status,
      score: s.score,
      maxPoints: s.problem.points,
      feedback: s.feedback,
    })),
  };
}
