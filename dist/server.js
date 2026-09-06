"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);

// src/app.ts
var import_express15 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
var import_compression = __toESM(require("compression"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_morgan = __toESM(require("morgan"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_yamljs = __toESM(require("yamljs"));

// src/config/env.ts
var import_config = require("dotenv/config");
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "production", "test"]).default("development"),
  PORT: import_zod.z.coerce.number().default(5e3),
  DATABASE_URL: import_zod.z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: import_zod.z.string().optional(),
  JWT_ACCESS_SECRET: import_zod.z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: import_zod.z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_ACCESS_EXPIRES_IN: import_zod.z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: import_zod.z.string().default("30d"),
  BCRYPT_SALT_ROUNDS: import_zod.z.coerce.number().default(12),
  GOOGLE_CLIENT_ID: import_zod.z.string().optional(),
  GOOGLE_CLIENT_SECRET: import_zod.z.string().optional(),
  REDIS_URL: import_zod.z.string().optional(),
  STRIPE_SECRET_KEY: import_zod.z.string().optional(),
  STRIPE_WEBHOOK_SECRET: import_zod.z.string().optional(),
  STRIPE_SUCCESS_URL: import_zod.z.string().optional(),
  STRIPE_CANCEL_URL: import_zod.z.string().optional(),
  ADMIN_EMAIL: import_zod.z.string().email().default("admin@devassess.com"),
  ADMIN_PASSWORD: import_zod.z.string().min(8).default("ChangeMe123!"),
  CORS_ORIGIN: import_zod.z.string().default("*")
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274C Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}
var env = parsed.data;
var isProd = env.NODE_ENV === "production";
var isTest = env.NODE_ENV === "test";

// src/routes/v1.ts
var import_express14 = require("express");

// src/modules/auth/auth.routes.ts
var import_express = require("express");

// src/lib/catchAsync.ts
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// src/lib/response.ts
function sendSuccess(res, data, message = "Operation successful", statusCode = 200, meta) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...meta ? { meta } : {}
  });
}
function sendError(res, message = "Something went wrong", statusCode = 500, errors = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

// src/modules/auth/auth.service.ts
var import_google_auth_library = require("google-auth-library");

// src/config/prisma.ts
var import_client = require("@prisma/client");
var prisma = global.__prisma__ ?? new import_client.PrismaClient({
  log: isProd ? ["error", "warn"] : ["error", "warn"]
});
if (!isProd) {
  global.__prisma__ = prisma;
}

// src/utils/ApiError.ts
var ApiError = class _ApiError extends Error {
  statusCode;
  errors;
  isOperational;
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(message = "Bad request", errors = []) {
    return new _ApiError(400, message, errors);
  }
  static unauthorized(message = "Unauthorized") {
    return new _ApiError(401, message);
  }
  static forbidden(message = "Forbidden") {
    return new _ApiError(403, message);
  }
  static notFound(message = "Resource not found") {
    return new _ApiError(404, message);
  }
  static conflict(message = "Conflict", errors = []) {
    return new _ApiError(409, message, errors);
  }
  static unprocessable(message = "Unprocessable entity", errors = []) {
    return new _ApiError(422, message, errors);
  }
  static tooManyRequests(message = "Too many requests") {
    return new _ApiError(429, message);
  }
  static internal(message = "Internal server error") {
    return new _ApiError(500, message);
  }
};

// src/utils/hash.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
async function hashValue(plain) {
  return import_bcryptjs.default.hash(plain, env.BCRYPT_SALT_ROUNDS);
}
async function compareValue(plain, hashed) {
  if (!hashed) return false;
  return import_bcryptjs.default.compare(plain, hashed);
}

// src/lib/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
function signAccessToken(payload) {
  return import_jsonwebtoken.default.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });
}
function signRefreshToken(payload) {
  return import_jsonwebtoken.default.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });
}
function verifyAccessToken(token) {
  return import_jsonwebtoken.default.verify(token, env.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
  return import_jsonwebtoken.default.verify(token, env.JWT_REFRESH_SECRET);
}

// src/utils/audit.ts
async function writeAuditLog(client2, input) {
  await client2.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      previousState: input.previousState ?? void 0,
      newState: input.newState ?? void 0,
      metadata: input.metadata ?? void 0,
      ipAddress: input.ipAddress ?? null
    }
  });
}

// src/modules/auth/auth.service.ts
var googleClient = env.GOOGLE_CLIENT_ID ? new import_google_auth_library.OAuth2Client(env.GOOGLE_CLIENT_ID) : null;
var PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true
};
async function issueTokens(userId, email, role) {
  const accessToken = signAccessToken({ sub: userId, email, role });
  const refreshToken2 = signRefreshToken({ sub: userId });
  const hashedRefresh = await hashValue(refreshToken2);
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: hashedRefresh } });
  return { accessToken, refreshToken: refreshToken2 };
}
async function createProfileForRole(userId, role, companyName) {
  if (role === "COMPANY") {
    await prisma.companyProfile.create({
      data: { userId, companyName }
    });
  } else if (role === "CANDIDATE") {
    await prisma.candidateProfile.create({ data: { userId } });
  }
}
async function registerUser(input, ip) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }
  const passwordHash = await hashValue(input.password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        role: input.role
      },
      select: PUBLIC_USER_SELECT
    });
    if (input.role === "COMPANY") {
      await tx.companyProfile.create({
        data: { userId: created.id, companyName: input.companyName }
      });
    } else {
      await tx.candidateProfile.create({ data: { userId: created.id } });
    }
    await writeAuditLog(tx, {
      actorId: created.id,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: created.id,
      newState: { email: created.email, role: created.role },
      ipAddress: ip
    });
    return created;
  });
  const tokens = await issueTokens(user.id, user.email, user.role);
  return { user, ...tokens };
}
async function loginUser(input, ip) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.deletedAt) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.isActive) {
    throw ApiError.forbidden("This account has been deactivated. Contact support.");
  }
  if (!user.password) {
    throw ApiError.badRequest("This account uses Google Sign-In. Please continue with Google.");
  }
  const valid = await compareValue(input.password, user.password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const tokens = await issueTokens(user.id, user.email, user.role);
  await writeAuditLog(prisma, {
    actorId: user.id,
    action: "USER_LOGIN",
    entity: "User",
    entityId: user.id,
    ipAddress: ip
  });
  const { password: _pw, refreshToken: _rt, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}
async function refreshUserToken(refreshToken2) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken2);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.deletedAt || !user.isActive) {
    throw ApiError.unauthorized("Account no longer available");
  }
  const matches = await compareValue(refreshToken2, user.refreshToken);
  if (!matches) {
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
    throw ApiError.unauthorized("Refresh token is no longer valid. Please log in again.");
  }
  const tokens = await issueTokens(user.id, user.email, user.role);
  return tokens;
}
async function logoutUser(userId) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
}
async function googleAuth(input, ip) {
  if (!googleClient || !env.GOOGLE_CLIENT_ID) {
    throw ApiError.badRequest("Google Sign-In is not configured on this server");
  }
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: input.idToken,
      audience: env.GOOGLE_CLIENT_ID
    });
  } catch {
    throw ApiError.unauthorized("Invalid Google token");
  }
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw ApiError.unauthorized("Google token did not include a verifiable email");
  }
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] }
  });
  if (user && user.deletedAt) {
    throw ApiError.forbidden("This account has been deactivated");
  }
  if (!user) {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: payload.name ?? payload.email.split("@")[0],
          email: payload.email.toLowerCase(),
          role: input.role,
          provider: "GOOGLE",
          googleId: payload.sub,
          avatarUrl: payload.picture ?? null
        }
      });
      await createProfileForRole(created.id, input.role, input.companyName);
      await writeAuditLog(tx, {
        actorId: created.id,
        action: "USER_REGISTERED_GOOGLE",
        entity: "User",
        entityId: created.id,
        newState: { email: created.email, role: created.role },
        ipAddress: ip
      });
      return created;
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub, provider: user.password ? user.provider : "GOOGLE" }
    });
  }
  const tokens = await issueTokens(user.id, user.email, user.role);
  const { password: _pw, refreshToken: _rt, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

// src/modules/auth/auth.controller.ts
var register = catchAsync(async (req, res) => {
  const result = await registerUser(req.body, req.ip);
  sendSuccess(res, result, "Registration successful", 201);
});
var login = catchAsync(async (req, res) => {
  const result = await loginUser(req.body, req.ip);
  sendSuccess(res, result, "Login successful");
});
var refreshToken = catchAsync(async (req, res) => {
  const result = await refreshUserToken(req.body.refreshToken);
  sendSuccess(res, result, "Token refreshed successfully");
});
var logout = catchAsync(async (req, res) => {
  await logoutUser(req.user.id);
  sendSuccess(res, null, "Logged out successfully");
});
var google = catchAsync(async (req, res) => {
  const result = await googleAuth(req.body, req.ip);
  sendSuccess(res, result, "Google authentication successful");
});

// src/middleware/validate.middleware.ts
var import_zod2 = require("zod");
function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        Object.assign(req.query, parsedQuery);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof import_zod2.ZodError) {
        const errors = err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }));
        next(ApiError.badRequest("Validation failed", errors));
        return;
      }
      next(err);
    }
  };
}

// src/middleware/auth.middleware.ts
var authenticate = catchAsync(async (req, _res, next) => {
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
    select: { id: true, email: true, role: true, isActive: true, deletedAt: true }
  });
  if (!user || user.deletedAt || !user.isActive) {
    throw ApiError.unauthorized("Account no longer exists or has been deactivated");
  }
  req.user = { id: user.id, email: user.email, role: user.role };
  next();
});
var optionalAuthenticate = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length).trim());
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, deletedAt: true }
    });
    if (user && !user.deletedAt && user.isActive) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
  } catch {
  }
  next();
});

// src/middleware/rateLimit.middleware.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"));

// src/config/redis.ts
var import_ioredis = __toESM(require("ioredis"));
var client = null;
var hasLoggedFailure = false;
if (env.REDIS_URL) {
  client = new import_ioredis.default(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy: (times) => times > 3 ? null : Math.min(times * 200, 1e3)
  });
  client.on("error", (err) => {
    if (!hasLoggedFailure) {
      console.warn(`\u26A0\uFE0F  Redis unavailable, continuing without cache/rate-limit backing store: ${err.message}`);
      hasLoggedFailure = true;
    }
  });
  client.connect().catch(() => {
  });
}
var redis = client;
async function cacheDelByPrefix(prefix) {
  if (!redis || redis.status !== "ready") return;
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {
  }
}
async function acquireLock(key, ttlMs = 5e3) {
  if (!redis || redis.status !== "ready") return async () => {
  };
  const token = `${Date.now()}-${Math.random()}`;
  const ok = await redis.set(key, token, "PX", ttlMs, "NX");
  if (ok !== "OK") return null;
  return async () => {
    try {
      const val = await redis.get(key);
      if (val === token) await redis.del(key);
    } catch {
    }
  };
}

// src/middleware/rateLimit.middleware.ts
var ResilientRedisStore = class {
  windowMs = 0;
  prefix;
  constructor(prefix) {
    this.prefix = prefix;
  }
  init(options) {
    this.windowMs = options.windowMs;
  }
  key(key) {
    return `rl:${this.prefix}:${key}`;
  }
  async increment(key) {
    if (!redis || redis.status !== "ready") {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
    try {
      const redisKey = this.key(key);
      const totalHits = await redis.incr(redisKey);
      if (totalHits === 1) {
        await redis.pexpire(redisKey, this.windowMs);
      }
      const ttl = await redis.pttl(redisKey);
      return { totalHits, resetTime: new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs)) };
    } catch {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }
  async decrement(key) {
    if (!redis || redis.status !== "ready") return;
    try {
      await redis.decr(this.key(key));
    } catch {
    }
  }
  async resetKey(key) {
    if (!redis || redis.status !== "ready") return;
    try {
      await redis.del(this.key(key));
    } catch {
    }
  }
};
function buildLimiter(windowMs, max, message, prefix) {
  return (0, import_express_rate_limit.default)({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: redis ? new ResilientRedisStore(prefix) : void 0,
    handler: (_req, res) => {
      sendError(res, message, 429);
    }
  });
}
var authRateLimiter = buildLimiter(
  15 * 60 * 1e3,
  20,
  "Too many authentication attempts. Please try again later.",
  "auth"
);
var apiRateLimiter = buildLimiter(
  15 * 60 * 1e3,
  600,
  "Too many requests. Please slow down.",
  "api"
);
var paymentRateLimiter = buildLimiter(
  60 * 60 * 1e3,
  30,
  "Too many payment requests. Please try again later.",
  "payment"
);

// src/modules/auth/auth.validation.ts
var import_zod3 = require("zod");
var passwordSchema = import_zod3.z.string().min(8, "Password must be at least 8 characters").max(128).regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number");
var registerSchema = import_zod3.z.object({
  name: import_zod3.z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: import_zod3.z.string().trim().toLowerCase().email("Invalid email address"),
  password: passwordSchema,
  role: import_zod3.z.enum(["CANDIDATE", "COMPANY"]).default("CANDIDATE"),
  companyName: import_zod3.z.string().trim().min(2).max(150).optional()
}).superRefine((data, ctx) => {
  if (data.role === "COMPANY" && !data.companyName) {
    ctx.addIssue({
      code: import_zod3.z.ZodIssueCode.custom,
      path: ["companyName"],
      message: "companyName is required when registering as a COMPANY"
    });
  }
});
var loginSchema = import_zod3.z.object({
  email: import_zod3.z.string().trim().toLowerCase().email("Invalid email address"),
  password: import_zod3.z.string().min(1, "Password is required")
});
var refreshTokenSchema = import_zod3.z.object({
  refreshToken: import_zod3.z.string().min(10, "refreshToken is required")
});
var googleAuthSchema = import_zod3.z.object({
  idToken: import_zod3.z.string().min(10, "Google idToken is required"),
  role: import_zod3.z.enum(["CANDIDATE", "COMPANY"]).default("CANDIDATE"),
  companyName: import_zod3.z.string().trim().min(2).max(150).optional()
});

// src/modules/auth/auth.routes.ts
var router = (0, import_express.Router)();
router.post("/register", authRateLimiter, validate({ body: registerSchema }), register);
router.post("/login", authRateLimiter, validate({ body: loginSchema }), login);
router.post("/refresh-token", authRateLimiter, validate({ body: refreshTokenSchema }), refreshToken);
router.post("/logout", authenticate, logout);
router.post("/google", authRateLimiter, validate({ body: googleAuthSchema }), google);
var auth_routes_default = router;

// src/modules/users/users.routes.ts
var import_express2 = require("express");

// src/modules/users/users.service.ts
var ME_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
  candidateProfile: true,
  companyProfile: true
};
async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: ME_SELECT });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}
async function updateMe(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: ME_SELECT
  });
  return user;
}
async function updateMyPassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  if (!user.password) {
    throw ApiError.badRequest("This account signs in with Google and has no password to change");
  }
  const valid = await compareValue(currentPassword, user.password);
  if (!valid) throw ApiError.unauthorized("Current password is incorrect");
  const hashed = await hashValue(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed, refreshToken: null } });
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PASSWORD_CHANGED",
    entity: "User",
    entityId: userId
  });
}

// src/modules/users/users.controller.ts
var getMe2 = catchAsync(async (req, res) => {
  const user = await getMe(req.user.id);
  sendSuccess(res, user, "Profile fetched successfully");
});
var updateMe2 = catchAsync(async (req, res) => {
  const user = await updateMe(req.user.id, req.body);
  sendSuccess(res, user, "Profile updated successfully");
});
var updateMyPassword2 = catchAsync(async (req, res) => {
  await updateMyPassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, null, "Password updated successfully");
});

// src/modules/users/users.validation.ts
var import_zod4 = require("zod");
var updateMeSchema = import_zod4.z.object({
  name: import_zod4.z.string().trim().min(2).max(100).optional(),
  avatarUrl: import_zod4.z.string().url().optional()
});
var updatePasswordSchema = import_zod4.z.object({
  currentPassword: import_zod4.z.string().min(1, "currentPassword is required"),
  newPassword: import_zod4.z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number")
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from the current password",
  path: ["newPassword"]
});

// src/modules/users/users.routes.ts
var router2 = (0, import_express2.Router)();
router2.use(authenticate);
router2.get("/me", getMe2);
router2.patch("/me", validate({ body: updateMeSchema }), updateMe2);
router2.patch("/me/password", validate({ body: updatePasswordSchema }), updateMyPassword2);
var users_routes_default = router2;

// src/modules/companies/companies.routes.ts
var import_express3 = require("express");

// src/modules/companies/companies.service.ts
async function getMyCompanyProfile(userId) {
  const profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound("Company profile not found");
  return profile;
}
async function updateMyCompanyProfile(userId, data) {
  const profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound("Company profile not found");
  return prisma.companyProfile.update({ where: { userId }, data });
}
async function getPublicCompanyProfile(id) {
  const profile = await prisma.companyProfile.findUnique({
    where: { id },
    select: {
      id: true,
      companyName: true,
      website: true,
      industry: true,
      about: true,
      logoUrl: true,
      verified: true,
      createdAt: true
    }
  });
  if (!profile) throw ApiError.notFound("Company not found");
  return profile;
}

// src/modules/companies/companies.controller.ts
var getMyProfile = catchAsync(async (req, res) => {
  const profile = await getMyCompanyProfile(req.user.id);
  sendSuccess(res, profile, "Company profile fetched successfully");
});
var updateMyProfile = catchAsync(async (req, res) => {
  const profile = await updateMyCompanyProfile(req.user.id, req.body);
  sendSuccess(res, profile, "Company profile updated successfully");
});
var getPublicProfile = catchAsync(async (req, res) => {
  const profile = await getPublicCompanyProfile(req.params.id);
  sendSuccess(res, profile, "Company profile fetched successfully");
});

// src/middleware/authorize.middleware.ts
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' is not permitted to perform this action`));
    }
    next();
  };
}

// src/modules/companies/companies.validation.ts
var import_zod5 = require("zod");
var updateCompanySchema = import_zod5.z.object({
  companyName: import_zod5.z.string().trim().min(2).max(150).optional(),
  website: import_zod5.z.string().url().optional(),
  industry: import_zod5.z.string().trim().max(100).optional(),
  about: import_zod5.z.string().trim().max(2e3).optional(),
  logoUrl: import_zod5.z.string().url().optional()
});
var idParamSchema = import_zod5.z.object({
  id: import_zod5.z.string().uuid("Invalid id format")
});

// src/modules/companies/companies.routes.ts
var router3 = (0, import_express3.Router)();
router3.get("/me", authenticate, authorize("COMPANY"), getMyProfile);
router3.patch(
  "/me",
  authenticate,
  authorize("COMPANY"),
  validate({ body: updateCompanySchema }),
  updateMyProfile
);
router3.get("/:id", validate({ params: idParamSchema }), getPublicProfile);
var companies_routes_default = router3;

// src/modules/candidates/candidates.routes.ts
var import_express4 = require("express");

// src/modules/candidates/candidates.service.ts
async function updateMyCandidateProfile(userId, data) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound("Candidate profile not found");
  return prisma.candidateProfile.update({ where: { userId }, data });
}
async function getCandidateProfileById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      role: true,
      candidateProfile: true
    }
  });
  if (!user || user.role !== "CANDIDATE" || !user.candidateProfile) {
    throw ApiError.notFound("Candidate not found");
  }
  return user;
}

// src/modules/candidates/candidates.controller.ts
var updateMyProfile2 = catchAsync(async (req, res) => {
  const profile = await updateMyCandidateProfile(req.user.id, req.body);
  sendSuccess(res, profile, "Candidate profile updated successfully");
});
var getById = catchAsync(async (req, res) => {
  const profile = await getCandidateProfileById(req.params.id);
  sendSuccess(res, profile, "Candidate profile fetched successfully");
});

// src/modules/candidates/candidates.validation.ts
var import_zod6 = require("zod");
var updateCandidateSchema = import_zod6.z.object({
  headline: import_zod6.z.string().trim().max(150).optional(),
  bio: import_zod6.z.string().trim().max(2e3).optional(),
  skills: import_zod6.z.array(import_zod6.z.string().trim().min(1).max(40)).max(50).optional(),
  experienceYears: import_zod6.z.number().int().min(0).max(60).optional(),
  resumeUrl: import_zod6.z.string().url().optional(),
  githubUrl: import_zod6.z.string().url().optional(),
  portfolioUrl: import_zod6.z.string().url().optional()
});
var idParamSchema2 = import_zod6.z.object({
  id: import_zod6.z.string().uuid("Invalid id format")
});

// src/modules/candidates/candidates.routes.ts
var router4 = (0, import_express4.Router)();
router4.patch(
  "/me",
  authenticate,
  authorize("CANDIDATE"),
  validate({ body: updateCandidateSchema }),
  updateMyProfile2
);
router4.get(
  "/:id",
  authenticate,
  authorize("COMPANY", "ADMIN"),
  validate({ params: idParamSchema2 }),
  getById
);
var candidates_routes_default = router4;

// src/modules/problems/problems.routes.ts
var import_express5 = require("express");

// src/lib/pagination.ts
function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const rawLimit = Number.parseInt(String(query.limit ?? "10"), 10) || 10;
  const limit = Math.min(100, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

// src/utils/resolveCompany.ts
async function resolveCompanyId(userId) {
  const profile = await prisma.companyProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw ApiError.notFound("Company profile not found for this account");
  return profile.id;
}

// src/modules/problems/problems.service.ts
var CACHE_PREFIX = "problems:list:";
async function createProblem(userId, input) {
  const companyId = await resolveCompanyId(userId);
  const problem = await prisma.problem.create({
    data: {
      ...input,
      companyId,
      createdById: userId
    }
  });
  await cacheDelByPrefix(CACHE_PREFIX);
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PROBLEM_CREATED",
    entity: "Problem",
    entityId: problem.id,
    newState: { title: problem.title, type: problem.type }
  });
  return problem;
}
async function listCompanyProblems(userId, query) {
  const companyId = await resolveCompanyId(userId);
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    companyId,
    deletedAt: null,
    ...query.type ? { type: query.type } : {},
    ...query.difficulty ? { difficulty: query.difficulty } : {},
    ...query.q ? {
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
        { tags: { has: query.q } }
      ]
    } : {}
  };
  const orderBy = {
    [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc"
  };
  const [items, total] = await Promise.all([
    prisma.problem.findMany({ where, orderBy, skip, take }),
    prisma.problem.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function getProblemById(userId, id) {
  const companyId = await resolveCompanyId(userId);
  const problem = await prisma.problem.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!problem) throw ApiError.notFound("Problem not found");
  return problem;
}
async function updateProblem(userId, id, input) {
  const companyId = await resolveCompanyId(userId);
  const existing = await prisma.problem.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Problem not found");
  const updated = await prisma.problem.update({ where: { id }, data: input });
  await cacheDelByPrefix(CACHE_PREFIX);
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PROBLEM_UPDATED",
    entity: "Problem",
    entityId: id,
    previousState: { title: existing.title },
    newState: { title: updated.title }
  });
  return updated;
}
async function softDeleteProblem(userId, id) {
  const companyId = await resolveCompanyId(userId);
  const existing = await prisma.problem.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Problem not found");
  const inUse = await prisma.assessmentProblem.findFirst({
    where: { problemId: id, assessment: { status: "PUBLISHED", deletedAt: null } }
  });
  if (inUse) {
    throw ApiError.conflict("Cannot delete a problem that is attached to a published assessment");
  }
  await prisma.problem.update({ where: { id }, data: { deletedAt: /* @__PURE__ */ new Date() } });
  await cacheDelByPrefix(CACHE_PREFIX);
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PROBLEM_DELETED",
    entity: "Problem",
    entityId: id,
    previousState: { title: existing.title }
  });
}

// src/modules/problems/problems.controller.ts
var create = catchAsync(async (req, res) => {
  const problem = await createProblem(req.user.id, req.body);
  sendSuccess(res, problem, "Problem created successfully", 201);
});
var list = catchAsync(async (req, res) => {
  const { items, meta } = await listCompanyProblems(req.user.id, req.query);
  sendSuccess(res, items, "Problems fetched successfully", 200, meta);
});
var getById2 = catchAsync(async (req, res) => {
  const problem = await getProblemById(req.user.id, req.params.id);
  sendSuccess(res, problem, "Problem fetched successfully");
});
var update = catchAsync(async (req, res) => {
  const problem = await updateProblem(req.user.id, req.params.id, req.body);
  sendSuccess(res, problem, "Problem updated successfully");
});
var remove = catchAsync(async (req, res) => {
  await softDeleteProblem(req.user.id, req.params.id);
  sendSuccess(res, null, "Problem deleted successfully");
});

// src/modules/problems/problems.validation.ts
var import_zod7 = require("zod");
var mcqOptionSchema = import_zod7.z.object({
  id: import_zod7.z.string().min(1).max(10),
  text: import_zod7.z.string().min(1).max(500)
});
var testCaseSchema = import_zod7.z.object({
  input: import_zod7.z.string(),
  expectedOutput: import_zod7.z.string()
});
var createProblemSchema = import_zod7.z.object({
  title: import_zod7.z.string().trim().min(3).max(200),
  description: import_zod7.z.string().trim().min(10).max(1e4),
  type: import_zod7.z.enum(["MCQ", "CODING", "WRITTEN"]),
  difficulty: import_zod7.z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  points: import_zod7.z.number().int().min(1).max(1e3).default(10),
  tags: import_zod7.z.array(import_zod7.z.string().trim().min(1).max(30)).max(20).default([]),
  options: import_zod7.z.array(mcqOptionSchema).min(2).max(10).optional(),
  correctOption: import_zod7.z.string().min(1).max(10).optional(),
  starterCode: import_zod7.z.string().max(2e4).optional(),
  language: import_zod7.z.string().trim().max(30).optional(),
  testCases: import_zod7.z.array(testCaseSchema).max(50).optional()
}).superRefine((data, ctx) => {
  if (data.type === "MCQ") {
    if (!data.options || data.options.length < 2) {
      ctx.addIssue({ code: import_zod7.z.ZodIssueCode.custom, path: ["options"], message: "MCQ problems require at least 2 options" });
    }
    if (!data.correctOption) {
      ctx.addIssue({ code: import_zod7.z.ZodIssueCode.custom, path: ["correctOption"], message: "correctOption is required for MCQ problems" });
    } else if (data.options && !data.options.some((o) => o.id === data.correctOption)) {
      ctx.addIssue({ code: import_zod7.z.ZodIssueCode.custom, path: ["correctOption"], message: "correctOption must match one of the provided option ids" });
    }
  }
  if (data.type === "CODING" && (!data.testCases || data.testCases.length === 0)) {
    ctx.addIssue({ code: import_zod7.z.ZodIssueCode.custom, path: ["testCases"], message: "CODING problems require at least 1 test case" });
  }
});
var updateProblemSchema = import_zod7.z.object({
  title: import_zod7.z.string().trim().min(3).max(200).optional(),
  description: import_zod7.z.string().trim().min(10).max(1e4).optional(),
  difficulty: import_zod7.z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  points: import_zod7.z.number().int().min(1).max(1e3).optional(),
  tags: import_zod7.z.array(import_zod7.z.string().trim().min(1).max(30)).max(20).optional(),
  options: import_zod7.z.array(mcqOptionSchema).min(2).max(10).optional(),
  correctOption: import_zod7.z.string().min(1).max(10).optional(),
  starterCode: import_zod7.z.string().max(2e4).optional(),
  language: import_zod7.z.string().trim().max(30).optional(),
  testCases: import_zod7.z.array(testCaseSchema).max(50).optional()
});
var listProblemsQuerySchema = import_zod7.z.object({
  page: import_zod7.z.coerce.number().int().min(1).optional(),
  limit: import_zod7.z.coerce.number().int().min(1).max(100).optional(),
  type: import_zod7.z.enum(["MCQ", "CODING", "WRITTEN"]).optional(),
  difficulty: import_zod7.z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  q: import_zod7.z.string().trim().max(200).optional(),
  sortBy: import_zod7.z.enum(["createdAt", "points", "title"]).optional(),
  sortOrder: import_zod7.z.enum(["asc", "desc"]).optional()
});
var idParamSchema3 = import_zod7.z.object({
  id: import_zod7.z.string().uuid("Invalid id format")
});

// src/modules/problems/problems.routes.ts
var router5 = (0, import_express5.Router)();
router5.use(authenticate, authorize("COMPANY"));
router5.post("/", validate({ body: createProblemSchema }), create);
router5.get("/", validate({ query: listProblemsQuerySchema }), list);
router5.get("/:id", validate({ params: idParamSchema3 }), getById2);
router5.patch("/:id", validate({ params: idParamSchema3, body: updateProblemSchema }), update);
router5.delete("/:id", validate({ params: idParamSchema3 }), remove);
var problems_routes_default = router5;

// src/modules/assessments/assessments.routes.ts
var import_express8 = require("express");

// src/modules/assessments/assessments.service.ts
var LIST_CACHE_PREFIX = "assessments:list:";
async function createAssessment(userId, input) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.create({
    data: { ...input, companyId, createdById: userId }
  });
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_CREATED",
    entity: "Assessment",
    entityId: assessment.id,
    newState: { title: assessment.title, status: assessment.status }
  });
  return assessment;
}
async function listMyAssessments(userId, query) {
  const companyId = await resolveCompanyId(userId);
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    companyId,
    deletedAt: null,
    ...query.status ? { status: query.status } : {},
    ...query.q ? {
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } }
      ]
    } : {}
  };
  const orderBy = {
    [query.sortBy ?? "createdAt"]: query.sortOrder ?? "desc"
  };
  const [items, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { _count: { select: { problems: true, invitations: true, attempts: true } } }
    }),
    prisma.assessment.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function findOwnedAssessment(userId, id, role) {
  if (role === "ADMIN") {
    const assessment2 = await prisma.assessment.findFirst({
      where: { id, deletedAt: null },
      include: { problems: { include: { problem: true }, orderBy: { order: "asc" } }, company: true }
    });
    if (!assessment2) throw ApiError.notFound("Assessment not found");
    return assessment2;
  }
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { problems: { include: { problem: true }, orderBy: { order: "asc" } }, company: true }
  });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  return assessment;
}
async function getAssessmentById(userId, id, role) {
  return findOwnedAssessment(userId, id, role);
}
async function updateAssessment(userId, id, input) {
  const companyId = await resolveCompanyId(userId);
  const existing = await prisma.assessment.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Assessment not found");
  if (existing.status !== "DRAFT") {
    throw ApiError.conflict("Only assessments in DRAFT status can be edited. Archive and duplicate instead.");
  }
  const updated = await prisma.assessment.update({ where: { id }, data: input });
  await cacheDelByPrefix(LIST_CACHE_PREFIX);
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_UPDATED",
    entity: "Assessment",
    entityId: id,
    previousState: { title: existing.title },
    newState: { title: updated.title }
  });
  return updated;
}
async function softDeleteAssessment(userId, id) {
  const companyId = await resolveCompanyId(userId);
  const existing = await prisma.assessment.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw ApiError.notFound("Assessment not found");
  const attemptCount = await prisma.attempt.count({ where: { assessmentId: id } });
  if (attemptCount > 0 && existing.status === "PUBLISHED") {
    throw ApiError.conflict("Cannot delete a published assessment that already has candidate attempts. Archive it instead.");
  }
  await prisma.assessment.update({ where: { id }, data: { deletedAt: /* @__PURE__ */ new Date(), status: "ARCHIVED" } });
  await cacheDelByPrefix(LIST_CACHE_PREFIX);
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_DELETED",
    entity: "Assessment",
    entityId: id,
    previousState: { title: existing.title }
  });
}
async function attachProblem(userId, assessmentId, input) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  if (assessment.status !== "DRAFT") {
    throw ApiError.conflict("Problems can only be attached while the assessment is in DRAFT status");
  }
  const problem = await prisma.problem.findFirst({ where: { id: input.problemId, companyId, deletedAt: null } });
  if (!problem) throw ApiError.notFound("Problem not found in your problem bank");
  const existingLink = await prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId: input.problemId } }
  });
  if (existingLink) throw ApiError.conflict("This problem is already attached to the assessment");
  const link = await prisma.assessmentProblem.create({
    data: {
      assessmentId,
      problemId: input.problemId,
      order: input.order ?? 0,
      pointsOverride: input.pointsOverride
    },
    include: { problem: true }
  });
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_PROBLEM_ATTACHED",
    entity: "Assessment",
    entityId: assessmentId,
    newState: { problemId: input.problemId }
  });
  return link;
}
async function detachProblem(userId, assessmentId, problemId) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  if (assessment.status !== "DRAFT") {
    throw ApiError.conflict("Problems can only be removed while the assessment is in DRAFT status");
  }
  const link = await prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId } }
  });
  if (!link) throw ApiError.notFound("This problem is not attached to the assessment");
  await prisma.assessmentProblem.delete({ where: { id: link.id } });
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "ASSESSMENT_PROBLEM_DETACHED",
    entity: "Assessment",
    entityId: assessmentId,
    previousState: { problemId }
  });
}
async function publishAssessment(userId, id) {
  const companyId = await resolveCompanyId(userId);
  const release = await acquireLock(`lock:publish:${companyId}`, 8e3);
  if (release === null) {
    throw ApiError.tooManyRequests("Another publish operation is already in progress for your account. Try again shortly.");
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.findFirst({
        where: { id, companyId, deletedAt: null },
        include: { problems: true }
      });
      if (!assessment) throw ApiError.notFound("Assessment not found");
      if (assessment.status !== "DRAFT") {
        throw ApiError.conflict("Only DRAFT assessments can be published");
      }
      if (assessment.problems.length === 0) {
        throw ApiError.badRequest("Attach at least one problem before publishing");
      }
      const decremented = await tx.companyProfile.updateMany({
        where: { id: companyId, assessmentCredits: { gt: 0 } },
        data: { assessmentCredits: { decrement: 1 } }
      });
      if (decremented.count === 0) {
        throw ApiError.forbidden(
          "No assessment credits remaining. Purchase credits via POST /api/v1/payments/initiate before publishing."
        );
      }
      const published = await tx.assessment.update({ where: { id }, data: { status: "PUBLISHED" } });
      await writeAuditLog(tx, {
        actorId: userId,
        action: "ASSESSMENT_PUBLISHED",
        entity: "Assessment",
        entityId: id,
        previousState: { status: "DRAFT" },
        newState: { status: "PUBLISHED" },
        metadata: { creditsSpent: 1 }
      });
      return published;
    });
  } finally {
    await release();
    await cacheDelByPrefix(LIST_CACHE_PREFIX);
  }
}

// src/modules/assessments/assessments.controller.ts
var create2 = catchAsync(async (req, res) => {
  const assessment = await createAssessment(req.user.id, req.body);
  sendSuccess(res, assessment, "Assessment created successfully", 201);
});
var list2 = catchAsync(async (req, res) => {
  const { items, meta } = await listMyAssessments(req.user.id, req.query);
  sendSuccess(res, items, "Assessments fetched successfully", 200, meta);
});
var getById3 = catchAsync(async (req, res) => {
  const role = req.user.role === "ADMIN" ? "ADMIN" : "COMPANY";
  const assessment = await getAssessmentById(req.user.id, req.params.id, role);
  sendSuccess(res, assessment, "Assessment fetched successfully");
});
var update2 = catchAsync(async (req, res) => {
  const assessment = await updateAssessment(req.user.id, req.params.id, req.body);
  sendSuccess(res, assessment, "Assessment updated successfully");
});
var remove2 = catchAsync(async (req, res) => {
  await softDeleteAssessment(req.user.id, req.params.id);
  sendSuccess(res, null, "Assessment deleted successfully");
});
var attachProblem2 = catchAsync(async (req, res) => {
  const link = await attachProblem(req.user.id, req.params.id, req.body);
  sendSuccess(res, link, "Problem attached to assessment successfully", 201);
});
var detachProblem2 = catchAsync(async (req, res) => {
  await detachProblem(req.user.id, req.params.id, req.params.problemId);
  sendSuccess(res, null, "Problem removed from assessment successfully");
});
var publish = catchAsync(async (req, res) => {
  const assessment = await publishAssessment(req.user.id, req.params.id);
  sendSuccess(res, assessment, "Assessment published successfully");
});

// src/modules/assessments/assessments.validation.ts
var import_zod8 = require("zod");
var createAssessmentSchema = import_zod8.z.object({
  title: import_zod8.z.string().trim().min(3).max(200),
  description: import_zod8.z.string().trim().min(10).max(5e3),
  durationMinutes: import_zod8.z.number().int().min(5).max(600).default(60),
  passingScore: import_zod8.z.number().int().min(0).max(100).default(60)
});
var updateAssessmentSchema = import_zod8.z.object({
  title: import_zod8.z.string().trim().min(3).max(200).optional(),
  description: import_zod8.z.string().trim().min(10).max(5e3).optional(),
  durationMinutes: import_zod8.z.number().int().min(5).max(600).optional(),
  passingScore: import_zod8.z.number().int().min(0).max(100).optional()
});
var attachProblemSchema = import_zod8.z.object({
  problemId: import_zod8.z.string().uuid("Invalid problemId"),
  order: import_zod8.z.number().int().min(0).optional(),
  pointsOverride: import_zod8.z.number().int().min(1).max(1e3).optional()
});
var listAssessmentsQuerySchema = import_zod8.z.object({
  page: import_zod8.z.coerce.number().int().min(1).optional(),
  limit: import_zod8.z.coerce.number().int().min(1).max(100).optional(),
  status: import_zod8.z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  q: import_zod8.z.string().trim().max(200).optional(),
  sortBy: import_zod8.z.enum(["createdAt", "title", "durationMinutes"]).optional(),
  sortOrder: import_zod8.z.enum(["asc", "desc"]).optional()
});
var idParamSchema4 = import_zod8.z.object({
  id: import_zod8.z.string().uuid("Invalid id format")
});
var assessmentProblemParamSchema = import_zod8.z.object({
  id: import_zod8.z.string().uuid("Invalid id format"),
  problemId: import_zod8.z.string().uuid("Invalid problemId format")
});

// src/modules/invitations/invitations.routes.ts
var import_express6 = require("express");

// src/modules/invitations/invitations.service.ts
async function createInvitation(userId, assessmentId, input) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  if (assessment.status !== "PUBLISHED") {
    throw ApiError.conflict("Only PUBLISHED assessments can be used to invite candidates");
  }
  const candidate = await prisma.user.findUnique({ where: { email: input.candidateEmail } });
  if (!candidate || candidate.deletedAt) {
    throw ApiError.notFound("No candidate account exists with this email. Ask them to register first.");
  }
  if (candidate.role !== "CANDIDATE") {
    throw ApiError.badRequest("This email does not belong to a candidate account");
  }
  const existing = await prisma.invitation.findUnique({
    where: { assessmentId_candidateId: { assessmentId, candidateId: candidate.id } }
  });
  if (existing) throw ApiError.conflict("This candidate has already been invited to this assessment");
  const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1e3);
  const invitation = await prisma.invitation.create({
    data: {
      assessmentId,
      candidateId: candidate.id,
      invitedById: userId,
      expiresAt
    }
  });
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "INVITATION_CREATED",
    entity: "Invitation",
    entityId: invitation.id,
    newState: { assessmentId, candidateId: candidate.id }
  });
  return invitation;
}
async function listAssessmentInvitations(userId, assessmentId, query) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    assessmentId,
    ...query.status ? { status: query.status } : {}
  };
  const [items, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { candidate: { select: { id: true, name: true, email: true } } }
    }),
    prisma.invitation.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function listMyInvitations(candidateId, query) {
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    candidateId,
    ...query.status ? { status: query.status } : {}
  };
  const [items, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: { id: true, title: true, durationMinutes: true, passingScore: true, company: { select: { companyName: true } } }
        }
      }
    }),
    prisma.invitation.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function acceptInvitation(candidateId, invitationId) {
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { id: invitationId },
      include: { assessment: true }
    });
    if (!invitation || invitation.candidateId !== candidateId) {
      throw ApiError.notFound("Invitation not found");
    }
    if (invitation.status !== "PENDING") {
      throw ApiError.conflict(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }
    if (invitation.expiresAt < /* @__PURE__ */ new Date()) {
      await tx.invitation.update({ where: { id: invitationId }, data: { status: "EXPIRED" } });
      throw ApiError.conflict("This invitation has expired");
    }
    if (invitation.assessment.status !== "PUBLISHED" || invitation.assessment.deletedAt) {
      throw ApiError.conflict("This assessment is no longer available");
    }
    const deadlineAt = new Date(Date.now() + invitation.assessment.durationMinutes * 60 * 1e3);
    const attempt = await tx.attempt.create({
      data: {
        assessmentId: invitation.assessmentId,
        candidateId,
        invitationId,
        deadlineAt
      }
    });
    await tx.invitation.update({ where: { id: invitationId }, data: { status: "ACCEPTED" } });
    await writeAuditLog(tx, {
      actorId: candidateId,
      action: "INVITATION_ACCEPTED",
      entity: "Invitation",
      entityId: invitationId,
      newState: { attemptId: attempt.id }
    });
    return attempt;
  });
}
async function declineInvitation(candidateId, invitationId) {
  const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.candidateId !== candidateId) {
    throw ApiError.notFound("Invitation not found");
  }
  if (invitation.status !== "PENDING") {
    throw ApiError.conflict(`Invitation has already been ${invitation.status.toLowerCase()}`);
  }
  const updated = await prisma.invitation.update({ where: { id: invitationId }, data: { status: "DECLINED" } });
  await writeAuditLog(prisma, {
    actorId: candidateId,
    action: "INVITATION_DECLINED",
    entity: "Invitation",
    entityId: invitationId
  });
  return updated;
}

// src/modules/invitations/invitations.controller.ts
var create3 = catchAsync(async (req, res) => {
  const invitation = await createInvitation(req.user.id, req.params.assessmentId, req.body);
  sendSuccess(res, invitation, "Candidate invited successfully", 201);
});
var listForAssessment = catchAsync(async (req, res) => {
  const { items, meta } = await listAssessmentInvitations(
    req.user.id,
    req.params.assessmentId,
    req.query
  );
  sendSuccess(res, items, "Invitations fetched successfully", 200, meta);
});
var listMine = catchAsync(async (req, res) => {
  const { items, meta } = await listMyInvitations(req.user.id, req.query);
  sendSuccess(res, items, "Your invitations fetched successfully", 200, meta);
});
var accept = catchAsync(async (req, res) => {
  const attempt = await acceptInvitation(req.user.id, req.params.id);
  sendSuccess(res, attempt, "Invitation accepted. Your attempt has started.", 201);
});
var decline = catchAsync(async (req, res) => {
  const invitation = await declineInvitation(req.user.id, req.params.id);
  sendSuccess(res, invitation, "Invitation declined");
});

// src/modules/invitations/invitations.validation.ts
var import_zod9 = require("zod");
var createInvitationSchema = import_zod9.z.object({
  candidateEmail: import_zod9.z.string().trim().toLowerCase().email("Invalid candidate email"),
  expiresInDays: import_zod9.z.number().int().min(1).max(90).default(14)
});
var listInvitationsQuerySchema = import_zod9.z.object({
  page: import_zod9.z.coerce.number().int().min(1).optional(),
  limit: import_zod9.z.coerce.number().int().min(1).max(100).optional(),
  status: import_zod9.z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "COMPLETED"]).optional()
});
var assessmentIdParamSchema = import_zod9.z.object({
  assessmentId: import_zod9.z.string().uuid("Invalid assessmentId format")
});
var idParamSchema5 = import_zod9.z.object({
  id: import_zod9.z.string().uuid("Invalid id format")
});

// src/modules/invitations/invitations.routes.ts
var router6 = (0, import_express6.Router)({ mergeParams: true });
router6.post("/", authorize("COMPANY"), validate({ body: createInvitationSchema }), create3);
router6.get(
  "/",
  authorize("COMPANY"),
  validate({ query: listInvitationsQuerySchema }),
  listForAssessment
);
var invitations_routes_default = router6;

// src/modules/attempts/attempts.routes.ts
var import_express7 = require("express");

// src/modules/attempts/attempts.service.ts
async function expireIfPastDeadline(attempt) {
  if (attempt.status === "IN_PROGRESS" && attempt.deadlineAt < /* @__PURE__ */ new Date()) {
    await prisma.attempt.update({ where: { id: attempt.id }, data: { status: "EXPIRED" } });
    return true;
  }
  return false;
}
async function assertCandidateOwnsAttempt(candidateId, attemptId) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { assessment: { include: { problems: true } }, submissions: true }
  });
  if (!attempt || attempt.candidateId !== candidateId) {
    throw ApiError.notFound("Attempt not found");
  }
  return attempt;
}
async function getAttemptById(userId, role, id) {
  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      assessment: true,
      submissions: true
    }
  });
  if (!attempt) throw ApiError.notFound("Attempt not found");
  if (role === "CANDIDATE" && attempt.candidateId !== userId) {
    throw ApiError.forbidden("You do not have access to this attempt");
  }
  if (role === "COMPANY") {
    const companyId = await resolveCompanyId(userId);
    if (attempt.assessment.companyId !== companyId) {
      throw ApiError.forbidden("You do not have access to this attempt");
    }
  }
  await expireIfPastDeadline(attempt);
  if (role === "CANDIDATE") {
    return { ...attempt, submissions: attempt.submissions.map(({ score, feedback, ...rest }) => rest) };
  }
  return attempt;
}
async function listMyAttempts(candidateId, query) {
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    candidateId,
    ...query.status ? { status: query.status } : {}
  };
  const [items, total] = await Promise.all([
    prisma.attempt.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { assessment: { select: { id: true, title: true, passingScore: true } } }
    }),
    prisma.attempt.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function listAssessmentAttempts(userId, assessmentId, query) {
  const companyId = await resolveCompanyId(userId);
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, companyId, deletedAt: null } });
  if (!assessment) throw ApiError.notFound("Assessment not found");
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    assessmentId,
    ...query.status ? { status: query.status } : {}
  };
  const [items, total] = await Promise.all([
    prisma.attempt.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { candidate: { select: { id: true, name: true, email: true } } }
    }),
    prisma.attempt.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function submitAnswer(candidateId, attemptId, input) {
  const attempt = await assertCandidateOwnsAttempt(candidateId, attemptId);
  const expired = await expireIfPastDeadline(attempt);
  if (expired || attempt.status !== "IN_PROGRESS") {
    throw ApiError.conflict("This attempt is no longer in progress");
  }
  const linked = attempt.assessment.problems.find((p) => p.problemId === input.problemId);
  if (!linked) {
    throw ApiError.badRequest("This problem is not part of the assessment for this attempt");
  }
  const submission = await prisma.submission.upsert({
    where: { attemptId_problemId: { attemptId, problemId: input.problemId } },
    update: {
      selectedOption: input.selectedOption,
      answerText: input.answerText,
      code: input.code,
      language: input.language
    },
    create: {
      attemptId,
      problemId: input.problemId,
      selectedOption: input.selectedOption,
      answerText: input.answerText,
      code: input.code,
      language: input.language
    }
  });
  return submission;
}
async function finalizeAttempt(candidateId, attemptId) {
  const release = await acquireLock(`lock:submit-attempt:${attemptId}`, 1e4);
  if (release === null) {
    throw ApiError.conflict("This attempt is already being submitted");
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const attempt = await tx.attempt.findUnique({
        where: { id: attemptId },
        include: {
          assessment: { include: { problems: { include: { problem: true } } } },
          submissions: true,
          invitation: true
        }
      });
      if (!attempt || attempt.candidateId !== candidateId) {
        throw ApiError.notFound("Attempt not found");
      }
      if (attempt.status !== "IN_PROGRESS") {
        throw ApiError.conflict("This attempt has already been submitted");
      }
      let totalScore = 0;
      let maxScore = 0;
      let hasPending = false;
      for (const link of attempt.assessment.problems) {
        const points = link.pointsOverride ?? link.problem.points;
        maxScore += points;
        const submission = attempt.submissions.find((s) => s.problemId === link.problemId);
        if (link.problem.type === "MCQ") {
          const isCorrect = !!submission?.selectedOption && submission.selectedOption === link.problem.correctOption;
          const score = isCorrect ? points : 0;
          totalScore += score;
          if (submission) {
            await tx.submission.update({
              where: { id: submission.id },
              data: { status: "AUTO_EVALUATED", score }
            });
          } else {
            await tx.submission.create({
              data: {
                attemptId,
                problemId: link.problemId,
                status: "AUTO_EVALUATED",
                score: 0
              }
            });
          }
        } else {
          if (!submission) {
            await tx.submission.create({
              data: { attemptId, problemId: link.problemId, status: "PENDING", score: 0 }
            });
          }
          hasPending = true;
        }
      }
      const newStatus = hasPending ? "SUBMITTED" : "EVALUATED";
      const passed = hasPending ? null : totalScore / Math.max(maxScore, 1) * 100 >= attempt.assessment.passingScore;
      const updated = await tx.attempt.update({
        where: { id: attemptId },
        data: {
          status: newStatus,
          submittedAt: /* @__PURE__ */ new Date(),
          totalScore: hasPending ? null : totalScore,
          maxScore,
          passed
        }
      });
      if (!hasPending) {
        await tx.invitation.update({ where: { id: attempt.invitationId }, data: { status: "COMPLETED" } });
      }
      await writeAuditLog(tx, {
        actorId: candidateId,
        action: "ATTEMPT_SUBMITTED",
        entity: "Attempt",
        entityId: attemptId,
        newState: { status: newStatus, totalScore: hasPending ? null : totalScore, maxScore }
      });
      return updated;
    });
  } finally {
    await release();
  }
}
async function getAttemptReport(userId, role, attemptId) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { select: { id: true, title: true, passingScore: true, companyId: true } },
      submissions: { include: { problem: { select: { id: true, title: true, type: true, points: true } } } }
    }
  });
  if (!attempt) throw ApiError.notFound("Attempt not found");
  if (role === "CANDIDATE" && attempt.candidateId !== userId) {
    throw ApiError.forbidden("You do not have access to this report");
  }
  if (role === "COMPANY") {
    const companyId = await resolveCompanyId(userId);
    if (attempt.assessment.companyId !== companyId) {
      throw ApiError.forbidden("You do not have access to this report");
    }
  }
  if (attempt.status !== "EVALUATED" && attempt.status !== "SUBMITTED") {
    throw ApiError.conflict("This attempt has not been submitted yet");
  }
  return {
    attemptId: attempt.id,
    assessment: attempt.assessment,
    status: attempt.status,
    totalScore: attempt.totalScore,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    breakdown: attempt.submissions.map((s) => ({
      problemId: s.problemId,
      problemTitle: s.problem.title,
      type: s.problem.type,
      status: s.status,
      score: s.score,
      maxPoints: s.problem.points,
      feedback: s.feedback
    }))
  };
}

// src/modules/attempts/attempts.controller.ts
var getById4 = catchAsync(async (req, res) => {
  const role = req.user.role;
  const attempt = await getAttemptById(req.user.id, role, req.params.id);
  sendSuccess(res, attempt, "Attempt fetched successfully");
});
var listMine2 = catchAsync(async (req, res) => {
  const { items, meta } = await listMyAttempts(req.user.id, req.query);
  sendSuccess(res, items, "Your attempts fetched successfully", 200, meta);
});
var listForAssessment2 = catchAsync(async (req, res) => {
  const { items, meta } = await listAssessmentAttempts(
    req.user.id,
    req.params.assessmentId,
    req.query
  );
  sendSuccess(res, items, "Attempts fetched successfully", 200, meta);
});
var submitAnswer2 = catchAsync(async (req, res) => {
  const submission = await submitAnswer(req.user.id, req.params.id, req.body);
  sendSuccess(res, submission, "Answer saved successfully");
});
var finalize = catchAsync(async (req, res) => {
  const attempt = await finalizeAttempt(req.user.id, req.params.id);
  sendSuccess(res, attempt, "Attempt submitted successfully");
});
var report = catchAsync(async (req, res) => {
  const role = req.user.role;
  const data = await getAttemptReport(req.user.id, role, req.params.id);
  sendSuccess(res, data, "Attempt report fetched successfully");
});

// src/modules/attempts/attempts.validation.ts
var import_zod10 = require("zod");
var submitAnswerSchema = import_zod10.z.object({
  problemId: import_zod10.z.string().uuid("Invalid problemId"),
  selectedOption: import_zod10.z.string().min(1).max(10).optional(),
  answerText: import_zod10.z.string().max(2e4).optional(),
  code: import_zod10.z.string().max(5e4).optional(),
  language: import_zod10.z.string().trim().max(30).optional()
}).refine((d) => d.selectedOption || d.answerText || d.code, {
  message: "Provide at least one of selectedOption, answerText, or code"
});
var listAttemptsQuerySchema = import_zod10.z.object({
  page: import_zod10.z.coerce.number().int().min(1).optional(),
  limit: import_zod10.z.coerce.number().int().min(1).max(100).optional(),
  status: import_zod10.z.enum(["IN_PROGRESS", "SUBMITTED", "EVALUATED", "EXPIRED"]).optional()
});
var idParamSchema6 = import_zod10.z.object({
  id: import_zod10.z.string().uuid("Invalid id format")
});
var assessmentIdParamSchema2 = import_zod10.z.object({
  assessmentId: import_zod10.z.string().uuid("Invalid assessmentId format")
});

// src/modules/attempts/attempts.routes.ts
var router7 = (0, import_express7.Router)({ mergeParams: true });
router7.get(
  "/",
  authorize("COMPANY"),
  validate({ query: listAttemptsQuerySchema }),
  listForAssessment2
);
var attempts_routes_default = router7;

// src/modules/assessments/assessments.routes.ts
var router8 = (0, import_express8.Router)();
router8.use(authenticate);
router8.post("/", authorize("COMPANY"), validate({ body: createAssessmentSchema }), create2);
router8.get("/", authorize("COMPANY"), validate({ query: listAssessmentsQuerySchema }), list2);
router8.get(
  "/:id",
  authorize("COMPANY", "ADMIN"),
  validate({ params: idParamSchema4 }),
  getById3
);
router8.patch(
  "/:id",
  authorize("COMPANY"),
  validate({ params: idParamSchema4, body: updateAssessmentSchema }),
  update2
);
router8.delete("/:id", authorize("COMPANY"), validate({ params: idParamSchema4 }), remove2);
router8.post(
  "/:id/problems",
  authorize("COMPANY"),
  validate({ params: idParamSchema4, body: attachProblemSchema }),
  attachProblem2
);
router8.delete(
  "/:id/problems/:problemId",
  authorize("COMPANY"),
  validate({ params: assessmentProblemParamSchema }),
  detachProblem2
);
router8.patch(
  "/:id/publish",
  authorize("COMPANY"),
  validate({ params: idParamSchema4 }),
  publish
);
router8.use("/:assessmentId/invitations", invitations_routes_default);
router8.use("/:assessmentId/attempts", attempts_routes_default);
var assessments_routes_default = router8;

// src/modules/invitations/invitations.me.routes.ts
var import_express9 = require("express");
var router9 = (0, import_express9.Router)();
router9.use(authenticate, authorize("CANDIDATE"));
router9.get("/me", validate({ query: listInvitationsQuerySchema }), listMine);
router9.post("/:id/accept", validate({ params: idParamSchema5 }), accept);
router9.post("/:id/decline", validate({ params: idParamSchema5 }), decline);
var invitations_me_routes_default = router9;

// src/modules/attempts/attempts.top.routes.ts
var import_express10 = require("express");
var router10 = (0, import_express10.Router)();
router10.use(authenticate);
router10.get(
  "/me",
  authorize("CANDIDATE"),
  validate({ query: listAttemptsQuerySchema }),
  listMine2
);
router10.get(
  "/:id",
  authorize("CANDIDATE", "COMPANY", "ADMIN"),
  validate({ params: idParamSchema6 }),
  getById4
);
router10.get(
  "/:id/report",
  authorize("CANDIDATE", "COMPANY", "ADMIN"),
  validate({ params: idParamSchema6 }),
  report
);
router10.post(
  "/:id/answers",
  authorize("CANDIDATE"),
  validate({ params: idParamSchema6, body: submitAnswerSchema }),
  submitAnswer2
);
router10.post(
  "/:id/submit",
  authorize("CANDIDATE"),
  validate({ params: idParamSchema6 }),
  finalize
);
var attempts_top_routes_default = router10;

// src/modules/submissions/submissions.routes.ts
var import_express11 = require("express");

// src/modules/submissions/submissions.service.ts
async function findSubmissionForCompany(userId, id) {
  const companyId = await resolveCompanyId(userId);
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      problem: true,
      attempt: { include: { assessment: true } }
    }
  });
  if (!submission || submission.attempt.assessment.companyId !== companyId) {
    throw ApiError.notFound("Submission not found");
  }
  return submission;
}
async function getSubmissionById(userId, id) {
  return findSubmissionForCompany(userId, id);
}
async function evaluateSubmission(evaluatorId, id, input) {
  const submission = await findSubmissionForCompany(evaluatorId, id);
  if (submission.problem.type === "MCQ") {
    throw ApiError.badRequest("MCQ submissions are auto-evaluated and cannot be manually scored");
  }
  const maxPoints = submission.problem.points;
  if (input.score > maxPoints) {
    throw ApiError.badRequest(`Score cannot exceed the problem's maximum of ${maxPoints} points`);
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id },
      data: {
        score: input.score,
        feedback: input.feedback,
        status: "MANUALLY_EVALUATED",
        evaluatedById: evaluatorId,
        evaluatedAt: /* @__PURE__ */ new Date()
      }
    });
    await writeAuditLog(tx, {
      actorId: evaluatorId,
      action: "SUBMISSION_EVALUATED",
      entity: "Submission",
      entityId: id,
      newState: { score: input.score }
    });
    const remainingPending = await tx.submission.count({
      where: { attemptId: submission.attemptId, status: "PENDING" }
    });
    if (remainingPending === 0) {
      const allSubmissions = await tx.submission.findMany({ where: { attemptId: submission.attemptId } });
      const totalScore = allSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0);
      const attempt = await tx.attempt.findUniqueOrThrow({ where: { id: submission.attemptId } });
      const maxScore = attempt.maxScore ?? totalScore;
      const passed = totalScore / Math.max(maxScore, 1) * 100 >= submission.attempt.assessment.passingScore;
      await tx.attempt.update({
        where: { id: submission.attemptId },
        data: { status: "EVALUATED", totalScore, passed }
      });
      await tx.invitation.update({
        where: { id: submission.attempt.invitationId },
        data: { status: "COMPLETED" }
      });
    }
    return updated;
  });
}

// src/modules/submissions/submissions.controller.ts
var getById5 = catchAsync(async (req, res) => {
  const submission = await getSubmissionById(req.user.id, req.params.id);
  sendSuccess(res, submission, "Submission fetched successfully");
});
var evaluate = catchAsync(async (req, res) => {
  const submission = await evaluateSubmission(req.user.id, req.params.id, req.body);
  sendSuccess(res, submission, "Submission evaluated successfully");
});

// src/modules/submissions/submissions.validation.ts
var import_zod11 = require("zod");
var evaluateSubmissionSchema = import_zod11.z.object({
  score: import_zod11.z.number().int().min(0).max(1e3),
  feedback: import_zod11.z.string().trim().max(3e3).optional()
});
var idParamSchema7 = import_zod11.z.object({
  id: import_zod11.z.string().uuid("Invalid id format")
});

// src/modules/submissions/submissions.routes.ts
var router11 = (0, import_express11.Router)();
router11.use(authenticate, authorize("COMPANY"));
router11.get("/:id", validate({ params: idParamSchema7 }), getById5);
router11.patch(
  "/:id/evaluate",
  validate({ params: idParamSchema7, body: evaluateSubmissionSchema }),
  evaluate
);
var submissions_routes_default = router11;

// src/modules/payments/payments.routes.ts
var import_express12 = require("express");

// src/modules/payments/stripe.client.ts
var import_stripe = __toESM(require("stripe"));
var stripeClient = env.STRIPE_SECRET_KEY ? new import_stripe.default(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" }) : null;
function requireStripe() {
  if (!stripeClient) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET) in your environment."
    );
  }
  return stripeClient;
}

// src/modules/payments/payments.validation.ts
var import_zod12 = require("zod");
var CREDIT_PACKAGES = {
  SMALL: { credits: 5, amount: 2500, label: "5 Assessment Credits" },
  // amount in cents (USD)
  MEDIUM: { credits: 15, amount: 6e3, label: "15 Assessment Credits" },
  LARGE: { credits: 50, amount: 18e3, label: "50 Assessment Credits" }
};
var initiatePaymentSchema = import_zod12.z.object({
  package: import_zod12.z.enum(["SMALL", "MEDIUM", "LARGE"])
});
var listPaymentsQuerySchema = import_zod12.z.object({
  page: import_zod12.z.coerce.number().int().min(1).optional(),
  limit: import_zod12.z.coerce.number().int().min(1).max(100).optional(),
  status: import_zod12.z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]).optional()
});
var idParamSchema8 = import_zod12.z.object({
  id: import_zod12.z.string().uuid("Invalid id format")
});

// src/modules/payments/payments.service.ts
async function initiatePayment(userId, packageKey) {
  const companyId = await resolveCompanyId(userId);
  const stripe = requireStripe();
  const pkg = CREDIT_PACKAGES[packageKey];
  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: "STRIPE",
      purpose: "CREDIT_PURCHASE",
      amount: pkg.amount,
      currency: "usd",
      creditsPurchased: pkg.credits,
      status: "PENDING",
      metadata: { package: packageKey, companyId }
    }
  });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pkg.amount,
          product_data: { name: pkg.label, description: "Developer Assessment Platform \u2014 assessment publish credits" }
        },
        quantity: 1
      }
    ],
    success_url: env.STRIPE_SUCCESS_URL ?? "https://example.com/payments/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: env.STRIPE_CANCEL_URL ?? "https://example.com/payments/cancel",
    metadata: { paymentId: payment.id, companyId, credits: String(pkg.credits) }
  });
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { providerSessionId: session.id }
  });
  await writeAuditLog(prisma, {
    actorId: userId,
    action: "PAYMENT_INITIATED",
    entity: "Payment",
    entityId: payment.id,
    newState: { package: packageKey, amount: pkg.amount }
  });
  return { payment: updated, checkoutUrl: session.url };
}
async function getPaymentById(userId, role, id) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (role !== "ADMIN" && payment.userId !== userId) {
    throw ApiError.forbidden("You do not have access to this payment");
  }
  return payment;
}
async function listMyPayments(userId, query) {
  const { page, limit, skip, take } = parsePagination(query);
  const where = { userId, ...query.status ? { status: query.status } : {} };
  const [items, total] = await Promise.all([
    prisma.payment.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.payment.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function handleStripeWebhook(rawBody, signature) {
  const stripe = requireStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw ApiError.internal("STRIPE_WEBHOOK_SECRET is not configured");
  }
  if (!signature) {
    throw ApiError.badRequest("Missing Stripe-Signature header");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await creditPayment(session);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      await markPaymentStatus(session.id, "CANCELLED");
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      await markPaymentStatusByIntent(intent.id, "FAILED");
      break;
    }
    default:
      break;
  }
  return { received: true };
}
async function creditPayment(session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return;
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;
    if (payment.status === "SUCCESS") return;
    const companyId = payment.metadata?.companyId;
    if (!companyId) return;
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCESS",
        providerRef: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
      }
    });
    await tx.companyProfile.update({
      where: { id: companyId },
      data: { assessmentCredits: { increment: payment.creditsPurchased } }
    });
    await writeAuditLog(tx, {
      actorId: payment.userId,
      action: "PAYMENT_SUCCEEDED",
      entity: "Payment",
      entityId: paymentId,
      newState: { creditsGranted: payment.creditsPurchased }
    });
  });
}
async function markPaymentStatus(sessionId, status) {
  const payment = await prisma.payment.findUnique({ where: { providerSessionId: sessionId } });
  if (!payment || payment.status === "SUCCESS") return;
  await prisma.payment.update({ where: { id: payment.id }, data: { status } });
  await writeAuditLog(prisma, {
    actorId: payment.userId,
    action: `PAYMENT_${status}`,
    entity: "Payment",
    entityId: payment.id
  });
}
async function markPaymentStatusByIntent(intentId, status) {
  const payment = await prisma.payment.findFirst({ where: { providerRef: intentId } });
  if (!payment || payment.status === "SUCCESS") return;
  await prisma.payment.update({ where: { id: payment.id }, data: { status } });
}

// src/modules/payments/payments.controller.ts
var initiate = catchAsync(async (req, res) => {
  const result = await initiatePayment(req.user.id, req.body.package);
  sendSuccess(res, result, "Payment session created successfully", 201);
});
var getById6 = catchAsync(async (req, res) => {
  const role = req.user.role === "ADMIN" ? "ADMIN" : "COMPANY";
  const payment = await getPaymentById(req.user.id, role, req.params.id);
  sendSuccess(res, payment, "Payment fetched successfully");
});
var listMine3 = catchAsync(async (req, res) => {
  const { items, meta } = await listMyPayments(req.user.id, req.query);
  sendSuccess(res, items, "Payments fetched successfully", 200, meta);
});
var webhook = async (req, res) => {
  try {
    const result = await handleStripeWebhook(req.body, req.headers["stripe-signature"]);
    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    res.status(400).json({ success: false, message, errors: [] });
  }
};

// src/modules/payments/payments.routes.ts
var router12 = (0, import_express12.Router)();
router12.post(
  "/initiate",
  authenticate,
  authorize("COMPANY"),
  paymentRateLimiter,
  validate({ body: initiatePaymentSchema }),
  initiate
);
router12.get("/me", authenticate, authorize("COMPANY"), validate({ query: listPaymentsQuerySchema }), listMine3);
router12.get(
  "/:id",
  authenticate,
  authorize("COMPANY", "ADMIN"),
  validate({ params: idParamSchema8 }),
  getById6
);
var payments_routes_default = router12;

// src/modules/admin/admin.routes.ts
var import_express13 = require("express");

// src/modules/admin/admin.service.ts
async function listUsers(query) {
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    deletedAt: null,
    ...query.role ? { role: query.role } : {},
    ...query.isActive ? { isActive: query.isActive === "true" } : {},
    ...query.q ? {
      OR: [
        { name: { contains: query.q, mode: "insensitive" } },
        { email: { contains: query.q, mode: "insensitive" } }
      ]
    } : {}
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        provider: true,
        createdAt: true
      }
    }),
    prisma.user.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}
async function updateUserRole(adminId, targetId, role) {
  if (adminId === targetId) {
    throw ApiError.badRequest("Admins cannot change their own role");
  }
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.deletedAt) throw ApiError.notFound("User not found");
  if (target.role === role) return target;
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: targetId }, data: { role } });
    if (role === "COMPANY") {
      const exists = await tx.companyProfile.findUnique({ where: { userId: targetId } });
      if (!exists) {
        await tx.companyProfile.create({ data: { userId: targetId, companyName: `${user.name}'s Company` } });
      }
    } else if (role === "CANDIDATE") {
      const exists = await tx.candidateProfile.findUnique({ where: { userId: targetId } });
      if (!exists) {
        await tx.candidateProfile.create({ data: { userId: targetId } });
      }
    }
    await writeAuditLog(tx, {
      actorId: adminId,
      action: "USER_ROLE_CHANGED",
      entity: "User",
      entityId: targetId,
      previousState: { role: target.role },
      newState: { role }
    });
    return user;
  });
  return updated;
}
async function updateUserStatus(adminId, targetId, isActive) {
  if (adminId === targetId) {
    throw ApiError.badRequest("Admins cannot deactivate their own account");
  }
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.deletedAt) throw ApiError.notFound("User not found");
  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { isActive, refreshToken: isActive ? target.refreshToken : null }
  });
  await writeAuditLog(prisma, {
    actorId: adminId,
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entity: "User",
    entityId: targetId,
    previousState: { isActive: target.isActive },
    newState: { isActive }
  });
  return updated;
}
async function getDashboardStats() {
  const [
    totalUsers,
    totalCandidates,
    totalCompanies,
    totalAssessments,
    publishedAssessments,
    totalAttempts,
    completedAttempts,
    totalPaymentsSuccess,
    revenueAgg
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "CANDIDATE", deletedAt: null } }),
    prisma.user.count({ where: { role: "COMPANY", deletedAt: null } }),
    prisma.assessment.count({ where: { deletedAt: null } }),
    prisma.assessment.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.attempt.count(),
    prisma.attempt.count({ where: { status: "EVALUATED" } }),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } })
  ]);
  return {
    users: { total: totalUsers, candidates: totalCandidates, companies: totalCompanies },
    assessments: { total: totalAssessments, published: publishedAssessments },
    attempts: { total: totalAttempts, completed: completedAttempts },
    payments: { successfulCount: totalPaymentsSuccess, totalRevenueCents: revenueAgg._sum.amount ?? 0 }
  };
}
async function listAuditLogs(query) {
  const { page, limit, skip, take } = parsePagination(query);
  const where = {
    ...query.entity ? { entity: query.entity } : {},
    ...query.action ? { action: query.action } : {},
    ...query.actorId ? { actorId: query.actorId } : {}
  };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, email: true, role: true } } }
    }),
    prisma.auditLog.count({ where })
  ]);
  return { items, meta: buildMeta(page, limit, total) };
}

// src/modules/admin/admin.controller.ts
var listUsers2 = catchAsync(async (req, res) => {
  const { items, meta } = await listUsers(req.query);
  sendSuccess(res, items, "Users fetched successfully", 200, meta);
});
var updateUserRole2 = catchAsync(async (req, res) => {
  const user = await updateUserRole(req.user.id, req.params.id, req.body.role);
  sendSuccess(res, user, "User role updated successfully");
});
var updateUserStatus2 = catchAsync(async (req, res) => {
  const user = await updateUserStatus(req.user.id, req.params.id, req.body.isActive);
  sendSuccess(res, user, "User status updated successfully");
});
var dashboardStats = catchAsync(async (_req, res) => {
  const stats = await getDashboardStats();
  sendSuccess(res, stats, "Dashboard stats fetched successfully");
});
var auditLogs = catchAsync(async (req, res) => {
  const { items, meta } = await listAuditLogs(req.query);
  sendSuccess(res, items, "Audit logs fetched successfully", 200, meta);
});

// src/modules/admin/admin.validation.ts
var import_zod13 = require("zod");
var listUsersQuerySchema = import_zod13.z.object({
  page: import_zod13.z.coerce.number().int().min(1).optional(),
  limit: import_zod13.z.coerce.number().int().min(1).max(100).optional(),
  role: import_zod13.z.enum(["CANDIDATE", "COMPANY", "ADMIN"]).optional(),
  q: import_zod13.z.string().trim().max(200).optional(),
  isActive: import_zod13.z.enum(["true", "false"]).optional()
});
var updateUserRoleSchema = import_zod13.z.object({
  role: import_zod13.z.enum(["CANDIDATE", "COMPANY", "ADMIN"])
});
var updateUserStatusSchema = import_zod13.z.object({
  isActive: import_zod13.z.boolean()
});
var listAuditLogsQuerySchema = import_zod13.z.object({
  page: import_zod13.z.coerce.number().int().min(1).optional(),
  limit: import_zod13.z.coerce.number().int().min(1).max(100).optional(),
  entity: import_zod13.z.string().trim().max(100).optional(),
  action: import_zod13.z.string().trim().max(100).optional(),
  actorId: import_zod13.z.string().uuid().optional()
});
var idParamSchema9 = import_zod13.z.object({
  id: import_zod13.z.string().uuid("Invalid id format")
});

// src/modules/admin/admin.routes.ts
var router13 = (0, import_express13.Router)();
router13.use(authenticate, authorize("ADMIN"));
router13.get("/users", validate({ query: listUsersQuerySchema }), listUsers2);
router13.patch(
  "/users/:id/role",
  validate({ params: idParamSchema9, body: updateUserRoleSchema }),
  updateUserRole2
);
router13.patch(
  "/users/:id/status",
  validate({ params: idParamSchema9, body: updateUserStatusSchema }),
  updateUserStatus2
);
router13.get("/dashboard-stats", dashboardStats);
router13.get("/audit-logs", validate({ query: listAuditLogsQuerySchema }), auditLogs);
var admin_routes_default = router13;

// src/routes/v1.ts
var router14 = (0, import_express14.Router)();
router14.use("/auth", auth_routes_default);
router14.use("/users", users_routes_default);
router14.use("/companies", companies_routes_default);
router14.use("/candidates", candidates_routes_default);
router14.use("/problems", problems_routes_default);
router14.use("/assessments", assessments_routes_default);
router14.use("/invitations", invitations_me_routes_default);
router14.use("/attempts", attempts_top_routes_default);
router14.use("/submissions", submissions_routes_default);
router14.use("/payments", payments_routes_default);
router14.use("/admin", admin_routes_default);
var v1_default = router14;

// src/middleware/error.middleware.ts
var import_client2 = require("@prisma/client");
function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
function errorHandler(err, req, res, _next) {
  if (!isProd) console.error(err);
  if (err instanceof ApiError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }
  if (err instanceof import_client2.Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = err.meta?.target?.join(", ") ?? "field";
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
  if (err instanceof import_client2.Prisma.PrismaClientValidationError) {
    sendError(res, "Invalid data provided to the database layer", 400);
    return;
  }
  if (err instanceof import_client2.Prisma.PrismaClientInitializationError) {
    sendError(res, "Database connection failed", 503);
    return;
  }
  if (err && typeof err === "object" && "name" in err) {
    const name = err.name;
    if (name === "JsonWebTokenError" || name === "TokenExpiredError") {
      sendError(res, "Invalid or expired token", 401);
      return;
    }
    if (name === "SyntaxError" && "body" in err) {
      sendError(res, "Malformed JSON in request body", 400);
      return;
    }
  }
  const message = err instanceof Error ? err.message : "Something went wrong";
  sendError(res, isProd ? "Something went wrong" : message, 500);
}

// src/app.ts
function createApp() {
  const app2 = (0, import_express15.default)();
  app2.disable("x-powered-by");
  app2.set("trust proxy", 1);
  app2.use((0, import_helmet.default)());
  app2.use(
    (0, import_cors.default)({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      credentials: true
    })
  );
  app2.use((0, import_compression.default)());
  app2.use((0, import_morgan.default)(isProd ? "combined" : "dev"));
  app2.post("/api/v1/payments/webhook", import_express15.default.raw({ type: "application/json" }), webhook);
  app2.use(import_express15.default.json({ limit: "1mb" }));
  app2.use(import_express15.default.urlencoded({ extended: true }));
  app2.use((0, import_cookie_parser.default)());
  app2.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }, "Service is healthy");
  });
  const openapiPath = import_path.default.join(__dirname, "..", "docs", "openapi.yaml");
  if (import_fs.default.existsSync(openapiPath)) {
    const swaggerDocument = import_yamljs.default.load(openapiPath);
    app2.get("/api-docs/openapi.json", (_req, res) => {
      res.json(swaggerDocument);
    });
    app2.get("/api-docs", (_req, res) => {
      res.type("html").send(`<!DOCTYPE html>
<html>
<head>
  <title>CodeRank API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/api-docs/openapi.json",
        dom_id: "#swagger-ui",
      });
    };
  </script>
</body>
</html>`);
    });
  }
  app2.use("/api/v1", apiRateLimiter, v1_default);
  app2.use(notFoundHandler);
  app2.use(errorHandler);
  return app2;
}

// src/server.ts
var app = createApp();
if (require.main === module) {
  const server = app.listen(env.PORT, () => {
    console.log(`\u{1F680} Developer Assessment Platform API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });
  const shutdown = async (signal) => {
    console.log(`
${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 1e4).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
var server_default = app;
if (typeof module !== "undefined") {
  module.exports = app;
  module.exports.default = app;
}
//# sourceMappingURL=server.js.map