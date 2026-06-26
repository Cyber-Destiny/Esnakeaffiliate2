import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

export const GET = withErrors(async (req: Request) => {
  const aff = await requireAffiliate();
  const url = new URL(req.url);
  const onlyUnread = url.searchParams.get("unread") === "1";

  const rows = await db.notification.findMany({
    where: { affiliateId: aff.id, ...(onlyUnread ? { read: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await db.notification.count({
    where: { affiliateId: aff.id, read: false },
  });

  return ok({ rows, unreadCount });
});
