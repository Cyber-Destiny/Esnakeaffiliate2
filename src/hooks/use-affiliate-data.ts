"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/fetcher";
import type {
  Affiliate,
  AppNotification,
  DailyPoint,
  OverviewStats,
  Payout,
  ReferredUser,
  Withdrawal,
} from "@/lib/types";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
     
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, refresh: run };
}

export function useOverviewStats() {
  return useAsync(async () => {
    const res = await apiGet<{ overview: OverviewStats }>("/api/affiliate/stats");
    return res.overview;
  }, []);
}

export function useDailyStats(days = 30) {
  return useAsync(async () => {
    const res = await apiGet<{ series: DailyPoint[] }>(
      `/api/affiliate/stats/daily?days=${days}`
    );
    return res.series;
  }, [days]);
}

export function useReferredUsers(params: {
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  order: "asc" | "desc";
}) {
  const { page, pageSize, search, sort, order } = params;
  return useAsync(async () => {
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      order,
      ...(search ? { search } : {}),
    });
    const res = await apiGet<{
      rows: ReferredUser[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/api/affiliate/referred-users?${q.toString()}`);
    return res;
  }, [page, pageSize, search, sort, order]);
}

export function useWithdrawals() {
  return useAsync(async () => {
    const res = await apiGet<{ rows: Withdrawal[] }>("/api/affiliate/withdrawals");
    return res.rows;
  }, []);
}

export function usePayouts() {
  return useAsync(async () => {
    const res = await apiGet<{ rows: Payout[] }>("/api/affiliate/payouts");
    return res.rows;
  }, []);
}

export function useNotifications() {
  return useAsync(async () => {
    const res = await apiGet<{ rows: AppNotification[]; unreadCount: number }>(
      "/api/affiliate/notifications"
    );
    return res;
  }, []);
}

export function useProfile() {
  return useAsync(async () => {
    const res = await apiGet<{ affiliate: Affiliate }>("/api/affiliate/profile");
    return res.affiliate;
  }, []);
}
