"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Users, Share2 } from "lucide-react";
import { useReferredUsers } from "@/hooks/use-affiliate-data";
import { useAuthStore } from "@/store/auth-store";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency, formatDate } from "@/lib/format";

type SortKey =
  | "joinedAt"
  | "deposited"
  | "totalWagered"
  | "revenueGenerated"
  | "commissionGenerated";

const SORT_LABELS: Record<SortKey, string> = {
  joinedAt: "Join Date",
  deposited: "Deposited",
  totalWagered: "Total Wagered",
  revenueGenerated: "Revenue Generated",
  commissionGenerated: "Commission Generated",
};

export function ReferralsPanel() {
  const affiliate = useAuthStore((s) => s.affiliate);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("joinedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const pageSize = 10;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const { data, loading } = useReferredUsers({
    page,
    pageSize,
    search: debouncedSearch,
    sort,
    order,
  });

  const rows = data?.rows ?? [];
  const pagination = data?.pagination;

  const toggleOrder = () => setOrder((o) => (o === "asc" ? "desc" : "asc"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referred Users"
        description="Everyone who signed up to ENSNAKE using your referral code."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username…"
                className="w-[180px] pl-9 sm:w-[220px]"
                aria-label="Search referred users"
              />
            </div>
            <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); setPage(1); }}>
              <SelectTrigger className="w-[180px]" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleOrder}
              aria-label={`Sort ${order === "asc" ? "descending" : "ascending"}`}
            >
              {order === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[140px]">Username</TableHead>
              <TableHead className="min-w-[120px]">Join Date</TableHead>
              <TableHead className="text-right">Deposited</TableHead>
              <TableHead className="text-right">Total Wagered</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No referred users yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Share your referral link to start earning commission.
                      </p>
                    </div>
                    <code className="rounded-md border border-border bg-muted/40 px-3 py-1 font-mono text-xs text-neon">
                      {affiliate?.referralLink ?? "—"}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (affiliate?.referralLink) {
                          navigator.clipboard.writeText(affiliate.referralLink);
                        }
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5" /> Copy referral link
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.id} className="text-sm">
                  <TableCell className="font-mono font-medium">{u.username}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.joinedAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(u.deposited)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(u.totalWagered)}</TableCell>
                  <TableCell className="text-right tabular-nums text-amber-400">{formatCurrency(u.revenueGenerated)}</TableCell>
                  <TableCell className="text-right tabular-nums text-neon">{formatCurrency(u.commissionGenerated)}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{" "}
            {pagination.total.toLocaleString()} user{pagination.total === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
