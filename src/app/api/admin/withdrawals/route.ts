import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

export const GET = withErrors(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;

  const rows = await db.withdrawal.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: {
        select: {
          id: true,
          fullName: true,
          email: true,
          username: true,
          referralCode: true,
        },
      },
    },
    take: 200,
  });

  return ok({ rows });
});
