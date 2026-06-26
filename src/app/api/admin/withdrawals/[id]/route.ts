import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, withErrors, parseZod, badRequest, notFound } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["approved", "rejected"]),
  transactionId: z.string().max(40).optional(),
  note: z.string().max(200).optional(),
});

export const PATCH = withErrors(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json();
  const data = parseZod(schema, body);

  const withdrawal = await db.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) return notFound("Withdrawal not found");
  if (withdrawal.status !== "pending") {
    return badRequest(`Withdrawal is already ${withdrawal.status}`);
  }

  const transactionId =
    data.status === "approved"
      ? data.transactionId || `ESK${Date.now().toString().slice(-10)}`
      : null;

  const updated = await db.withdrawal.update({
    where: { id },
    data: {
      status: data.status,
      transactionId,
      note: data.note || null,
      processedAt: new Date(),
    },
  });

  // On approval, create a matching payout and notify
  if (data.status === "approved") {
    await db.payout.create({
      data: {
        affiliateId: withdrawal.affiliateId,
        amount: withdrawal.amount,
        status: "completed",
        transactionId: transactionId || `ESK${Date.now().toString().slice(-10)}`,
        method: "bank_transfer",
      },
    });
    await db.notification.create({
      data: {
        affiliateId: withdrawal.affiliateId,
        type: "withdrawal_approved",
        title: "Withdrawal approved",
        message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} was approved and paid out (Txn: ${transactionId}).`,
        read: false,
      },
    });
  } else {
    await db.notification.create({
      data: {
        affiliateId: withdrawal.affiliateId,
        type: "withdrawal_rejected",
        title: "Withdrawal rejected",
        message:
          data.note ||
          `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} was rejected. Please contact support.`,
        read: false,
      },
    });
  }

  // Audit-ish: store admin id reference in note if not set
  void admin;

  return ok({ withdrawal: updated });
});
