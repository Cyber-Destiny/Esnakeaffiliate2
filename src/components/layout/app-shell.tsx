"use client";

import { useUiStore } from "@/store/ui-store";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { Sidebar } from "./sidebar";
import { AffiliateDashboard } from "@/components/affiliate/affiliate-dashboard";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

const TITLES: Record<string, string> = {
  "affiliate:dashboard": "Dashboard",
  "affiliate:statistics": "Statistics",
  "affiliate:referrals": "Referred Users",
  "affiliate:withdrawals": "Withdrawals",
  "affiliate:payouts": "Payout History",
  "affiliate:notifications": "Notifications",
  "affiliate:profile": "Profile & Referral Link",
  "admin:dashboard": "Admin Dashboard",
  "admin:affiliates": "Affiliate Management",
  "admin:withdrawals": "Withdrawal Requests",
};

export function AppShell() {
  const view = useUiStore((s) => s.view);
  const title = TITLES[view] || "Dashboard";
  const isAdmin = view.startsWith("admin:");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/40 bg-card/20 lg:block">
          <Sidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              {isAdmin ? <AdminDashboard /> : <AffiliateDashboard />}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
