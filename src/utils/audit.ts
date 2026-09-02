import type { Prisma, PrismaClient } from "@prisma/client";

interface AuditInput {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  previousState?: Prisma.InputJsonValue | null;
  newState?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
}

/**
 * Writes an audit log entry. Accepts either the global prisma client or a
 * transaction client (`tx`) so audit writes participate in the same
 * transaction as the state change they describe.
 */
export async function writeAuditLog(
  client: PrismaClient | Prisma.TransactionClient,
  input: AuditInput,
): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      previousState: input.previousState ?? undefined,
      newState: input.newState ?? undefined,
      metadata: input.metadata ?? undefined,
      ipAddress: input.ipAddress ?? null,
    },
  });
}
