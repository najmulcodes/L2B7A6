import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Operation successful",
  statusCode = 200,
  meta?: PaginationMeta,
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  errors: unknown[] = [],
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
