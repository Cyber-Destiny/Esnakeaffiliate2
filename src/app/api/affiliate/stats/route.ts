import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

export const GET = withErrors(async () => {
  const aff = await requireAffiliate();

  const [clicks, signups, depositorsAgg, wagersAgg, paidAgg, pendingAgg] = await Promise.all([
    db.click.count({ where: { affiliateId: aff.id } }),
    db.referredUser.count({ where: { affiliateId: aff.id } }),
    db.referredUser.aggregate({
      where: { affiliateId: aff.id, deposited: { gt: 0 } },
      _count: { _all: true },
    }),
    db.wager.aggregate({
      where: { referredUser: { affiliateId: aff.id } },
      _sum: { amount: true, platformRevenue: true, commission: true },
    }),
    db.payout.aggregate({
      where: { affiliateId: aff.id },
      _sum: { amount: true },
    }),
    db.withdrawal.aggregate({
      where: { affiliateId: aff.id, status: "pending" },
      _sum: { amount: true },
    }),
  ]);

  const totalCommissionEarned = wagersAgg._sum.commission || 0;
  const totalWagered = wagersAgg._sum.amount || 0;
  const platformRevenue = wagersAgg._sum.platformRevenue || 0;
  const totalPaid = paidAgg._sum.amount || 0;
  const pendingWithdrawals = pendingAgg._sum.amount || 0;
  const depositors = depositorsAgg._count._all;
  const availableBalance = Math.max(
    0,
    totalCommissionEarned - totalPaid - pendingWithdrawals
  );

  return ok({
    overview: {
      totalClicks: clicks,
      totalSignups: signups,
      depositors,
      totalWagered,
      platformRevenue,
      totalCommissionEarned,
      totalPaid,
      pendingWithdrawals,
      availableBalance,
    },
  });
});
