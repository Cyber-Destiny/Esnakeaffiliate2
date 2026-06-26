import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

export const GET = withErrors(async () => {
  await requireAdmin();

  const [
    totalAffiliates,
    activeAffiliates,
    suspendedAffiliates,
    signupsAgg,
    depositsAgg,
    wagersAgg,
    paidAgg,
    pendingWdAgg,
  ] = await Promise.all([
    db.affiliate.count({ where: { role: "affiliate" } }),
    db.affiliate.count({ where: { role: "affiliate", status: "active" } }),
    db.affiliate.count({ where: { role: "affiliate", status: "suspended" } }),
    db.referredUser.count(),
    db.deposit.aggregate({ _sum: { amount: true } }),
    db.wager.aggregate({ _sum: { amount: true, platformRevenue: true, commission: true } }),
    db.payout.aggregate({ _sum: { amount: true } }),
    db.withdrawal.aggregate({
      where: { status: "pending" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const totalCommissionEarned = wagersAgg._sum.commission || 0;
  const totalPaid = paidAgg._sum.amount || 0;
  const commissionsOwed = Math.max(0, totalCommissionEarned - totalPaid);

  return ok({
    overview: {
      totalAffiliates,
      activeAffiliates,
      suspendedAffiliates,
      totalSignups: signupsAgg,
      totalDeposits: depositsAgg._sum.amount || 0,
      totalWagered: wagersAgg._sum.amount || 0,
      totalPlatformRevenue: wagersAgg._sum.platformRevenue || 0,
      totalCommissionsEarned: totalCommissionEarned,
      totalPaid,
      totalCommissionsOwed: commissionsOwed,
      pendingWithdrawalsAmount: pendingWdAgg._sum.amount || 0,
      pendingWithdrawalsCount: pendingWdAgg._count._all,
    },
  });
});
