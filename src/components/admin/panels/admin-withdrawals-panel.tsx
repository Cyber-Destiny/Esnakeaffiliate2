"use client";

import { useState } from "react";
import {
  Banknote,
  Check,
  X,
  Clock,
  RefreshCw,
  Bell,
  Hash,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAdminWithdrawals, useAdminStats } from "@/hooks/use-admin-data";
import { apiPatch } from "@/lib/fetcher";
import { formatCurrency, formatDateTime, timeAgo } from "@/lib/format";
import type { Withdrawal } from "@/lib/types";

function maskAccount(num: string): string {
  if (!num) return "—";
  const last4 = num.slice(-4);
  return `••••${last4}`;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed border-border/60 bg-card/40 py-14">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Banknote className="h-6 w-6" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">No withdrawals here</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </Card>
  );
}

export function AdminWithdrawalsPanel() {
  const [tab, setTab] = useState("all");
  const [approveTarget, setApproveTarget] = useState<Withdrawal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null);
  const [txnId, setTxnId] = useState("");
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const statusParam = tab === "all" ? undefined : tab;
  const { data: rows, loading, error, refresh } = useAdminWithdrawals(statusParam);
  const { data: overview } = useAdminStats();

  function openApprove(w: Withdrawal) {
    setApproveTarget(w);
    setTxnId("");
  }
  function openReject(w: Withdrawal) {
    setRejectTarget(w);
    setNote("");
  }

  async function submitApprove() {
    if (!approveTarget) return;
    setActing(true);
    try {
      await apiPatch(`/api/admin/withdrawals/${approveTarget.id}`, {
        status: "approved",
        transactionId: txnId.trim() || undefined,
      });
      toast.success("Withdrawal approved — payout recorded & affiliate notified");
      setApproveTarget(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve withdrawal");
    } finally {
      setActing(false);
    }
  }

  async function submitReject() {
    if (!rejectTarget) return;
    setActing(true);
    try {
      await apiPatch(`/api/admin/withdrawals/${rejectTarget.id}`, {
        status: "rejected",
        note: note.trim() || undefined,
      });
      toast.success("Withdrawal rejected — affiliate notified");
      setRejectTarget(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject withdrawal");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdrawal Requests"
        description="Review and process affiliate payout requests"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending requests"
          value={overview ? String(overview.pendingWithdrawalsCount) : "—"}
          sub="Awaiting your review"
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Pending value"
          value={overview ? formatCurrency(overview.pendingWithdrawalsAmount) : "—"}
          sub="Total to be disbursed"
          icon={<Banknote className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Total paid out"
          value={overview ? formatCurrency(overview.totalPaid) : "—"}
          sub="Settled lifetime"
          icon={<Check className="h-5 w-5" />}
          accent="neon"
        />
      </div>

      {/* Notification awareness banner */}
      <Card className="border-neon/20 bg-neon/5 p-3 sm:p-4">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 shrink-0 text-neon" />
          <p className="text-muted-foreground">
            Approving or rejecting a request automatically notifies the affiliate and
            {` `}
            <span className="text-foreground">records a payout</span> on approval.
          </p>
        </div>
      </Card>

      {/* Filter tabs + refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      {error && (
        <Card className="border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-400">
          {error}
        </Card>
      )}

      {loading ? (
        <TableSkeleton />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          message={
            tab === "all"
              ? "No withdrawal requests have been made yet."
              : `No ${tab} withdrawals at the moment.`
          }
        />
      ) : (
        <Card className="overflow-hidden border-border/60 bg-card/50 p-0 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="pl-4">Affiliate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((w) => (
                <TableRow key={w.id} className="border-border/40">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neon/15 text-sm font-bold text-neon">
                        {w.affiliate?.fullName.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {w.affiliate?.fullName || "Unknown"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{w.affiliate?.username || "—"} ·{" "}
                          <span className="font-mono">{w.affiliate?.referralCode}</span>
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="text-sm font-bold tabular-nums text-neon">
                      {formatCurrency(w.amount)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{w.bankName || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <p className="font-mono text-sm">{maskAccount(w.accountNumber)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {w.accountName}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm" title={formatDateTime(w.createdAt)}>
                      {timeAgo(w.createdAt)}
                    </p>
                    {w.processedAt && (
                      <p className="text-[11px] text-muted-foreground">
                        processed {timeAgo(w.processedAt)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={w.status} />
                    {w.note && w.status === "rejected" && (
                      <p
                        className="mt-1 max-w-[180px] truncate text-[11px] text-rose-400"
                        title={w.note}
                      >
                        “{w.note}”
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {w.transactionId ? (
                      <Badge
                        variant="outline"
                        className="border-neon/30 bg-neon/5 font-mono text-[11px] text-neon"
                      >
                        <Hash className="h-3 w-3" />
                        {w.transactionId}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4">
                    {w.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-neon text-neon-950 hover:bg-neon/90"
                          onClick={() => openApprove(w)}
                        >
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                          onClick={() => openReject(w)}
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Settled</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!loading && rows && rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {rows.length} request{rows.length === 1 ? "" : "s"}
          {tab !== "all" ? ` · filtered: ${tab}` : ""}.
        </p>
      )}

      {/* Approve dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-neon" /> Approve withdrawal
            </DialogTitle>
            <DialogDescription>
              Confirm the payout for{" "}
              <span className="font-semibold text-foreground">
                {approveTarget?.affiliate?.fullName}
              </span>
              . A payout record and notification will be created automatically.
            </DialogDescription>
          </DialogHeader>

          {approveTarget && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-neon">
                  {formatCurrency(approveTarget.amount)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-mono text-xs">
                  {approveTarget.bankName} · {maskAccount(approveTarget.accountNumber)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Account name</span>
                <span className="text-xs">{approveTarget.accountName}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="txn-id">Transaction ID (optional)</Label>
            <Input
              id="txn-id"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Enter the bank reference if you have one — otherwise the system generates one
              automatically.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveTarget(null)}
              disabled={acting}
            >
              Cancel
            </Button>
            <Button
              className="bg-neon text-neon-950 hover:bg-neon/90"
              onClick={submitApprove}
              disabled={acting}
            >
              {acting ? "Processing…" : "Confirm & approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-rose-400" /> Reject withdrawal
            </DialogTitle>
            <DialogDescription>
              Reject the request from{" "}
              <span className="font-semibold text-foreground">
                {rejectTarget?.affiliate?.fullName}
              </span>
              . The affiliate will be notified with your note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-note">Reason / note (optional)</Label>
            <Textarea
              id="reject-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Bank details could not be verified. Please update and resubmit."
              maxLength={200}
            />
            <p className="text-[11px] text-muted-foreground">
              If left blank, a generic rejection notice is sent.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={acting}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-500 text-white hover:bg-rose-500/90"
              onClick={submitReject}
              disabled={acting}
            >
              {acting ? "Processing…" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
