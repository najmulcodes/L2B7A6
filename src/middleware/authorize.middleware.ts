import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

/**
 * Must run after `authenticate`. Rejects the request unless req.user.role is
 * one of the allowed roles. A user can never widen their own access by
 * tampering with the request body — this check is purely against the role
 * resolved server-side from the verified JWT + DB lookup.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`));
    }
    next();
  };
}
