"use client";

import { Brand } from "@/components/shared/brand";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  const setView = useUiStore((s) => s.setView);
  const affiliate = useAuthStore((s) => s.affiliate);
  const isAdmin = affiliate?.role === "admin";
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Brand size="sm" onClick={() => setView(isAdmin ? "admin:dashboard" : "affiliate:dashboard")} />
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Affiliate &amp; Creator Platform</span>
        </div>
        <div className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} ENSNAKE</span>
          <span className="hidden h-3 w-px bg-border sm:inline" />
          <a href="https://esnaked.com" className="hidden hover:text-neon sm:inline">esnaked.com</a>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-neon" /> v1.0
          </span>
        </div>
      </div>
    </footer>
  );
}
