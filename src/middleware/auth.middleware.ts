import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../config/prisma";
import { catchAsync } from "../lib/catchAsync";

export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length).trim();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired access token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw ApiError.unauthorized("Account no longer exists or has been deactivated");
  }

  req.user = { id: user.id, email: user.email, role: user.role };
  next();
});

/**
 * Attaches req.user if a valid access token is present, but never rejects
 * the request. Used for endpoints that are public but behave differently
 * for authenticated callers (none currently required, kept for reuse).
 */
export const optionalAuthenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length).trim());
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true },
    });
    if (user && !user.deletedAt && user.isActive) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
  } catch {
    /* ignore invalid token on optional auth */
  }
  next();
});
