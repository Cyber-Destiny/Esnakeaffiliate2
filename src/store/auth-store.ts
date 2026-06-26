"use client";

import { create } from "zustand";
import type { Affiliate } from "@/lib/types";
import { apiGet, apiPost } from "@/lib/fetcher";

type AuthState = {
  affiliate: Affiliate | null;
  loading: boolean; // initial hydration in progress
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<Affiliate>;
  signup: (data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    platformName?: string;
  }) => Promise<{ affiliate: Affiliate; verificationToken: string }>;
  logout: () => Promise<void>;
  setAffiliate: (a: Affiliate | null) => void;
  refreshProfile: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  affiliate: null,
  loading: true,
  error: null,
  hydrate: async () => {
    try {
      const data = await apiGet<{ affiliate: Affiliate }>("/api/auth/me");
      set({ affiliate: data.affiliate, loading: false });
    } catch {
      set({ affiliate: null, loading: false });
    }
  },
  login: async (email, password) => {
    const data = await apiPost<{ affiliate: Affiliate }>("/api/auth/login", {
      email,
      password,
    });
    set({ affiliate: data.affiliate, error: null });
    return data.affiliate;
  },
  signup: async (data) => {
    const res = await apiPost<{ affiliate: Affiliate; verificationToken: string }>(
      "/api/auth/signup",
      data
    );
    set({ affiliate: res.affiliate, error: null });
    return res;
  },
  logout: async () => {
    try {
      await apiPost("/api/auth/logout");
    } finally {
      set({ affiliate: null });
    }
  },
  setAffiliate: (a) => set({ affiliate: a }),
  refreshProfile: async () => {
    try {
      const data = await apiGet<{ affiliate: Affiliate }>("/api/auth/me");
      set({ affiliate: data.affiliate });
    } catch {
      /* ignore */
    }
  },
}));
