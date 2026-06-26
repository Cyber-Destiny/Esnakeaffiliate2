import { CURRENCY_SYMBOL } from "./constants";

/** Format a number as NGN currency, e.g. ₦1,250,000.00 */
export function formatCurrency(amount: number, opts?: { compact?: boolean }): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (opts?.compact) {
    return `${CURRENCY_SYMBOL}${formatCompact(safe)}`;
  }
  return `${CURRENCY_SYMBOL}${safe.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact number, e.g. 1.2K, 3.4M */
export function formatCompact(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  if (Math.abs(safe) >= 1_000_000_000) return `${(safe / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(safe) >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}M`;
  if (Math.abs(safe) >= 1_000) return `${(safe / 1_000).toFixed(1)}K`;
  return `${safe}`;
}

export function formatNumber(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("en-NG");
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string | number): string {
  const d = new Date(date).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
