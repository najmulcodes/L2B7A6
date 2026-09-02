import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("POST /api/v1/auth/register — validation layer", () => {
  it("rejects a weak password before any database access", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "weak",
      role: "CANDIDATE",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("rejects an invalid email format", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Jane Doe",
      email: "not-an-email",
      password: "StrongPass1",
      role: "CANDIDATE",
    });
    expect(res.status).toBe(400);
  });

  it("requires companyName when registering as COMPANY", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "StrongPass1",
      role: "COMPANY",
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.errors)).toContain("companyName");
  });
});

describe("POST /api/v1/auth/login — validation layer", () => {
  it("rejects a missing password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "jane@example.com" });
    expect(res.status).toBe(400);
  });
});

// NOTE: Full end-to-end auth flow tests (register → receive tokens → login →
// refresh → logout) require a live PostgreSQL database and are intentionally
// not run against a mocked Prisma client to avoid false confidence. Point
// DATABASE_URL at a disposable test database and see tests/integration/README.md
// for the full suite these validation-only tests are a safe subset of.
