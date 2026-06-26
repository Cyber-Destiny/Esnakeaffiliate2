import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

export const POST = withErrors(async () => {
  const aff = await requireAffiliate();
  await db.notification.updateMany({
    where: { affiliateId: aff.id, read: false },
    data: { read: true },
  });
  return ok({ success: true });
});
