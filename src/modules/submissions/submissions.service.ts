import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { writeAuditLog } from "../../utils/audit";
import { resolveCompanyId } from "../../utils/resolveCompany";

async function findSubmissionForCompany(userId: string, id: string) {
  const companyId = await resolveCompanyId(userId);
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      problem: true,
      attempt: { include: { assessment: true } },
    },
  });
  if (!submission || submission.attempt.assessment.companyId !== companyId) {
    throw ApiError.notFound("Submission not found");
  }
  return submission;
}

export async function getSubmissionById(userId: string, id: string) {
  return findSubmissionForCompany(userId, id);
}

/**
 * Manually scores a WRITTEN/CODING submission. If this was the last
 * PENDING submission for the attempt, the attempt is atomically finalized
 * to EVALUATED with the aggregate score/pass result.
 */
export async function evaluateSubmission(
  evaluatorId: string,
  id: string,
  input: { score: number; feedback?: string },
) {
  const submission = await findSubmissionForCompany(evaluatorId, id);

  if (submission.problem.type === "MCQ") {
    throw ApiError.badRequest("MCQ submissions are auto-evaluated and cannot be manually scored");
  }
  const maxPoints = submission.problem.points;
  if (input.score > maxPoints) {
    throw ApiError.badRequest(`Score cannot exceed the problem's maximum of ${maxPoints} points`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id },
      data: {
        score: input.score,
        feedback: input.feedback,
        status: "MANUALLY_EVALUATED",
        evaluatedById: evaluatorId,
        evaluatedAt: new Date(),
      },
    });

    await writeAuditLog(tx, {
      actorId: evaluatorId,
      action: "SUBMISSION_EVALUATED",
      entity: "Submission",
      entityId: id,
      newState: { score: input.score },
    });

    const remainingPending = await tx.submission.count({
      where: { attemptId: submission.attemptId, status: "PENDING" },
    });

    if (remainingPending === 0) {
      const allSubmissions = await tx.submission.findMany({ where: { attemptId: submission.attemptId } });
      const totalScore = allSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0);
      const attempt = await tx.attempt.findUniqueOrThrow({ where: { id: submission.attemptId } });
      const maxScore = attempt.maxScore ?? totalScore;
      const passed = (totalScore / Math.max(maxScore, 1)) * 100 >= submission.attempt.assessment.passingScore;

      await tx.attempt.update({
        where: { id: submission.attemptId },
        data: { status: "EVALUATED", totalScore, passed },
      });

      await tx.invitation.update({
        where: { id: submission.attempt.invitationId },
        data: { status: "COMPLETED" },
      });
    }

    return updated;
  });
}
