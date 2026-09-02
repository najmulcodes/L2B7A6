import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../lib/response";
import { isProd } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // eslint-disable-next-line no-console
  if (!isProd) console.error(err);

  if (err instanceof ApiError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
        sendError(res, `A record with this ${target} already exists`, 409, [{ code: err.code }]);
        return;
      }
      case "P2025":
        sendError(res, "Requested record was not found", 404, [{ code: err.code }]);
        return;
      case "P2003":
        sendError(res, "Related record does not exist", 400, [{ code: err.code }]);
        return;
      case "P2000":
        sendError(res, "Provided value is too long for its column", 400, [{ code: err.code }]);
        return;
      default:
        sendError(res, "Database request error", 400, [{ code: err.code }]);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, "Invalid data provided to the database layer", 400);
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    sendError(res, "Database connection failed", 503);
    return;
  }

  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name?: string }).name;
    if (name === "JsonWebTokenError" || name === "TokenExpiredError") {
      sendError(res, "Invalid or expired token", 401);
      return;
    }
    if (name === "SyntaxError" && "body" in (err as Record<string, unknown>)) {
      sendError(res, "Malformed JSON in request body", 400);
      return;
    }
  }

  const message = err instanceof Error ? err.message : "Something went wrong";
  sendError(res, isProd ? "Something went wrong" : message, 500);
}
