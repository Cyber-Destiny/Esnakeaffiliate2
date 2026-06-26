"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
  Copy,
  Users,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAdminAffiliates } from "@/hooks/use-admin-data";
import { apiPatch, apiDelete } from "@/lib/fetcher";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import type { AdminAffiliateRow, AffiliateStatus } from "@/lib/types";
import { AffiliateFormDialog } from "../affiliate-form-dialog";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

type ConfirmState =
  | { type: "suspend" | "activate" | "delete"; affiliate: AdminAffiliateRow }
  | null;

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 border-dashed border-border/60 bg-card/40 py-14">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-neon/10 text-neon">
        <Users className="h-6 w-6" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">No affiliates found</p>
        <p className="text-xs text-muted-foreground">
          Try adjusting your filters, or create your first affiliate.
        </p>
      </div>
      <Button size="sm" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Create affiliate
      </Button>
    </Card>
  );
}

export function AdminAffiliatesPanel() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminAffiliateRow | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [acting, setActing] = useState(false);

  const statusParam = status === "all" ? undefined : status;
  const { data, loading, error, refresh } = useAdminAffiliates(search, statusParam);

  // Debounce-friendly: the hook re-runs on every search keystroke. We keep it simple.
  const rows = useMemo(() => data || [], [data]);

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  async function runStatusChange(affiliate: AdminAffiliateRow, next: AffiliateStatus) {
    setActing(true);
    try {
      await apiPatch(`/api/admin/affiliates/${affiliate.id}`, { status: next });
      toast.success(
        next === "suspended"
          ? `${affiliate.fullName} suspended`
          : `${affiliate.fullName} activated`
      );
      setConfirm(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(false);
    }
  }

  async function handleDelete(affiliate: AdminAffiliateRow) {
    setActing(true);
    try {
      await apiDelete(`/api/admin/affiliates/${affiliate.id}`);
      toast.success(`${affiliate.fullName} deleted`);
      setConfirm(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete affiliate");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate Management"
        description="Create, edit and moderate every affiliate account"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create affiliate
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username or referral code…"
            className="pl-9"
            aria-label="Search affiliates"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      ) : rows.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <Card className="overflow-hidden border-border/60 bg-card/50 p-0 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="pl-4">Affiliate</TableHead>
                <TableHead>Referral code</TableHead>
                <TableHead className="text-right">Signups</TableHead>
                <TableHead className="text-right">Depositors</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} className="border-border/40">
                  {/* Affiliate */}
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neon/15 text-sm font-bold text-neon">
                        {a.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{a.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                        {a.platformName && (
                          <Badge
                            variant="outline"
                            className="mt-1 border-border/60 text-[10px] text-muted-foreground"
                          >
                            {a.platformName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Referral code */}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(a.referralCode)}
                      className="group inline-flex items-center gap-1.5 rounded-md font-mono text-xs font-medium text-foreground transition-colors hover:text-neon"
                      title="Click to copy"
                    >
                      {a.referralCode}
                      <Copy className="h-3 w-3 text-muted-foreground group-hover:text-neon" />
                    </button>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatDate(a.createdAt)}
                    </p>
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {formatNumber(a.signups)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(a.depositors)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(a.revenueGenerated, { compact: true })}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-neon">
                    {formatCurrency(a.commissionEarned, { compact: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className="border-neon/30 bg-neon/5 font-mono text-neon"
                    >
                      {a.commissionPct}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(a.totalPaid, { compact: true })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open actions for {a.fullName}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>{a.username}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setEditTarget(a)}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {a.status === "active" ? (
                          <DropdownMenuItem
                            onSelect={() => setConfirm({ type: "suspend", affiliate: a })}
                          >
                            <Ban className="h-4 w-4" /> Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => setConfirm({ type: "activate", affiliate: a })}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setConfirm({ type: "delete", affiliate: a })}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} affiliate{rows.length === 1 ? "" : "s"}
        {status !== "all" ? ` · filtered: ${status}` : ""}
        {search ? ` · matching “${search}”` : ""}.
      </p>

      {/* Create dialog */}
      <AffiliateFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refresh}
      />

      {/* Edit dialog */}
      <AffiliateFormDialog
        mode="edit"
        affiliate={editTarget}
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        onSuccess={refresh}
      />

      {/* Confirm dialog (suspend / activate / delete) */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirm?.type === "delete" && (
                <ShieldAlert className="h-5 w-5 text-rose-400" />
              )}
              {confirm?.type === "suspend"
                ? "Suspend affiliate?"
                : confirm?.type === "activate"
                ? "Activate affiliate?"
                : "Delete affiliate?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {confirm && (
                  <p>
                    You are about to{" "}
                    <span className="font-semibold text-foreground">
                      {confirm.type === "delete"
                        ? "permanently delete"
                        : confirm.type === "suspend"
                        ? "suspend"
                        : "activate"}
                    </span>{" "}
                    <span className="font-semibold text-foreground">
                      {confirm.affiliate.fullName}
                    </span>{" "}
                    ({confirm.affiliate.email}).
                  </p>
                )}
                {confirm?.type === "delete" && (
                  <p className="text-rose-400">
                    This permanently removes the account and all associated data. This action
                    cannot be undone. Admin accounts cannot be deleted.
                  </p>
                )}
                {confirm?.type === "suspend" && (
                  <p>
                    The affiliate will be signed out and unable to log in until reactivated.
                    Their referral data and earnings are preserved.
                  </p>
                )}
                {confirm?.type === "activate" && (
                  <p>The affiliate will regain full access to their dashboard.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={acting}
              className={
                confirm?.type === "activate"
                  ? "bg-neon text-neon-950 hover:bg-neon/90"
                  : confirm?.type === "delete"
                  ? "bg-rose-500 text-white hover:bg-rose-500/90"
                  : "bg-amber-400 text-amber-950 hover:bg-amber-400/90"
              }
              onClick={(e) => {
                e.preventDefault();
                if (!confirm) return;
                if (confirm.type === "delete") handleDelete(confirm.affiliate);
                else runStatusChange(confirm.affiliate, confirm.type === "suspend" ? "suspended" : "active");
              }}
            >
              {confirm?.type === "delete"
                ? "Delete"
                : confirm?.type === "suspend"
                ? "Suspend"
                : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
