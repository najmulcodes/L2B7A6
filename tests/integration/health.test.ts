import request from "supertest";
import { createApp } from "../../src/app";

describe("GET /health", () => {
  it("returns 200 with a healthy status payload", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Service is healthy",
      data: expect.objectContaining({ status: "ok" }),
    });
  });

  it("returns a standardized 404 error for unknown routes", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("rejects protected routes without a Bearer token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
