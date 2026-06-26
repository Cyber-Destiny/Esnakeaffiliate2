"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AffiliateStatus, WithdrawalStatus } from "@/lib/types";

export function StatusBadge({
  status,
  className,
}: {
  status: AffiliateStatus | WithdrawalStatus | string;
  className?: string;
}) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-neon/10 text-neon border-neon/30" },
    suspended: { label: "Suspended", cls: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
    pending: { label: "Pending", cls: "bg-amber-400/10 text-amber-400 border-amber-400/30" },
    approved: { label: "Approved", cls: "bg-neon/10 text-neon border-neon/30" },
    rejected: { label: "Rejected", cls: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
    completed: { label: "Completed", cls: "bg-neon/10 text-neon border-neon/30" },
    failed: { label: "Failed", cls: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
    dormant: { label: "Dormant", cls: "bg-muted text-muted-foreground border-border" },
  };
  const entry = map[status] || { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", entry.cls, className)}
    >
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {entry.label}
    </Badge>
  );
}
