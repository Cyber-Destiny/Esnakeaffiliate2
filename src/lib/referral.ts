import { db } from "./db";

/**
 * Generate a unique, human-friendly referral code from a name.
 * Strategy: uppercase, letters only, take first 6 chars of the cleaned name.
 * If taken, append an incrementing number until unique.
 */
export async function generateReferralCode(name: string): Promise<string> {
  const base = (name || "AFFILIATE")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 8) || "AFFILIATE";

  let candidate = base;
  let suffix = 1;
   
  while (true) {
    const existing = await db.affiliate.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base.slice(0, 6)}${suffix}`;
    suffix += 1;
    if (suffix > 9999) {
      candidate = `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      return candidate;
    }
  }
}

export function buildReferralLink(referralCode: string): string {
  return `https://ensnake.com?ref=${encodeURIComponent(referralCode)}`;
}
