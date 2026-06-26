"use client";

import { useAsync } from "./use-affiliate-data";
import { apiGet } from "@/lib/fetcher";
import type { AdminAffiliateRow, AdminOverview, Withdrawal } from "@/lib/types";

export function useAdminStats() {
  return useAsync(async () => {
    const res = await apiGet<{ overview: AdminOverview }>("/api/admin/stats");
    return res.overview;
  }, []);
}

export function useAdminAffiliates(search: string, status?: string) {
  return useAsync(async () => {
    const q = new URLSearchParams({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    });
    const res = await apiGet<{ rows: AdminAffiliateRow[] }>(
      `/api/admin/affiliates?${q.toString()}`
    );
    return res.rows;
  }, [search, status]);
}

export function useAdminWithdrawals(status?: string) {
  return useAsync(async () => {
    const q = new URLSearchParams(status ? { status } : {});
    const res = await apiGet<{ rows: Withdrawal[] }>(
      `/api/admin/withdrawals?${q.toString()}`
    );
    return res.rows;
  }, [status]);
}
