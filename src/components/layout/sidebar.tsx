"use client";

import { cn } from "@/lib/utils";
import { Brand } from "@/components/shared/brand";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore, type View } from "@/store/ui-store";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Banknote,
  Wallet,
  Bell,
  UserCircle,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = { label: string; view: View; icon: React.ComponentType<{ className?: string }> };

const affiliateNav: NavItem[] = [
  { label: "Dashboard", view: "affiliate:dashboard", icon: LayoutDashboard },
  { label: "Statistics", view: "affiliate:statistics", icon: BarChart3 },
  { label: "Referrals", view: "affiliate:referrals", icon: Users },
  { label: "Withdrawals", view: "affiliate:withdrawals", icon: Banknote },
  { label: "Payout History", view: "affiliate:payouts", icon: Wallet },
  { label: "Notifications", view: "affiliate:notifications", icon: Bell },
  { label: "Profile", view: "affiliate:profile", icon: UserCircle },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", view: "admin:dashboard", icon: LayoutDashboard },
  { label: "Affiliates", view: "admin:affiliates", icon: Users },
  { label: "Withdrawals", view: "admin:withdrawals", icon: Banknote },
];

export function Sidebar() {
  const affiliate = useAuthStore((s) => s.affiliate);
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const logout = useAuthStore((s) => s.logout);

  if (!affiliate) return null;
  const isAdmin = affiliate.role === "admin";
  const nav = isAdmin ? adminNav : affiliateNav;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border/40 px-5">
        <Brand size="sm" onClick={() => setView(isAdmin ? "admin:dashboard" : "affiliate:dashboard")} />
        <button
          type="button"
          className="lg:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {isAdmin ? "Admin Portal" : "Affiliate Portal"}
        </p>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => setView(item.view)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-neon/10 text-neon"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-neon neon-glow-sm" />
                )}
                <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-neon" : "")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3">
        {!isAdmin && (
          <div className="mb-3 rounded-lg border border-neon/20 bg-neon/5 p-3">
            <p className="text-xs font-semibold text-neon">Your referral code</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wider">{affiliate.referralCode}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Earn {affiliate.commissionPct}% of platform revenue
            </p>
          </div>
        )}
        <div className="rounded-lg border border-border/50 bg-card/40 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-neon/15 text-sm font-bold text-neon">
              {affiliate.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{affiliate.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{affiliate.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground hover:text-rose-400"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60">
          <ShieldCheck className="h-3 w-3" /> Secured by ENSNAKE
        </p>
      </div>
    </div>
  );
}
