import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { buildReferralLink } from "@/lib/referral";
import { ok, withErrors, parseZod, badRequest } from "@/lib/api";
import { z } from "zod";

export const GET = withErrors(async () => {
  const aff = await requireAffiliate();
  return ok({
    affiliate: {
      id: aff.id,
      fullName: aff.fullName,
      email: aff.email,
      username: aff.username,
      referralCode: aff.referralCode,
      referralLink: buildReferralLink(aff.referralCode),
      commissionPct: aff.commissionPct,
      status: aff.status,
      role: aff.role,
      emailVerified: aff.emailVerified,
      platformName: aff.platformName,
      bio: aff.bio,
      phone: aff.phone,
      avatarUrl: aff.avatarUrl,
      createdAt: aff.createdAt,
    },
  });
});

const patchSchema = z.object({
  fullName: z.string().min(2).max(60).optional(),
  platformName: z.string().max(40).nullable().optional(),
  bio: z.string().max(280).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
});

export const PATCH = withErrors(async (req: NextRequest) => {
  const aff = await requireAffiliate();
  const body = await req.json();
  const data = parseZod(patchSchema, body);

  const updated = await db.affiliate.update({
    where: { id: aff.id },
    data: {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.platformName !== undefined ? { platformName: data.platformName } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    },
  });

  return ok({
    affiliate: {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      username: updated.username,
      referralCode: updated.referralCode,
      referralLink: buildReferralLink(updated.referralCode),
      commissionPct: updated.commissionPct,
      status: updated.status,
      role: updated.role,
      emailVerified: updated.emailVerified,
      platformName: updated.platformName,
      bio: updated.bio,
      phone: updated.phone,
    },
  });
});
