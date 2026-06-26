"use client";

import { create } from "zustand";

export type View =
  | "auth:login"
  | "auth:signup"
  | "auth:forgot"
  | "auth:reset"
  | "auth:verify"
  | "affiliate:dashboard"
  | "affiliate:statistics"
  | "affiliate:referrals"
  | "affiliate:withdrawals"
  | "affiliate:payouts"
  | "affiliate:notifications"
  | "affiliate:profile"
  | "admin:dashboard"
  | "admin:affiliates"
  | "admin:withdrawals";

type UiState = {
  view: View;
  sidebarOpen: boolean; // mobile
  resetToken: string | null; // carried from forgot -> reset flow
  verifyEmail: string | null; // carried from signup -> verify flow
  setView: (v: View) => void;
  setSidebarOpen: (open: boolean) => void;
  startReset: (token: string) => void;
  startVerify: (email: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  view: "auth:login",
  sidebarOpen: false,
  resetToken: null,
  verifyEmail: null,
  setView: (v) => set({ view: v, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  startReset: (token) => set({ resetToken: token, view: "auth:reset" }),
  startVerify: (email) => set({ verifyEmail: email, view: "auth:verify" }),
}));
