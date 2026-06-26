import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

export const GET = withErrors(async () => {
  const aff = await requireAffiliate();
  const rows = await db.payout.findMany({
    where: { affiliateId: aff.id },
    orderBy: { createdAt: "desc" },
  });
  return ok({ rows });
});
