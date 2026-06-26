import { ok, withErrors, unauthorized } from "@/lib/api";
import { getCurrentAffiliate } from "@/lib/auth";
import { buildReferralLink } from "@/lib/referral";

export const GET = withErrors(async () => {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) return unauthorized("Not authenticated");

  return ok({
    affiliate: {
      id: affiliate.id,
      fullName: affiliate.fullName,
      email: affiliate.email,
      username: affiliate.username,
      referralCode: affiliate.referralCode,
      referralLink: buildReferralLink(affiliate.referralCode),
      commissionPct: affiliate.commissionPct,
      status: affiliate.status,
      role: affiliate.role,
      emailVerified: affiliate.emailVerified,
      platformName: affiliate.platformName,
      bio: affiliate.bio,
      phone: affiliate.phone,
      avatarUrl: affiliate.avatarUrl,
      createdAt: affiliate.createdAt,
    },
  });
});
