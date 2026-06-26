import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comparePassword } from "@/lib/password";
import { signToken, setAuthCookie } from "@/lib/auth";
import { badRequest, ok, withErrors, parseZod, unauthorized } from "@/lib/api";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json();
  const data = parseZod(loginSchema, body);

  const affiliate = await db.affiliate.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (!affiliate) return unauthorized("Invalid email or password");

  const valid = await comparePassword(data.password, affiliate.passwordHash);
  if (!valid) return unauthorized("Invalid email or password");

  if (affiliate.status === "suspended") {
    return badRequest("Your account has been suspended. Contact support.");
  }

  const jwt = await signToken({
    sub: affiliate.id,
    email: affiliate.email,
    role: affiliate.role as "affiliate" | "admin",
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
      role: affiliate.role,
      status: affiliate.status,
      commissionPct: affiliate.commissionPct,
      emailVerified: affiliate.emailVerified,
    },
  });
});
