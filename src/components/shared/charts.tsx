"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function fmtAxisDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export function AreaTrend({
  data,
  dataKey,
  color = "var(--neon)",
  label,
  valueFormatter = (v: number) => formatNumber(v),
  height = 220,
  className,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color?: string;
  label: string;
  valueFormatter?: (v: number) => string;
  height?: number | string;
  className?: string;
}) {
  const config: ChartConfig = { [dataKey]: { label, color } };
  const id = React.useId().replace(/:/g, "");
  return (
    <ChartContainer config={config} className={cn("w-full", className)} style={{ height }}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={fmtAxisDate}
          fontSize={11}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          fontSize={11}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { date?: string } | undefined;
                return p?.date ? fmtAxisDate(p.date) : "";
              }}
              formatter={(value) => valueFormatter(Number(value))}
            />
          }
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${id})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function BarTrend({
  data,
  dataKey,
  color = "var(--neon)",
  label,
  valueFormatter = (v: number) => formatNumber(v),
  height = 220,
  className,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color?: string;
  label: string;
  valueFormatter?: (v: number) => string;
  height?: number | string;
  className?: string;
}) {
  const config: ChartConfig = { [dataKey]: { label, color } };
  return (
    <ChartContainer config={config} className={cn("w-full", className)} style={{ height }}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={fmtAxisDate}
          fontSize={11}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          fontSize={11}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { date?: string } | undefined;
                return p?.date ? fmtAxisDate(p.date) : "";
              }}
              formatter={(value) => valueFormatter(Number(value))}
            />
          }
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}

export function ChartCard({
  title,
  description,
  children,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur-sm sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export { formatCurrency };
