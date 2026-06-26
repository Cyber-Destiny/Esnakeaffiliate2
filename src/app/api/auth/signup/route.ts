import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signToken, setAuthCookie } from "@/lib/auth";
import { generateReferralCode, buildReferralLink } from "@/lib/referral";
import { badRequest, ok, withErrors, parseZod } from "@/lib/api";
import { isAdminSignupEmail } from "@/lib/constants";
import { z } from "zod";
import { randomBytes } from "crypto";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is too short").max(60),
  email: z.string().email("Invalid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  platformName: z.string().max(40).optional(),
  referralCode: z.string().max(20).optional(),
});

export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json();
  const data = parseZod(signupSchema, body);

  const existingEmail = await db.affiliate.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existingEmail) return badRequest("An account with this email already exists");

  const existingUsername = await db.affiliate.findUnique({ where: { username: data.username.toLowerCase() } });
  if (existingUsername) return badRequest("This username is already taken");

  const referralCode = await generateReferralCode(data.fullName);
  const passwordHash = await hashPassword(data.password);
  const isAdmin = isAdminSignupEmail(data.email);

  const affiliate = await db.affiliate.create({
    data: {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      passwordHash,
      referralCode,
      commissionPct: isAdmin ? 0 : 20,
      status: "active",
      role: isAdmin ? "admin" : "affiliate",
      emailVerified: false,
      platformName: data.platformName || null,
    },
  });

  const token = randomBytes(24).toString("hex");
  await db.verificationToken.create({
    data: {
      email: affiliate.email,
      token,
      purpose: "email_verification",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  const jwt = await signToken({
    sub: affiliate.id,
    email: affiliate.email,
    role: isAdmin ? "admin" : "affiliate",
    referralCode: affiliate.referralCode,
  });
  await setAuthCookie(jwt);

  return ok({
    affiliate: {
      id: affiliate.id,
      fullName: affiliate.fullName,
      email: affiliate.email,
      username: affiliate.username,
      referralCode: affiliate.referralCode,
      referralLink: buildReferralLink(affiliate.referralCode),
      commissionPct: affiliate.commissionPct,
      status: affiliate.status,
      role: affiliate.role,
      emailVerified: affiliate.emailVerified,
      createdAt: affiliate.createdAt,
    },
    verificationToken: token,
  });
});
