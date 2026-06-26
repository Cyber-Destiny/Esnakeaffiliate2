"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { apiGet, apiPost } from "@/lib/fetcher";
import type { AppNotification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Menu, Check } from "lucide-react";
import { Sidebar } from "./sidebar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Topbar({ title }: { title: string }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const affiliate = useAuthStore((s) => s.affiliate);
  const view = useUiStore((s) => s.view);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const isAdmin = affiliate?.role === "admin";

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isAdmin) return;
      try {
        const data = await apiGet<{ rows: AppNotification[]; unreadCount: number }>(
          "/api/affiliate/notifications?unread=0"
        );
        if (!active) return;
        setItems(data.rows.slice(0, 12));
        setUnread(data.unreadCount);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [view, isAdmin]);

  const markAllRead = async () => {
    try {
      await apiPost("/api/affiliate/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {!isAdmin && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-neon px-1 text-[10px] font-bold text-background">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border/40 p-3">
                <p className="text-sm font-semibold">Notifications</p>
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-neon hover:underline"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>
              <ScrollArea className="max-h-96">
                <div className="divide-y divide-border/30">
                  {items.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet</p>
                  ) : (
                    items.map((n) => (
                      <div
                        key={n.id}
                        className={cn("p-3 transition-colors", !n.read && "bg-neon/5")}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
        {affiliate && (
          <Badge variant="outline" className="hidden capitalize sm:inline-flex">
            {affiliate.role}
          </Badge>
        )}
      </div>
    </header>
  );
}
