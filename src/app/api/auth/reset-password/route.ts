import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { badRequest, ok, withErrors, parseZod } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10, "Invalid token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json();
  const data = parseZod(schema, body);

  const record = await db.verificationToken.findUnique({
    where: { token: data.token },
  });
  if (!record || record.purpose !== "password_reset" || record.used) {
    return badRequest("Invalid or expired reset token");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return badRequest("This reset token has expired. Please request a new one.");
  }

  const affiliate = await db.affiliate.findUnique({ where: { email: record.email } });
  if (!affiliate) return badRequest("Account not found");

  const passwordHash = await hashPassword(data.password);
  await db.affiliate.update({
    where: { id: affiliate.id },
    data: { passwordHash },
  });
  await db.verificationToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  return ok({ success: true });
});
