import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildMeta } from "../../lib/pagination";
import { writeAuditLog } from "../../utils/audit";
import { resolveCompanyId } from "../../utils/resolveCompany";

export async function createInvitation(
  userId: string,
  assessmentId: string,
  input: { candidateEmail: string; expiresInDays: number },
) {
  const companyId = await resolveCompanyId(userId);

  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  if (assessment.status !== "PUBLISHED") {
    throw ApiError.conflict("Only PUBLISHED assessments can be used to invite candidates");
  }

  const candidate = await prisma.user.findUnique({ where: { email: input.candidateEmail } });
  if (!candidate || candidate.deletedAt) {
    throw ApiError.notFound("No candidate account exists with this email. Ask them to register first.");
  }
  if (candidate.role !== "CANDIDATE") {
    throw ApiError.badRequest("This email does not belong to a candidate account");
  }

  const existing = await prisma.invitation.findUnique({
    where: { assessmentId_candidateId: { assessmentId, candidateId: candidate.id } },
  });
  if (existing) throw ApiError.conflict("This candidate has already been invited to this assessment");

  const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      assessmentId,
      candidateId: candidate.id,
      invitedById: userId,
      expiresAt,
    },
  });

  await writeAuditLog(prisma, {
    actorId: userId,
    action: "INVITATION_CREATED",
    entity: "Invitation",
    entityId: invitation.id,
    newState: { assessmentId, candidateId: candidate.id },
  });

  return invitation;
}

export async function listAssessmentInvitations(
  userId: string,
  assessmentId: string,
  query: { page?: number; limit?: number; status?: string },
) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");

  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);
  const where: Prisma.InvitationWhereInput = {
    assessmentId,
    ...(query.status ? { status: query.status as Prisma.EnumInvitationStatusFilter["equals"] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { candidate: { select: { id: true, name: true, email: true } } },
    }),
    prisma.invitation.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function listMyInvitations(
  candidateId: string,
  query: { page?: number; limit?: number; status?: string },
) {
  const { page, limit, skip, take } = parsePagination(query as Record<string, unknown>);
  const where: Prisma.InvitationWhereInput = {
    candidateId,
    ...(query.status ? { status: query.status as Prisma.EnumInvitationStatusFilter["equals"] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: { id: true, title: true, durationMinutes: true, passingScore: true, company: { select: { companyName: true } } },
        },
      },
    }),
    prisma.invitation.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

/**
 * Accepting an invitation atomically creates the candidate's Attempt and
 * flips the invitation to ACCEPTED — wrapped in a transaction so a
 * duplicate/concurrent accept can never spawn two attempts for the same
 * invitation (enforced additionally by the unique constraint on
 * Attempt.invitationId).
 */
export async function acceptInvitation(candidateId: string, invitationId: string) {
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { id: invitationId },
      include: { assessment: true },
    });
    if (!invitation || invitation.candidateId !== candidateId) {
      throw ApiError.notFound("Invitation not found");
    }
    if (invitation.status !== "PENDING") {
      throw ApiError.conflict(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }
    if (invitation.expiresAt < new Date()) {
      await tx.invitation.update({ where: { id: invitationId }, data: { status: "EXPIRED" } });
      throw ApiError.conflict("This invitation has expired");
    }
    if (invitation.assessment.status !== "PUBLISHED" || invitation.assessment.deletedAt) {
      throw ApiError.conflict("This assessment is no longer available");
    }

    const deadlineAt = new Date(Date.now() + invitation.assessment.durationMinutes * 60 * 1000);

    const attempt = await tx.attempt.create({
      data: {
        assessmentId: invitation.assessmentId,
        candidateId,
        invitationId,
        deadlineAt,
      },
    });

    await tx.invitation.update({ where: { id: invitationId }, data: { status: "ACCEPTED" } });

    await writeAuditLog(tx, {
      actorId: candidateId,
      action: "INVITATION_ACCEPTED",
      entity: "Invitation",
      entityId: invitationId,
      newState: { attemptId: attempt.id },
    });

    return attempt;
  });
}

export async function declineInvitation(candidateId: string, invitationId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.candidateId !== candidateId) {
    throw ApiError.notFound("Invitation not found");
  }
  if (invitation.status !== "PENDING") {
    throw ApiError.conflict(`Invitation has already been ${invitation.status.toLowerCase()}`);
  }

  const updated = await prisma.invitation.update({ where: { id: invitationId }, data: { status: "DECLINED" } });

  await writeAuditLog(prisma, {
    actorId: candidateId,
    action: "INVITATION_DECLINED",
    entity: "Invitation",
    entityId: invitationId,
  });

  return updated;
}
