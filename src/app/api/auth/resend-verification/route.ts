import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { badRequest, ok, withErrors, parseZod } from "@/lib/api";
import { z } from "zod";
import { randomBytes } from "crypto";

const schema = z.object({ email: z.string().email("Invalid email") });

export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json();
  const data = parseZod(schema, body);

  const affiliate = await db.affiliate.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (!affiliate) return badRequest("Account not found");
  if (affiliate.emailVerified) return ok({ alreadyVerified: true });

  const token = randomBytes(24).toString("hex");
  await db.verificationToken.create({
    data: {
      email: affiliate.email,
      token,
      purpose: "email_verification",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  return ok({ sent: true, verificationToken: token });
});
