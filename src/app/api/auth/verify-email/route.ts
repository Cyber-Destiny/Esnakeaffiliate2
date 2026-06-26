import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { badRequest, ok, withErrors, parseZod } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(10, "Invalid token"),
});

export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json();
  const data = parseZod(schema, body);

  const record = await db.verificationToken.findUnique({
    where: { token: data.token },
  });
  if (!record || record.purpose !== "email_verification" || record.used) {
    return badRequest("Invalid verification token");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return badRequest("This verification token has expired. Please request a new one.");
  }

  const affiliate = await db.affiliate.findUnique({ where: { email: record.email } });
  if (!affiliate) return badRequest("Account not found");

  await db.affiliate.update({
    where: { id: affiliate.id },
    data: { emailVerified: true },
  });
  await db.verificationToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  return ok({ success: true, email: affiliate.email });
});
