import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors, notFound } from "@/lib/api";

export const PATCH = withErrors(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const aff = await requireAffiliate();
  const { id } = await ctx.params;

  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif || notif.affiliateId !== aff.id) return notFound("Notification not found");

  const updated = await db.notification.update({
    where: { id },
    data: { read: true },
  });
  return ok({ notification: updated });
});
