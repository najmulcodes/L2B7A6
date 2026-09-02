import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { hashValue, compareValue } from "../../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { writeAuditLog } from "../../utils/audit";
import type { RegisterInput, LoginInput, GoogleAuthInput } from "./auth.validation";
import type { Role } from "@prisma/client";

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
} as const;

async function issueTokens(userId: string, email: string, role: Role) {
  const accessToken = signAccessToken({ sub: userId, email, role });
  const refreshToken = signRefreshToken({ sub: userId });
  const hashedRefresh = await hashValue(refreshToken);
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: hashedRefresh } });
  return { accessToken, refreshToken };
}

async function createProfileForRole(userId: string, role: Role, companyName?: string) {
  if (role === "COMPANY") {
    await prisma.companyProfile.create({
      data: { userId, companyName: companyName as string },
    });
  } else if (role === "CANDIDATE") {
    await prisma.candidateProfile.create({ data: { userId } });
  }
}

export async function registerUser(input: RegisterInput, ip?: string) {
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
        role: input.role,
      },
      select: PUBLIC_USER_SELECT,
    });

    if (input.role === "COMPANY") {
      await tx.companyProfile.create({
        data: { userId: created.id, companyName: input.companyName as string },
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
      ipAddress: ip,
    });

    return created;
  });

  const tokens = await issueTokens(user.id, user.email, user.role);
  return { user, ...tokens };
}

export async function loginUser(input: LoginInput, ip?: string) {
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
    ipAddress: ip,
  });

  const { password: _pw, refreshToken: _rt, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

export async function refreshUserToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.deletedAt || !user.isActive) {
    throw ApiError.unauthorized("Account no longer available");
  }

  const matches = await compareValue(refreshToken, user.refreshToken);
  if (!matches) {
    // Possible token reuse/theft — invalidate the stored session defensively.
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
    throw ApiError.unauthorized("Refresh token is no longer valid. Please log in again.");
  }

  const tokens = await issueTokens(user.id, user.email, user.role);
  return tokens;
}

export async function logoutUser(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
}

export async function googleAuth(input: GoogleAuthInput, ip?: string) {
  if (!googleClient || !env.GOOGLE_CLIENT_ID) {
    throw ApiError.badRequest("Google Sign-In is not configured on this server");
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: input.idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw ApiError.unauthorized("Invalid Google token");
  }

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw ApiError.unauthorized("Google token did not include a verifiable email");
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] },
  });

  if (user && user.deletedAt) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  if (!user) {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: payload.name ?? payload.email!.split("@")[0],
          email: payload.email!.toLowerCase(),
          role: input.role,
          provider: "GOOGLE",
          googleId: payload.sub,
          avatarUrl: payload.picture ?? null,
        },
      });
      await createProfileForRole(created.id, input.role, input.companyName);
      await writeAuditLog(tx, {
        actorId: created.id,
        action: "USER_REGISTERED_GOOGLE",
        entity: "User",
        entityId: created.id,
        newState: { email: created.email, role: created.role },
        ipAddress: ip,
      });
      return created;
    });
  } else if (!user.googleId) {
    // Account linking: existing local account signing in with Google for the first time.
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub, provider: user.password ? user.provider : "GOOGLE" },
    });
  }

  const tokens = await issueTokens(user.id, user.email, user.role);
  const { password: _pw, refreshToken: _rt, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}
