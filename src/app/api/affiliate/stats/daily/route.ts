import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export const GET = withErrors(async (req: Request) => {
  const aff = await requireAffiliate();
  const url = new URL(req.url);
  const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days") || 30)));

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  // Build empty buckets
  const buckets = new Map<string, {
    date: string;
    clicks: number;
    signups: number;
    deposits: number;
    wagerVolume: number;
    revenue: number;
    commission: number;
  }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    buckets.set(key, {
      date: key,
      clicks: 0,
      signups: 0,
      deposits: 0,
      wagerVolume: 0,
      revenue: 0,
      commission: 0,
    });
  }

  // Fetch raw rows for this affiliate since `start`
  const [clicks, users, deposits, wagers] = await Promise.all([
    db.click.findMany({
      where: { affiliateId: aff.id, createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    db.referredUser.findMany({
      where: { affiliateId: aff.id, joinedAt: { gte: start } },
      select: { joinedAt: true },
    }),
    db.deposit.findMany({
      where: { referredUser: { affiliateId: aff.id }, createdAt: { gte: start } },
      select: { amount: true, createdAt: true },
    }),
    db.wager.findMany({
      where: { referredUser: { affiliateId: aff.id }, createdAt: { gte: start } },
      select: { amount: true, platformRevenue: true, commission: true, createdAt: true },
    }),
  ]);

  for (const c of clicks) {
    const b = buckets.get(dayKey(c.createdAt));
    if (b) b.clicks += 1;
  }
  for (const u of users) {
    const b = buckets.get(dayKey(u.joinedAt));
    if (b) b.signups += 1;
  }
  for (const d of deposits) {
    const b = buckets.get(dayKey(d.createdAt));
    if (b) {
      b.deposits += d.amount;
    }
  }
  for (const w of wagers) {
    const b = buckets.get(dayKey(w.createdAt));
    if (b) {
      b.wagerVolume += w.amount;
      b.revenue += w.platformRevenue;
      b.commission += w.commission;
    }
  }

  const series = Array.from(buckets.values());
  return ok({ series });
});
