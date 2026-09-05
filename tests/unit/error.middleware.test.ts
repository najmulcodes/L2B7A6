import type { Request, Response } from "express";
import { errorHandler, notFoundHandler } from "../../src/middleware/error.middleware";
import { ApiError } from "../../src/utils/ApiError";

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("errorHandler", () => {
  it("formats an ApiError using its own statusCode/message/errors", () => {
    const res = mockRes();
    const err = ApiError.conflict("Duplicate", [{ field: "email" }]);
    errorHandler(err, {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Duplicate", errors: [{ field: "email" }] });
  });

    it("falls back to 500 for unknown errors and never leaks the raw message in production", () => {
    // isProd is captured once from env.NODE_ENV at module-load time (correct
    // for a real process, where NODE_ENV never changes mid-run) — so this
    // test exercises the production branch by mocking the config module
    // fresh, rather than mutating process.env.NODE_ENV after the fact,
    // which the already-imported errorHandler would never observe.
    jest.resetModules();
    jest.doMock("../../src/config/env", () => ({ isProd: true }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { errorHandler: prodErrorHandler } = require("../../src/middleware/error.middleware");

    const res = mockRes();
    prodErrorHandler(new Error("some internal detail"), {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).not.toContain("some internal detail");

    jest.dontMock("../../src/config/env");
    jest.resetModules();
  });

  it("maps JWT errors to 401", () => {
    const res = mockRes();
    const jwtErr = Object.assign(new Error("jwt expired"), { name: "TokenExpiredError" });
    errorHandler(jwtErr, {} as Request, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("notFoundHandler", () => {
  it("forwards a 404 ApiError describing the missing route", () => {
    const next = jest.fn();
    notFoundHandler({ method: "GET", originalUrl: "/api/v1/nope" } as Request, {} as Response, next);
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain("GET /api/v1/nope");
  });
});
