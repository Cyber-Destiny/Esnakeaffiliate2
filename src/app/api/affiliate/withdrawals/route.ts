import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors, parseZod, badRequest } from "@/lib/api";
import { z } from "zod";

export const GET = withErrors(async () => {
  const aff = await requireAffiliate();
  const rows = await db.withdrawal.findMany({
    where: { affiliateId: aff.id },
    orderBy: { createdAt: "desc" },
  });
  return ok({ rows });
});

const createSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  bankName: z.string().min(2, "Bank name is required").max(60),
  accountNumber: z
    .string()
    .min(6, "Account number is too short")
    .max(20)
    .regex(/^[0-9]+$/, "Account number must be digits only"),
  accountName: z.string().min(3, "Account name is required").max(80),
});

export const POST = withErrors(async (req: NextRequest) => {
  const aff = await requireAffiliate();
  const body = await req.json();
  const data = parseZod(createSchema, body);

  // Compute available balance
  const earnedAgg = await db.wager.aggregate({
    where: { referredUser: { affiliateId: aff.id } },
    _sum: { commission: true },
  });
  const paidAgg = await db.payout.aggregate({
    where: { affiliateId: aff.id },
    _sum: { amount: true },
  });
  const pendingAgg = await db.withdrawal.aggregate({
    where: { affiliateId: aff.id, status: { in: ["pending", "approved"] } },
    _sum: { amount: true },
  });
  const earned = earnedAgg._sum.commission || 0;
  const paid = paidAgg._sum.amount || 0;
  const inFlight = pendingAgg._sum.amount || 0;
  const available = Math.max(0, earned - paid - inFlight);

  if (data.amount > available) {
    return badRequest(
      `Requested amount exceeds your available balance (₦${available.toLocaleString()}).`
    );
  }

  // Prevent duplicate pending withdrawal flood (one pending at a time is fine,
  // but block identical amount+account within 60s to reduce fraud)
  const recent = await db.withdrawal.findFirst({
    where: {
      affiliateId: aff.id,
      amount: data.amount,
      accountNumber: data.accountNumber,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  });
  if (recent) return badRequest("A similar withdrawal was just requested. Please wait.");

  const withdrawal = await db.withdrawal.create({
    data: {
      affiliateId: aff.id,
      amount: data.amount,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      status: "pending",
    },
  });

  await db.notification.create({
    data: {
      affiliateId: aff.id,
      type: "withdrawal_requested",
      title: "Withdrawal requested",
      message: `Your withdrawal request of ₦${data.amount.toLocaleString()} to ${data.bankName} is pending admin approval.`,
      read: false,
    },
  });

  return ok({ withdrawal });
});
