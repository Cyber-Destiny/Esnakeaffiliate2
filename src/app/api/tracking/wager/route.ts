import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, withErrors, parseZod, badRequest } from "@/lib/api";
import { computeWagerEconomics } from "@/lib/commission";
import { z } from "zod";

const schema = z.object({
  referralCode: z.string().min(2).max(20),
  username: z.string().min(2).max(40),
  amount: z.number().positive(),
});

/**
 * Called by the main platform (esnaked.com) when a referred user places a wager.
 *
 * Commission logic:
 *   platformRevenue = 10% of wager amount  (PLATFORM_FEE_PCT)
 *   commission       = affiliate.commissionPct% of platformRevenue
 *
 * Example: user wagers ₦1000 → platform revenue ₦100 → affiliate earns ₦20 (at 20%).
 *
 * Body: { referralCode: "JOSHUA", username: "newplayer", amount: 1000 }
 */
export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const data = parseZod(schema, body);

  const referredUser = await db.referredUser.findFirst({
    where: {
      referralCode: data.referralCode.toUpperCase(),
      username: data.username,
    },
    select: { id: true, affiliateId: true },
  });
  if (!referredUser) return badRequest("Referred user not found for this referral code");

  const affiliate = await db.affiliate.findUnique({
    where: { id: referredUser.affiliateId },
    select: { commissionPct: true, status: true },
  });
  if (!affiliate) return badRequest("Affiliate not found");
  if (affiliate.status !== "active") return badRequest("Affiliate is not active");

  const { platformRevenue, commission } = computeWagerEconomics(
    data.amount,
    affiliate.commissionPct
  );

  await db.wager.create({
    data: {
      referredUserId: referredUser.id,
      amount: data.amount,
      platformRevenue,
      commission,
    },
  });

  await db.referredUser.update({
    where: { id: referredUser.id },
    data: {
      totalWagered: { increment: data.amount },
      revenueGenerated: { increment: platformRevenue },
      commissionGenerated: { increment: commission },
    },
  });

  return ok({
    recorded: true,
    wager: data.amount,
    platformRevenue,
    commission,
    commissionPct: affiliate.commissionPct,
  });
});
