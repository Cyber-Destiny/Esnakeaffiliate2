import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, withErrors, parseZod, badRequest } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  referralCode: z.string().min(2).max(20),
  username: z.string().min(2).max(40),
  amount: z.number().positive(),
});

/**
 * Called by the main platform (esnaked.com) when a referred user makes a deposit.
 * The main platform identifies the user by their username + the affiliate's
 * referral code (stored in the user's profile at registration time).
 *
 * Body: { referralCode: "JOSHUA", username: "newplayer", amount: 5000 }
 */
export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const data = parseZod(schema, body);

  const referredUser = await db.referredUser.findFirst({
    where: {
      referralCode: data.referralCode.toUpperCase(),
      username: data.username,
    },
    select: { id: true, affiliateId: true, deposited: true },
  });
  if (!referredUser) return badRequest("Referred user not found for this referral code");

  await db.deposit.create({
    data: {
      referredUserId: referredUser.id,
      amount: data.amount,
    },
  });

  await db.referredUser.update({
    where: { id: referredUser.id },
    data: { deposited: { increment: data.amount } },
  });

  await db.notification.create({
    data: {
      affiliateId: referredUser.affiliateId,
      type: "deposit",
      title: "New deposit",
      message: `${data.username} deposited ₦${data.amount.toLocaleString()} on ENSNAKE.`,
      read: false,
    },
  });

  return ok({ recorded: true, amount: data.amount });
});
