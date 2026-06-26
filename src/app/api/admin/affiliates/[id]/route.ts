import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { buildReferralLink } from "@/lib/referral";
import { ok, withErrors, parseZod, badRequest, notFound } from "@/lib/api";
import { z } from "zod";

const patchSchema = z.object({
  fullName: z.string().min(2).max(60).optional(),
  email: z.string().email().optional(),
  commissionPct: z.number().min(0).max(90).optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
  platformName: z.string().max(40).nullable().optional(),
  password: z.string().min(8).optional(),
});

export const PATCH = withErrors(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json();
  const data = parseZod(patchSchema, body);

  const existing = await db.affiliate.findUnique({ where: { id } });
  if (!existing) return notFound("Affiliate not found");

  if (data.email && data.email.toLowerCase() !== existing.email) {
    const dup = await db.affiliate.findUnique({ where: { email: data.email.toLowerCase() } });
    if (dup) return badRequest("Email already in use");
  }

  const update: Record<string, unknown> = {};
  if (data.fullName !== undefined) update.fullName = data.fullName;
  if (data.email !== undefined) update.email = data.email.toLowerCase();
  if (data.commissionPct !== undefined) update.commissionPct = data.commissionPct;
  if (data.status !== undefined) update.status = data.status;
  if (data.platformName !== undefined) update.platformName = data.platformName;
  if (data.password) update.passwordHash = await hashPassword(data.password);

  const updated = await db.affiliate.update({ where: { id }, data: update });
  return ok({
    affiliate: {
      ...updated,
      referralLink: buildReferralLink(updated.referralCode),
    },
  });
});

export const DELETE = withErrors(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const existing = await db.affiliate.findUnique({ where: { id } });
  if (!existing) return notFound("Affiliate not found");
  if (existing.role === "admin") return badRequest("Cannot delete an admin account");

  await db.affiliate.delete({ where: { id } });
  return ok({ success: true });
});
