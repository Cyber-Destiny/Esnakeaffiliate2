"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  User,
  AtSign,
  Mail,
  Phone,
  Building2,
  FileText,
  Save,
  Copy,
  Check,
  Link2,
  Percent,
  Share2,
  ShieldAlert,
  CalendarDays,
  KeyRound,
} from "lucide-react";
import { useProfile } from "@/hooks/use-affiliate-data";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiPatch, ApiError } from "@/lib/fetcher";
import { formatDate } from "@/lib/format";
import type { Affiliate } from "@/lib/types";

type FormState = {
  fullName: string;
  platformName: string;
  bio: string;
  phone: string;
};

function toForm(a: Affiliate): FormState {
  return {
    fullName: a.fullName ?? "",
    platformName: a.platformName ?? "",
    bio: a.bio ?? "",
    phone: a.phone ?? "",
  };
}

export function ProfilePanel() {
  const authAffiliate = useAuthStore((s) => s.affiliate);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const setView = useUiStore((s) => s.setView);
  const { data: profile, loading } = useProfile();

  const current = profile ?? authAffiliate;

  const [form, setForm] = useState<FormState>({
    fullName: "",
    platformName: "",
    bio: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  // Sync form when profile loads (or auth affiliate changes).
  useEffect(() => {
    if (current) setForm(toForm(current));
  }, [current]);

  const dirty =
    !!current &&
    (form.fullName !== (current.fullName ?? "") ||
      form.platformName !== (current.platformName ?? "") ||
      form.bio !== (current.bio ?? "") ||
      form.phone !== (current.phone ?? ""));

  const copy = async (text: string, kind: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(
        kind === "link" ? "Referral link copied" : "Referral code copied"
      );
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    setSaving(true);
    try {
      const body: {
        fullName?: string;
        platformName?: string;
        bio?: string;
        phone?: string;
      } = {};
      if (form.fullName.trim() !== (current.fullName ?? ""))
        body.fullName = form.fullName.trim();
      if (form.platformName.trim() !== (current.platformName ?? ""))
        body.platformName = form.platformName.trim();
      if (form.bio.trim() !== (current.bio ?? ""))
        body.bio = form.bio.trim();
      if (form.phone.trim() !== (current.phone ?? ""))
        body.phone = form.phone.trim();

      await apiPatch("/api/affiliate/profile", body);
      toast.success("Profile updated");
      await refreshProfile();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const referralCode = current?.referralCode ?? "—";
  const referralLink =
    current?.referralLink ??
    `https://esnaked.com?ref=${current?.referralCode ?? ""}`;

  // Commission explainer: ₦1000 wager → ₦100 platform revenue (10%) → pct% of ₦100.
  const pct = current?.commissionPct ?? 20;
  const exampleCommission = Math.round((pct / 100) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Referral Link"
        description="Manage your account details and share your referral link."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile card */}
        <section className="rounded-xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-neon" /> Profile details
            </h2>
            {current && <StatusBadge status={current.status} />}
          </div>

          {loading && !current ? (
            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={submit}>
              {/* Read-only identity */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReadOnlyField
                  icon={<AtSign className="h-3.5 w-3.5" />}
                  label="Username"
                  value={current ? `@${current.username}` : "—"}
                />
                <ReadOnlyField
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label="Email"
                  value={current?.email ?? "—"}
                />
              </div>

              <Separator />

              {/* Editable */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformName">
                  Platform / channel{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="platformName"
                    value={form.platformName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, platformName: e.target.value }))
                    }
                    placeholder="e.g. Twitter, Telegram channel, blog"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+234 801 234 5678"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  placeholder="A short note about you or your audience."
                  rows={3}
                  maxLength={400}
                />
                <p className="text-right text-[11px] text-muted-foreground">
                  {form.bio.length}/400
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-xs text-muted-foreground">
                  {current && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" />
                      Joined {formatDate(current.createdAt)} ·{" "}
                      <span className="capitalize">{current.role}</span>
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={saving || !dirty}
                  className="bg-neon text-primary-foreground hover:bg-neon/90"
                >
                  {saving ? (
                    <Save className="h-3.5 w-3.5 animate-pulse" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          )}

          <Separator className="my-5" />

          <div className="flex items-start gap-2.5 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="text-xs">
              <p className="font-medium text-amber-400">Security</p>
              <p className="mt-0.5 text-muted-foreground">
                Your password can be reset from the{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-neon"
                  onClick={() => setView("auth:forgot")}
                >
                  sign-in page
                </button>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Referral card */}
        <section className="relative overflow-hidden rounded-xl border border-neon/25 bg-card/60 p-5 backdrop-blur-sm sm:p-6">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Link2 className="h-4 w-4 text-neon" /> Your referral link
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Share this link — every signup earns you commission on platform
              revenue.
            </p>

            {/* Big referral code */}
            <div className="mt-5 rounded-xl border border-neon/30 bg-background/60 p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Referral code
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-neon neon-text-glow sm:text-4xl">
                {referralCode}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge
                  variant="outline"
                  className="border-neon/30 bg-neon/10 text-neon"
                >
                  <Percent className="h-3 w-3" />
                  {current?.commissionPct ?? 20}% commission
                </Badge>
              </div>
            </div>

            {/* Link with copy */}
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2 pl-3">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:text-sm">
                {referralLink}
              </code>
              <Button
                size="sm"
                variant={copied === "link" ? "secondary" : "default"}
                onClick={() => copy(referralLink, "link")}
                aria-label="Copy referral link"
                className="shrink-0"
              >
                {copied === "link" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied === "link" ? "Copied" : "Copy link"}
              </Button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(referralCode, "code")}
              className="mt-3 w-full justify-center"
              aria-label="Copy referral code"
            >
              {copied === "code" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied === "code" ? "Code copied" : "Copy referral code"}
            </Button>

            {/* Platform breakdown */}
            {current?.platformName && (
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3 w-3" /> Primary platform
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {current.platformName}
                </p>
              </div>
            )}

            {/* Share hint */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-neon/20 bg-neon/5 p-3">
              <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
              <div className="text-xs">
                <p className="font-medium text-neon">Share tip</p>
                <p className="mt-0.5 text-muted-foreground">
                  Post your link on social media, Telegram, WhatsApp groups or
                  your blog. Commission is tracked automatically when a
                  referred user wagers.
                </p>
              </div>
            </div>

            {/* How commission works reminder */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  How commission is calculated
                </p>
                <p className="mt-0.5">
                  You earn {pct}% of{" "}
                  <span className="text-amber-400">platform revenue</span> (10%
                  of wager). Example: a user wagers ₦1,000 → revenue ₦100 →
                  your commission{" "}
                  <span className="text-neon">₦{exampleCommission}</span>.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              <KeyRound className="h-3 w-3" />
              Referral codes never expire and cannot be changed.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReadOnlyField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}
