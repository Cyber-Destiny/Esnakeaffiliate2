"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AppShell } from "@/components/layout/app-shell";
import { ReferralCapture } from "@/components/shared/referral-capture";

export default function Home() {
  const affiliate = useAuthStore((s) => s.affiliate);
  const loading = useAuthStore((s) => s.loading);
  const hydrate = useAuthStore((s) => s.hydrate);
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Ensure the view matches the role once authenticated
  useEffect(() => {
    if (!affiliate) return;
    const isAdminView = view.startsWith("admin:");
    if (affiliate.role === "admin" && !isAdminView) {
      setView("admin:dashboard");
    } else if (affiliate.role === "affiliate" && (isAdminView || view.startsWith("auth:"))) {
      setView("affiliate:dashboard");
    }
  }, [affiliate, view, setView]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <ReferralCapture />
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
          <p className="text-sm text-muted-foreground">Loading ENSNAKE Partners...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <>
        <ReferralCapture />
        <AuthScreen />
      </>
    );
  }

  if (view.startsWith("auth:")) {
    return (
      <>
        <ReferralCapture />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <ReferralCapture />
      <AppShell />
    </>
  );
}
