import type { Request, Response } from "express";
import { authorize } from "../../src/middleware/authorize.middleware";
import { ApiError } from "../../src/utils/ApiError";

function mockReq(role?: "CANDIDATE" | "COMPANY" | "ADMIN"): Request {
  return { user: role ? { id: "u1", email: "u1@test.com", role } : undefined } as unknown as Request;
}

describe("authorize middleware", () => {
  it("calls next() without error when the user has an allowed role", () => {
    const req = mockReq("ADMIN");
    const next = jest.fn();
    authorize("ADMIN", "COMPANY")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects with 403 when the user's role is not allowed", () => {
    const req = mockReq("CANDIDATE");
    const next = jest.fn();
    authorize("ADMIN")(req, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });

  it("rejects with 401 when req.user is missing (no authentication)", () => {
    const req = mockReq(undefined);
    const next = jest.fn();
    authorize("ADMIN")(req, {} as Response, next);
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
  });

  it("never widens access based on anything other than req.user.role", () => {
    // A tampered body claiming role=ADMIN must have no effect — only the
    // server-resolved req.user.role (set by `authenticate` from the verified
    // JWT + DB lookup) is consulted.
    const req = { user: { id: "u1", email: "x", role: "CANDIDATE" }, body: { role: "ADMIN" } } as unknown as Request;
    const next = jest.fn();
    authorize("ADMIN")(req, {} as Response, next);
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
  });
});
