import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { computeWagerEconomics } from "@/lib/commission";
import { ok, withErrors, badRequest } from "@/lib/api";

const FIRST = ["neon", "shadow", "vortex", "blaze", "phantom", "titan", "raven", "ace", "storm", "falcon", "echo", "volt", "rogue", "maverick", "onyx", "pulse", "cyber", "nova", "zephyr", "drift"];
const SECOND = ["kid", "pro", "x", "ng", "hq", "zilla", "wave", "core", "byte", "fyre", "lord", "mob", "squad", "gang"];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Demo helper: simulates a referred-user activity event for the current affiliate.
 * Creates a new referred user (signup), a first deposit, and a wager with computed
 * platform revenue + commission. Also creates signup + deposit notifications.
 * In production, signup/deposit/wager events would be emitted by the main platform
 * and attributed via the ensnake_ref cookie.
 */
export const POST = withErrors(async (req: NextRequest) => {
  const aff = await requireAffiliate();
  const url = new URL(req.url);
  const kind = (url.searchParams.get("kind") || "signup") as
    | "signup"
    | "deposit"
    | "wager";
  const username = `${pick(FIRST)}${pick(SECOND)}${rnd(10, 99)}`;
  const now = new Date();

  if (kind === "signup" || kind === "deposit" || kind === "wager") {
    // Ensure we have a referred user to attach activity to
    let ref = await db.referredUser.findFirst({
      where: { affiliateId: aff.id },
      orderBy: { joinedAt: "desc" },
    });

    if (kind === "signup" || !ref) {
      ref = await db.referredUser.create({
        data: {
          username,
          email: `${username}@ensnake.com`,
          affiliateId: aff.id,
          referralCode: aff.referralCode,
          joinedAt: now,
        },
      });
      await db.notification.create({
        data: {
          affiliateId: aff.id,
          type: "signup",
          title: "New signup",
          message: `${ref.username} joined ENSNAKE using your referral code ${aff.referralCode}.`,
          read: false,
        },
      });
      if (kind === "signup") return ok({ event: "signup", referredUser: ref });
    }

    if (kind === "deposit" || kind === "wager") {
      const depositAmt = pick([500, 1000, 2000, 5000, 10000, 25000]);
      await db.deposit.create({
        data: { referredUserId: ref.id, amount: depositAmt, createdAt: now },
      });
      await db.referredUser.update({
        where: { id: ref.id },
        data: { deposited: { increment: depositAmt } },
      });
      await db.notification.create({
        data: {
          affiliateId: aff.id,
          type: "deposit",
          title: "New deposit",
          message: `${ref.username} deposited ₦${depositAmt.toLocaleString()} on ENSNAKE.`,
          read: false,
        },
      });
      if (kind === "deposit") return ok({ event: "deposit", referredUser: ref, amount: depositAmt });
    }

    if (kind === "wager") {
      const wagerAmt = pick([200, 500, 1000, 2000, 3000, 5000, 10000]);
      const { platformRevenue, commission } = computeWagerEconomics(wagerAmt, aff.commissionPct);
      await db.wager.create({
        data: {
          referredUserId: ref.id,
          amount: wagerAmt,
          platformRevenue,
          commission,
          createdAt: now,
        },
      });
      await db.referredUser.update({
        where: { id: ref.id },
        data: {
          totalWagered: { increment: wagerAmt },
          revenueGenerated: { increment: platformRevenue },
          commissionGenerated: { increment: commission },
        },
      });
      return ok({
        event: "wager",
        referredUser: ref,
        wager: wagerAmt,
        platformRevenue,
        commission,
      });
    }
  }

  return badRequest("Invalid kind");
});
