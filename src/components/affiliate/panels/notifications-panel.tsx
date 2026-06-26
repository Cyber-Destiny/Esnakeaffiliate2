"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  UserPlus,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  BellOff,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-affiliate-data";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiPost, apiPatch, ApiError } from "@/lib/fetcher";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/types";

const ICONS: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  signup: { icon: UserPlus, cls: "bg-cyan-400/10 text-cyan-400" },
  deposit: { icon: Wallet, cls: "bg-amber-400/10 text-amber-400" },
  withdrawal_requested: { icon: Clock, cls: "bg-amber-400/10 text-amber-400" },
  withdrawal_approved: { icon: CheckCircle, cls: "bg-neon/10 text-neon" },
  withdrawal_rejected: { icon: XCircle, cls: "bg-rose-500/10 text-rose-400" },
  system: { icon: Info, cls: "bg-muted text-muted-foreground" },
};

export function NotificationsPanel() {
  const { data, loading, refresh } = useNotifications();
  const rows: AppNotification[] = data?.rows ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiPost("/api/affiliate/notifications/read-all");
      toast.success("All notifications marked as read");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to mark all read");
    } finally {
      setMarkingAll(false);
    }
  };

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      await apiPatch(`/api/affiliate/notifications/${id}/read`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to mark as read");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay on top of referrals, deposits and withdrawal updates."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0 || loading}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {markingAll ? "Marking…" : "Mark all read"}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/50 p-10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
              <BellOff className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New notifications about your referrals and payouts will show up
                here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4 text-neon" />
              You have{" "}
              <Badge
                variant="outline"
                className="border-neon/40 bg-neon/10 text-neon"
              >
                {unreadCount} unread
              </Badge>
              notification{unreadCount === 1 ? "" : "s"}.
            </div>
          )}

          <div className="space-y-2.5">
            {rows.map((n) => {
              const cfg = ICONS[n.type] ?? ICONS.system;
              const Icon = cfg.icon;
              const unread = !n.read;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => unread && markRead(n.id)}
                  disabled={!unread || markingId === n.id}
                  aria-label={
                    unread
                      ? `Mark "${n.title}" as read`
                      : `Notification: ${n.title}`
                  }
                  className={cn(
                    "group relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors sm:p-5",
                    unread
                      ? "border-neon/25 bg-neon/[0.04] hover:bg-neon/[0.07]"
                      : "border-border/60 bg-card/40 hover:bg-card/60",
                    !unread && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      cfg.cls
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={cn(
                          "text-sm font-semibold leading-snug",
                          !unread && "text-muted-foreground"
                        )}
                      >
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-xs leading-relaxed",
                        unread ? "text-muted-foreground" : "text-muted-foreground/70"
                      )}
                    >
                      {n.message}
                    </p>
                  </div>

                  {unread && (
                    <span
                      className="absolute right-4 top-4 inline-block h-2 w-2 rounded-full bg-neon neon-glow-sm"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
