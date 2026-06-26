import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SEC,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from "./constants";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ensnake-dev-secret-change-me-in-production-please-32bytes"
);

export type AffiliateJwtPayload = {
  sub: string; // affiliate id
  email: string;
  role: "affiliate" | "admin";
  referralCode: string;
};

export async function signToken(payload: AffiliateJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${AUTH_COOKIE_MAX_AGE_SEC}s`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AffiliateJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as AffiliateJwtPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SEC,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}

export async function getAuthCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value;
}

/** Resolve the currently authenticated affiliate (or null). */
export async function getCurrentAffiliate() {
  const token = await getAuthCookie();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const affiliate = await db.affiliate.findUnique({
    where: { id: payload.sub },
  });
  if (!affiliate) return null;
  if (affiliate.status === "suspended") return null;
  return affiliate;
}

/** Require an affiliate (any role). Throws response-like error otherwise. */
export async function requireAffiliate() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    throw new AuthError("Unauthorized", 401);
  }
  return affiliate;
}

/** Require an admin. */
export async function requireAdmin() {
  const affiliate = await requireAffiliate();
  if (affiliate.role !== "admin") {
    throw new AuthError("Forbidden: admin only", 403);
  }
  return affiliate;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
