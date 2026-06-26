"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "default",
  tooltip,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "default" | "neon" | "amber" | "violet" | "cyan" | "rose";
  tooltip?: string;
  className?: string;
}) {
  const accentRing: Record<string, string> = {
    default: "hover:border-border",
    neon: "hover:border-neon/50 neon-glow-sm",
    amber: "hover:border-amber-400/50",
    violet: "hover:border-violet-400/50",
    cyan: "hover:border-cyan-400/50",
    rose: "hover:border-rose-400/50",
  };
  const iconBg: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    neon: "bg-neon/10 text-neon",
    amber: "bg-amber-400/10 text-amber-400",
    violet: "bg-violet-400/10 text-violet-400",
    cyan: "bg-cyan-400/10 text-cyan-400",
    rose: "bg-rose-400/10 text-rose-400",
  };
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-colors py-0",
        accentRing[accent],
        className
      )}
    >
      <div className="flex items-start justify-between p-4 sm:p-5 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/60 hover:text-foreground">
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[220px] text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight sm:text-2xl tabular-nums truncate">
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
              iconBg[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
