import { PrismaClient } from "@prisma/client";
import { isProd } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

// Reuse the client across hot-reloads / serverless invocations to avoid
// exhausting the database connection pool.
export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: isProd ? ["error", "warn"] : ["error", "warn"],
  });

if (!isProd) {
  global.__prisma__ = prisma;
}
