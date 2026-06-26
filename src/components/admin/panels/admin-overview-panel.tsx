"use client";

import {
  Users,
  UserCheck,
  Banknote,
  Dice5,
  TrendingUp,
  Percent,
  Wallet,
  Clock,
  ArrowRight,
  AlertTriangle,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartCard } from "@/components/shared/charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useUiStore } from "@/store/ui-store";
import { useAdminStats, useAdminAffiliates } from "@/hooks/use-admin-data";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { AdminAffiliateRow } from "@/lib/types";

function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="border-border/60 bg-card/50 p-4 py-0">
          <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="w-full space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TopAffiliatesList({ rows }: { rows: AdminAffiliateRow[] }) {
  const top = [...rows]
    .sort((a, b) => b.commissionEarned - a.commissionEarned)
    .slice(0, 6);
  const max = top.length ? Math.max(...top.map((r) => r.commissionEarned), 1) : 1;

  if (!top.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <Trophy className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No affiliates yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {top.map((a, i) => {
        const pct = Math.max(4, Math.round((a.commissionEarned / max) * 100));
        return (
          <div key={a.id} className="flex items-center gap-3">
            <div className="flex w-6 shrink-0 items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
            </div>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neon/15 text-xs font-bold text-neon">
              {a.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{a.fullName}</p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-neon">
                  {formatCurrency(a.commissionEarned)}
                </p>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gradient-neon neon-glow-sm transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">{a.referralCode}</span>
                <span>·</span>
                <span>{formatNumber(a.signups)} signups</span>
                <span>·</span>
                <span>{a.commissionPct}% rate</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminOverviewPanel() {
  const setView = useUiStore((s) => s.setView);
  const { data: overview, loading, error, refresh } = useAdminStats();
  const { data: affiliates, loading: affLoading } = useAdminAffiliates("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Platform-wide affiliate analytics and performance"
        actions={
          <Button onClick={() => setView("admin:affiliates")} variant="outline">
            <Users className="h-4 w-4" /> Manage affiliates
          </Button>
        }
      />

      {error && (
        <Card className="border-rose-500/30 bg-rose-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <StatGridSkeleton />
      ) : overview ? (
        <>
          {/* Pending withdrawals alert */}
          {overview.pendingWithdrawalsCount > 0 && (
            <Card className="border-amber-400/30 bg-amber-400/5 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-400/15 text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-400">
                      {overview.pendingWithdrawalsCount} withdrawal
                      {overview.pendingWithdrawalsCount === 1 ? "" : "s"} awaiting review
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total value{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(overview.pendingWithdrawalsAmount)}
                      </span>{" "}
                      — affiliates are notified once you approve.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setView("admin:withdrawals")}
                  className="shrink-0 bg-amber-400 text-amber-950 hover:bg-amber-400/90"
                >
                  Review now <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <StatCard
              label="Total Affiliates"
              value={formatNumber(overview.totalAffiliates)}
              sub={`${overview.activeAffiliates} active · ${overview.suspendedAffiliates} suspended`}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Total Signups"
              value={formatNumber(overview.totalSignups)}
              sub="Referred users"
              icon={<UserCheck className="h-5 w-5" />}
              accent="cyan"
            />
            <StatCard
              label="Total Deposits"
              value={formatCurrency(overview.totalDeposits)}
              sub="Sum of referred-user deposits"
              icon={<Banknote className="h-5 w-5" />}
              accent="violet"
              tooltip="Sum of every deposit made by users referred through the affiliate programme."
            />
            <StatCard
              label="Total Wagered"
              value={formatCurrency(overview.totalWagered)}
              sub="Gross wager volume"
              icon={<Dice5 className="h-5 w-5" />}
              tooltip="Total amount wagered by all referred users across the platform."
            />
            <StatCard
              label="Platform Revenue"
              value={formatCurrency(overview.totalPlatformRevenue)}
              sub="10% of total wagered"
              icon={<TrendingUp className="h-5 w-5" />}
              accent="neon"
              tooltip="Platform keeps 10% of every wager. This is the pool commissions are paid from."
            />
            <StatCard
              label="Commissions Earned"
              value={formatCurrency(overview.totalCommissionsEarned)}
              sub="Paid to affiliates"
              icon={<Percent className="h-5 w-5" />}
              accent="neon"
              tooltip="Sum of every commission accrued across all affiliates (commissionPct × platform revenue)."
            />
            <StatCard
              label="Total Paid"
              value={formatCurrency(overview.totalPaid)}
              sub="Settled payouts"
              icon={<Wallet className="h-5 w-5" />}
              accent="cyan"
              tooltip="Sum of all approved withdrawal payouts to affiliates."
            />
            <StatCard
              label="Commissions Owed"
              value={formatCurrency(overview.totalCommissionsOwed)}
              sub="Earned − paid"
              icon={<Wallet className="h-5 w-5" />}
              accent="amber"
              tooltip="Outstanding commission balance not yet requested or paid out."
            />
            <StatCard
              label="Pending Withdrawals"
              value={formatNumber(overview.pendingWithdrawalsCount)}
              sub={formatCurrency(overview.pendingWithdrawalsAmount)}
              icon={<Clock className="h-5 w-5" />}
              accent="amber"
              tooltip="Withdrawal requests submitted by affiliates awaiting admin approval."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              title="Top affiliates by commission"
              description="Highest earners across the platform"
              className="lg:col-span-2"
            >
              {affLoading ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <TopAffiliatesList rows={affiliates || []} />
              )}
            </ChartCard>

            <ChartCard
              title="Revenue split"
              description="How the wager pool is divided"
            >
              <RevenueSplit
                platformRevenue={overview.totalPlatformRevenue}
                commissions={overview.totalCommissionsEarned}
                paid={overview.totalPaid}
              />
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

function RevenueSplit({
  platformRevenue,
  commissions,
  paid,
}: {
  platformRevenue: number;
  commissions: number;
  paid: number;
}) {
  const total = Math.max(platformRevenue + commissions, 1);
  // Visualise: platform keeps (revenue - commissions), affiliates earn commissions (paid + owed).
  const platformKeep = Math.max(platformRevenue - commissions, 0);
  const affiliatePaid = paid;
  const affiliateOwed = Math.max(commissions - paid, 0);

  const segments = [
    {
      label: "Platform share",
      value: platformKeep,
      cls: "bg-violet-400/70",
      text: "text-violet-300",
    },
    {
      label: "Paid to affiliates",
      value: affiliatePaid,
      cls: "bg-neon",
      text: "text-neon",
    },
    {
      label: "Owed to affiliates",
      value: affiliateOwed,
      cls: "bg-amber-400/80",
      text: "text-amber-300",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) => {
          const w = Math.round((s.value / total) * 100);
          if (w <= 0) return null;
          return (
            <div
              key={s.label}
              className={`${s.cls} h-full transition-all`}
              style={{ width: `${w}%` }}
              title={`${s.label}: ${formatCurrency(s.value)}`}
            />
          );
        })}
      </div>
      <ul className="space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-sm ${s.cls}`} />
              <span className="text-muted-foreground">{s.label}</span>
            </span>
            <span className={`font-semibold tabular-nums ${s.text}`}>
              {formatCurrency(s.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
