"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Banknote, Clock, CheckCircle2, PiggyBank, Wallet } from "lucide-react";
import { useWithdrawals, useOverviewStats } from "@/hooks/use-affiliate-data";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiPost, ApiError } from "@/lib/fetcher";
import { formatCurrency, formatDate } from "@/lib/format";

function maskAccount(num: string): string {
  if (!num) return "—";
  if (num.length <= 4) return `****${num}`;
  return `****${num.slice(-4)}`;
}

export function WithdrawalsPanel() {
  const { data: withdrawals, loading, refresh } = useWithdrawals();
  const { data: stats, refresh: refreshStats } = useOverviewStats();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const available = stats?.availableBalance ?? 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > available) {
      toast.error(`Amount exceeds available balance (${formatCurrency(available)})`);
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/affiliate/withdrawals", {
        amount,
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        accountName: form.accountName.trim(),
      });
      toast.success("Withdrawal requested", {
        description: `${formatCurrency(amount)} to ${form.bankName.trim()}`,
      });
      setForm({ amount: "", bankName: "", accountNumber: "", accountName: "" });
      setOpen(false);
      await Promise.all([refresh(), refreshStats()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to request withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdrawals"
        description="Request payouts and track the status of every withdrawal."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-neon text-primary-foreground hover:bg-neon/90">
                <Plus className="h-4 w-4" /> Request withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a withdrawal</DialogTitle>
                <DialogDescription>
                  Funds will be sent to the bank account below after admin approval.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <span className="text-xs text-muted-foreground">
                      Available: <span className="text-neon font-medium">{formatCurrency(available)}</span>
                    </span>
                  </div>
                  <Input
                    id="amount"
                    inputMode="numeric"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g. Access Bank"
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account number</Label>
                    <Input
                      id="accountNumber"
                      inputMode="numeric"
                      placeholder="0123456789"
                      value={form.accountNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          accountNumber: e.target.value.replace(/[^0-9]/g, ""),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account name</Label>
                    <Input
                      id="accountName"
                      placeholder="Account holder"
                      value={form.accountName}
                      onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-neon text-primary-foreground hover:bg-neon/90">
                    {submitting ? "Submitting…" : "Request payout"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Balance summary */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <BalanceTile
          label="Available Balance"
          value={stats ? formatCurrency(stats.availableBalance) : null}
          icon={<PiggyBank className="h-5 w-5" />}
          accent="neon"
          loading={!stats}
        />
        <BalanceTile
          label="Pending Withdrawals"
          value={stats ? formatCurrency(stats.pendingWithdrawals) : null}
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
          loading={!stats}
        />
        <BalanceTile
          label="Total Paid"
          value={stats ? formatCurrency(stats.totalPaid) : null}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="default"
          loading={!stats}
        />
      </section>

      <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Transaction ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full max-w-[120px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !withdrawals || withdrawals.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                      <Wallet className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No withdrawals yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Once you request a payout it will appear here.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((w) => (
                <TableRow key={w.id} className="text-sm">
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(w.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{w.bankName}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{maskAccount(w.accountNumber)}</TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(w.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {w.transactionId ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BalanceTile({
  label,
  value,
  icon,
  accent,
  loading,
}: {
  label: string;
  value: string | null;
  icon: React.ReactNode;
  accent: "neon" | "amber" | "default";
  loading?: boolean;
}) {
  const cls: Record<string, string> = {
    neon: "border-neon/30 bg-neon/5 text-neon neon-glow-sm",
    amber: "border-amber-400/30 bg-amber-400/5 text-amber-400",
    default: "border-border/60 bg-card/50 text-foreground",
  };
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${cls[accent]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-background/50">{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-32" />
      ) : (
        <p className="mt-3 text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      )}
    </div>
  );
}
