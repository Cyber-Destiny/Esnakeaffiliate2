// ENSNAKE platform-wide constants

// Platform fee applied to every wager. Platform Revenue = PLATFORM_FEE_PCT% of wager.
// Example: user wagers ₦1000 -> platform revenue = ₦100
export const PLATFORM_FEE_PCT = 10;

// Default commission percentage an affiliate earns of platform revenue.
// Example: platform revenue ₦100, commission 20% -> affiliate earns ₦20
export const DEFAULT_COMMISSION_PCT = 20;

// Cookie used for referral attribution on the main platform (ensnake.com)
export const REFERRAL_COOKIE_NAME = "ensnake_ref";
export const REFERRAL_COOKIE_MAX_AGE_DAYS = 365;

// Auth
export const AUTH_COOKIE_NAME = "ensnake_affiliate_token";
export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
export const JWT_ISSUER = "ensnake-affiliate";
export const JWT_AUDIENCE = "ensnake-affiliate-users";

// Platform brand
export const PLATFORM_DOMAIN = "ensnake.com";
export const PLATFORM_URL = "https://ensnake.com";

// Currency
export const CURRENCY_CODE = "NGN";
export const CURRENCY_SYMBOL = "₦";

// Emails that are automatically promoted to admin role on signup (case-insensitive).
export const ADMIN_SIGNUP_EMAILS = ["support@esnaked.com"];

export function isAdminSignupEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return ADMIN_SIGNUP_EMAILS.some((e) => e.toLowerCase() === lower);
}
