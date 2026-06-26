import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, withErrors, parseZod, badRequest, getClientIp } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  referralCode: z.string().min(2).max(20),
});

/**
 * Records a referral link click on the main platform (esnaked.com?ref=JOSHUA).
 * This endpoint is called by the main platform's landing page when a `?ref=` param
 * is present. Attribution is also stored in a cookie on the main domain so that a
 * later signup can be tied back to the affiliate.
 */
export const POST = withErrors(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const data = parseZod(schema, body);

  const affiliate = await db.affiliate.findUnique({
    where: { referralCode: data.referralCode.toUpperCase() },
    select: { id: true, referralCode: true, status: true },
  });
  if (!affiliate) return badRequest("Invalid referral code");
  if (affiliate.status !== "active") return badRequest("Affiliate is not active");

  await db.click.create({
    data: {
      affiliateId: affiliate.id,
      referralCode: affiliate.referralCode,
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent")?.slice(0, 255) || null,
    },
  });

  return ok({ recorded: true, referralCode: affiliate.referralCode });
});
