"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MousePointerClick,
  UserPlus,
  Users,
  Coins,
  TrendingUp,
  Banknote,
  PiggyBank,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useOverviewStats, useDailyStats } from "@/hooks/use-affiliate-data";
import { StatCard } from "@/components/shared/stat-card";
import { AreaTrend, ChartCard } from "@/components/shared/charts";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/format";

export function OverviewPanel() {
  const affiliate = useAuthStore((s) => s.affiliate);
  const { data: stats, loading: statsLoading } = useOverviewStats();
  const { data: daily, loading: dailyLoading } = useDailyStats(14);
  const [copied, setCopied] = useState(false);

  const last14 = useMemo(() => (daily ? daily.slice(-14) : []), [daily]);

  const referralLink =
    affiliate?.referralLink ??
    `https://ensnake.com?ref=${affiliate?.referralCode ?? ""}`;

  const copyLink = async (text: string, label = "Referral link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Dashboard"
        description={`Welcome back, ${affiliate?.fullName?.split(" ")[0] ?? "partner"} — your earnings at a glance.`}
      />

      {/* Referral link hero */}
      <section className="relative overflow-hidden rounded-2xl border border-neon/25 bg-card/60 p-5 backdrop-blur-sm sm:p-6">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-neon/40 bg-neon/10 text-neon">
                <Sparkles className="h-3 w-3" /> Your referral code
              </Badge>
              <Badge variant="outline" className="border-border bg-muted/40">
                {affiliate?.commissionPct ?? 20}% commission
              </Badge>
            </div>
            <p className="mt-3 font-mono text-3xl font-bold tracking-wider text-neon neon-text-glow sm:text-4xl">
              {affiliate?.referralCode ?? "—"}
            </p>
            <div className="mt-3 flex max-w-full items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2 pl-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:text-sm">
                {referralLink}
              </code>
              <Button
                size="sm"
                variant={copied ? "secondary" : "default"}
                onClick={() => copyLink(referralLink)}
                aria-label="Copy referral link"
                className="shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyLink(affiliate?.referralCode ?? "", "Referral code")}
              className="justify-start"
            >
              <Copy className="h-3.5 w-3.5" /> Copy code
            </Button>
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statsLoading || !stats ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Clicks"
              value={formatNumber(stats.totalClicks)}
              icon={<MousePointerClick className="h-5 w-5" />}
              accent="cyan"
            />
            <StatCard
              label="Total Signups"
              value={formatNumber(stats.totalSignups)}
              sub={`${stats.depositors} depositors`}
              icon={<UserPlus className="h-5 w-5" />}
              accent="default"
            />
            <StatCard
              label="Depositors"
              value={formatNumber(stats.depositors)}
              sub={`of ${formatNumber(stats.totalSignups)} signups`}
              icon={<Users className="h-5 w-5" />}
              accent="default"
            />
            <StatCard
              label="Total Wagered"
              value={formatCurrency(stats.totalWagered, { compact: true })}
              sub={formatCurrency(stats.totalWagered)}
              icon={<Coins className="h-5 w-5" />}
              accent="violet"
            />
            <StatCard
              label="Platform Revenue"
              value={formatCurrency(stats.platformRevenue, { compact: true })}
              sub="10% of wager volume"
              icon={<TrendingUp className="h-5 w-5" />}
              accent="amber"
              tooltip="Platform revenue is 10% of every wager placed by your referrals. Your commission is calculated on this figure, not the raw wager."
            />
            <StatCard
              label="Commission Earned"
              value={formatCurrency(stats.totalCommissionEarned, { compact: true })}
              sub={formatCurrency(stats.totalCommissionEarned)}
              icon={<Sparkles className="h-5 w-5" />}
              accent="neon"
              tooltip="Total commission earned to date. This equals your commissionPct% of platform revenue."
            />
            <StatCard
              label="Total Paid"
              value={formatCurrency(stats.totalPaid, { compact: true })}
              sub={formatCurrency(stats.totalPaid)}
              icon={<Banknote className="h-5 w-5" />}
              accent="default"
              tooltip="Total amount already disbursed to your bank account."
            />
            <StatCard
              label="Available Balance"
              value={formatCurrency(stats.availableBalance, { compact: true })}
              sub={formatCurrency(stats.availableBalance)}
              icon={<PiggyBank className="h-5 w-5" />}
              accent="neon"
              tooltip="Commission earned minus total paid minus pending withdrawals. This is the amount you can request to withdraw right now."
            />
          </>
        )}
      </section>

      {/* Commission explainer */}
      <section className="rounded-xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-neon" /> How you earn
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Commission is a percentage of platform revenue — not the total wager.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 font-mono">
              User wagers ₦1,000
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-mono text-amber-400">
              Revenue ₦100
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="rounded-lg border border-neon/30 bg-neon/10 px-3 py-1.5 font-mono text-neon neon-text-glow">
              You earn ₦20
            </span>
          </div>
        </div>
      </section>

      {/* Mini charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Daily Clicks"
          description="Referral link clicks over the last 14 days"
        >
          {dailyLoading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <AreaTrend data={last14} dataKey="clicks" label="Clicks" color="var(--neon)" />
          )}
        </ChartCard>
        <ChartCard
          title="Daily Commission"
          description="Commission earned per day (last 14 days)"
        >
          {dailyLoading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <AreaTrend
              data={last14}
              dataKey="commission"
              label="Commission"
              color="var(--neon)"
              valueFormatter={(v) => formatCurrency(v)}
            />
          )}
        </ChartCard>
      </section>
    </div>
  );
}
