"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { useDailyStats } from "@/hooks/use-affiliate-data";
import { AreaTrend, BarTrend, ChartCard } from "@/components/shared/charts";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

const NEON = "var(--neon)";
const CYAN = "oklch(0.72 0.18 185)";
const AMBER = "oklch(0.8 0.18 95)";
const VIOLET = "oklch(0.66 0.22 290)";

export function StatisticsPanel() {
  const [days, setDays] = useState(30);
  const { data: series, loading } = useDailyStats(days);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Daily breakdown of clicks, signups, deposits, wager volume, revenue and commissions."
        actions={
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[160px]" aria-label="Select date range">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Daily Clicks"
          description="Referral link clicks per day"
        >
          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <BarTrend
              data={series ?? []}
              dataKey="clicks"
              label="Clicks"
              color={NEON}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Daily Signups"
          description="New referred users per day"
        >
          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <BarTrend
              data={series ?? []}
              dataKey="signups"
              label="Signups"
              color={CYAN}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Daily Deposits"
          description="Deposit volume per day"
        >
          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <AreaTrend
              data={series ?? []}
              dataKey="deposits"
              label="Deposits"
              color={AMBER}
              valueFormatter={(v) => formatCurrency(v)}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Daily Wager Volume"
          description="Total amount wagered by your referrals per day"
        >
          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <AreaTrend
              data={series ?? []}
              dataKey="wagerVolume"
              label="Wager volume"
              color={VIOLET}
              valueFormatter={(v) => formatCurrency(v)}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Daily Revenue"
          description="Platform revenue (10% of wager) per day"
        >
          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <AreaTrend
              data={series ?? []}
              dataKey="revenue"
              label="Revenue"
              color={NEON}
              valueFormatter={(v) => formatCurrency(v)}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Daily Commissions"
          description="Your commission earned per day"
        >
          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <AreaTrend
              data={series ?? []}
              dataKey="commission"
              label="Commission"
              color={NEON}
              valueFormatter={(v) => formatCurrency(v)}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
