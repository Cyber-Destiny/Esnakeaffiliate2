import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { generateReferralCode, buildReferralLink } from "@/lib/referral";
import { ok, withErrors, parseZod, badRequest } from "@/lib/api";
import { z } from "zod";

export const GET = withErrors(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").trim();
  const status = url.searchParams.get("status") || undefined;

  const where = {
    role: "affiliate" as const,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { username: { contains: search } },
            { referralCode: { contains: search } },
          ],
        }
      : {}),
  };

  const affiliates = await db.affiliate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      referralCode: true,
      commissionPct: true,
      status: true,
      platformName: true,
      createdAt: true,
      avatarUrl: true,
    },
  });

  // Attach per-affiliate aggregates
  const ids = affiliates.map((a) => a.id);
  const [signups, depositors, withdrawals] = await Promise.all([
    db.referredUser.groupBy({
      by: ["affiliateId"],
      where: { affiliateId: { in: ids } },
      _count: { _all: true },
    }),
    db.referredUser.groupBy({
      by: ["affiliateId"],
      where: { affiliateId: { in: ids }, deposited: { gt: 0 } },
      _count: { _all: true },
    }),
    db.withdrawal.groupBy({
      by: ["affiliateId"],
      where: { affiliateId: { in: ids }, status: "approved" },
      _sum: { amount: true },
    }),
  ]);

  // For wagers we need to aggregate by affiliate — join via referredUser. Prisma groupBy
  // can't traverse relations for the by clause, so we fetch raw rows instead.
  const wagerRows = await db.wager.findMany({
    where: { referredUser: { affiliateId: { in: ids } } },
    select: {
      platformRevenue: true,
      commission: true,
      referredUser: { select: { affiliateId: true } },
    },
  });
  const wagerByAff = new Map<string, { revenue: number; commission: number }>();
  for (const w of wagerRows) {
    const cur = wagerByAff.get(w.referredUser.affiliateId) || { revenue: 0, commission: 0 };
    cur.revenue += w.platformRevenue;
    cur.commission += w.commission;
    wagerByAff.set(w.referredUser.affiliateId, cur);
  }

  const signupsMap = new Map(signups.map((s) => [s.affiliateId, s._count._all]));
  const depositorsMap = new Map(depositors.map((s) => [s.affiliateId, s._count._all]));
  const withdrawalsMap = new Map(withdrawals.map((s) => [s.affiliateId, s._sum.amount || 0]));

  const rows = affiliates.map((a) => {
    const w = wagerByAff.get(a.id) || { revenue: 0, commission: 0 };
    return {
      ...a,
      referralLink: buildReferralLink(a.referralCode),
      signups: signupsMap.get(a.id) || 0,
      depositors: depositorsMap.get(a.id) || 0,
      revenueGenerated: Math.round(w.revenue * 100) / 100,
      commissionEarned: Math.round(w.commission * 100) / 100,
      totalPaid: withdrawalsMap.get(a.id) || 0,
    };
  });

  return ok({ rows });
});

const createSchema = z.object({
  fullName: z.string().min(2).max(60),
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  commissionPct: z.number().min(0).max(90),
  platformName: z.string().max(40).optional(),
  status: z.enum(["active", "suspended", "pending"]).default("active"),
});

export const POST = withErrors(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json();
  const data = parseZod(createSchema, body);

  const dupEmail = await db.affiliate.findUnique({ where: { email: data.email.toLowerCase() } });
  if (dupEmail) return badRequest("Email already in use");
  const dupUsername = await db.affiliate.findUnique({ where: { username: data.username.toLowerCase() } });
  if (dupUsername) return badRequest("Username already in use");

  const referralCode = await generateReferralCode(data.fullName);
  const passwordHash = await hashPassword(data.password);

  const aff = await db.affiliate.create({
    data: {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      username: data.username.toLowerCase(),
      passwordHash,
      referralCode,
      commissionPct: data.commissionPct,
      status: data.status,
      role: "affiliate",
      emailVerified: true,
      platformName: data.platformName || null,
    },
  });

  return ok({
    affiliate: {
      ...aff,
      referralLink: buildReferralLink(aff.referralCode),
    },
  });
});
