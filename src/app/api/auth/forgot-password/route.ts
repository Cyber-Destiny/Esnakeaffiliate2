import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { badRequest, ok, withErrors, parseZod } from "@/lib/api";
import { z } from "zod";
import { randomBytes } from "crypto";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json();
  const data = parseZod(schema, body);

  const affiliate = await db.affiliate.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  // Always respond ok to avoid email enumeration
  if (!affiliate) return ok({ sent: true });

  const token = randomBytes(24).toString("hex");
  await db.verificationToken.create({
    data: {
      email: affiliate.email,
      token,
      purpose: "password_reset",
      expiresAt: new Date(Date.now() + 1 * 3600 * 1000),
    },
  });

  // Demo: return the token so the UI can offer it. In production this is emailed.
  return ok({ sent: true, resetToken: token });
});
