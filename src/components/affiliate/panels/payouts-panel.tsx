"use client";

import { Wallet, Hash, Banknote, CalendarDays, CheckCircle2 } from "lucide-react";
import { usePayouts } from "@/hooks/use-affiliate-data";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payout } from "@/lib/types";

export function PayoutsPanel() {
  const { data: payouts, loading } = usePayouts();
  const rows: Payout[] = payouts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout History"
        description="Every commission disbursement paid out to your bank account."
      />

      <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                      <Wallet className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No payouts yet</p>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Approved withdrawals will be recorded here as payouts.
                        Request a withdrawal from the Withdrawals page to get
                        paid your earned commission.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id} className="text-sm">
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold tabular-nums text-neon">
                        {formatCurrency(p.amount)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Banknote className="h-3 w-3" />
                        {p.method ?? "bank-transfer"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 opacity-60" />
                      {formatDate(p.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status ?? "completed"} />
                  </TableCell>
                  <TableCell>
                    {p.transactionId ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-xs text-foreground">
                        <Hash className="h-3 w-3 text-neon" />
                        {p.transactionId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {p.method ?? "bank-transfer"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && rows.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-neon" />
          Showing {rows.length} payout{rows.length === 1 ? "" : "s"} — most
          recent first.
        </p>
      )}
    </div>
  );
}
