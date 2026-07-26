import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, withErrors, parseZod, badRequest } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  referralCode: z.string().min(2).max(20),
  username: z.string().min(2).max(40),
  email: z.string().email().optional().nullable(),
});

/**
 * Called by the main platform (esnaked.com) when a new user registers using a
 * referral link. The main platform reads the `ref` cookie (set when the user
 * first visited esnaked.com?ref=CODE) and passes it here.
 *
 * This creates a ReferredUser record permanently linking the new user to the
 * affiliate, and sends a "New signup" notification to the affiliate.
 *
 * Body: { referralCode: "JOSHUA", username: "newplayer", email: "player@x.com" }
 */
export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const data = parseZod(schema, body);

  const affiliate = await db.affiliate.findUnique({
    where: { referralCode: data.referralCode.toUpperCase() },
    select: { id: true, referralCode: true, status: true },
  });
  if (!affiliate) return badRequest("Invalid referral code");
  if (affiliate.status !== "active") return badRequest("Affiliate is not active");

  // Prevent duplicate signups for the same username under the same affiliate
  const existing = await db.referredUser.findFirst({
    where: {
      affiliateId: affiliate.id,
      username: data.username,
    },
    select: { id: true },
  });
  if (existing) return badRequest("This user is already tracked under this affiliate");

  const referredUser = await db.referredUser.create({
    data: {
      username: data.username,
      email: data.email || null,
      affiliateId: affiliate.id,
      referralCode: affiliate.referralCode,
      status: "active",
    },
  });

  await db.notification.create({
    data: {
      affiliateId: affiliate.id,
      type: "signup",
      title: "New signup",
      message: `${data.username} joined ENSNAKE using your referral code ${affiliate.referralCode}.`,
      read: false,
    },
  });

  return ok({
    recorded: true,
    referredUser: {
      id: referredUser.id,
      username: referredUser.username,
      affiliateId: referredUser.affiliateId,
      referralCode: referredUser.referralCode,
    },
  });
});
