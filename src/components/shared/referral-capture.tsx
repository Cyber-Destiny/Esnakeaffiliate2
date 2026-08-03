"use client";

import { useEffect, useRef } from "react";
import { apiPost } from "@/lib/fetcher";
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE_DAYS } from "@/lib/constants";

/**
 * Captures the ?ref= parameter from the URL on first visit.
 *
 * When someone clicks a referral link like https://esnaked.com/?ref=JOSHUAID:
 *  1. Records the click via POST /api/tracking/click (so the affiliate sees it)
 *  2. Stores the referral code in a cookie (365 days) for later attribution
 *  3. Cleans the URL (removes ?ref= so it's not accidentally shared onward)
 *
 * This component renders nothing — it's a side-effect only.
 */
export function ReferralCapture() {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (!ref) return;

    const referralCode = ref.toUpperCase().trim();

    // 1. Store in cookie (365 days) for attribution
    const expires = new Date();
    expires.setDate(expires.getDate() + REFERRAL_COOKIE_MAX_AGE_DAYS);
    document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(
      referralCode
    )};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure`;

    // 2. Record the click via the tracking API (fire-and-forget)
    apiPost("/api/tracking/click", { referralCode }).catch(() => {
      // Silently ignore — don't disrupt the visitor's experience
    });

    // 3. Clean the URL (remove ?ref= but keep other params)
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }, []);

  return null;
}
