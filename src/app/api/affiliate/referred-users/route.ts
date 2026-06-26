import { db } from "@/lib/db";
import { requireAffiliate } from "@/lib/auth";
import { ok, withErrors } from "@/lib/api";

export const GET = withErrors(async (req: Request) => {
  const aff = await requireAffiliate();
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(5, Number(url.searchParams.get("pageSize") || 10)));
  const search = (url.searchParams.get("search") || "").trim();
  const sort = (url.searchParams.get("sort") || "joinedAt") as
    | "joinedAt"
    | "deposited"
    | "totalWagered"
    | "revenueGenerated"
    | "commissionGenerated";
  const order = (url.searchParams.get("order") || "desc") === "asc" ? "asc" : "desc";

  const where = {
    affiliateId: aff.id,
    ...(search
      ? {
          OR: [
            { username: { contains: search } },
            { email: { contains: search } },
            { referralCode: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.referredUser.count({ where }),
    db.referredUser.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        username: true,
        email: true,
        deposited: true,
        totalWagered: true,
        revenueGenerated: true,
        commissionGenerated: true,
        status: true,
        joinedAt: true,
      },
    }),
  ]);

  return ok({
    rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
});
