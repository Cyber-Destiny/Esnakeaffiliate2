import { PLATFORM_FEE_PCT } from "./constants";

/**
 * Platform revenue = PLATFORM_FEE_PCT% of the wager amount.
 * Example: wager ₦1000, fee 10% -> platform revenue ₦100
 */
export function calculatePlatformRevenue(wager: number): number {
  if (wager <= 0) return 0;
  return round2((wager * PLATFORM_FEE_PCT) / 100);
}

/**
 * Affiliate commission = commissionPct% of platform revenue.
 * Example: platform revenue ₦100, commission 20% -> ₦20
 */
export function calculateCommission(
  platformRevenue: number,
  commissionPct: number
): number {
  if (platformRevenue <= 0 || commissionPct <= 0) return 0;
  return round2((platformRevenue * commissionPct) / 100);
}

/** Compute both platform revenue and commission for a wager in one pass. */
export function computeWagerEconomics(wager: number, commissionPct: number) {
  const platformRevenue = calculatePlatformRevenue(wager);
  const commission = calculateCommission(platformRevenue, commissionPct);
  return { platformRevenue, commission };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
