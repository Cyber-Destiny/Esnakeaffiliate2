"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiPatch, apiPost } from "@/lib/fetcher";
import type { AdminAffiliateRow, AffiliateStatus } from "@/lib/types";
import { PLATFORM_FEE_PCT } from "@/lib/constants";

type Props = {
  mode: "create" | "edit";
  affiliate?: AdminAffiliateRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const STATUS_OPTIONS: { value: AffiliateStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

/**
 * Shared create/edit dialog for affiliates.
 * - Create: POSTs to /api/admin/affiliates (username + password required).
 * - Edit:   PATCHes /api/admin/affiliates/[id] (username is immutable;
 *           password optional — leave blank to keep current).
 */
export function AffiliateFormDialog({
  mode,
  affiliate,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const isEdit = mode === "edit";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [commissionPct, setCommissionPct] = useState("20");
  const [platformName, setPlatformName] = useState("");
  const [status, setStatus] = useState<AffiliateStatus>("active");
  const [submitting, setSubmitting] = useState(false);

  // Re-sync the form whenever the dialog opens or the target affiliate changes.
  useEffect(() => {
    if (!open) return;
    if (isEdit && affiliate) {
      setFullName(affiliate.fullName);
      setEmail(affiliate.email);
      setUsername(affiliate.username);
      setPassword("");
      setCommissionPct(String(affiliate.commissionPct));
      setPlatformName(affiliate.platformName || "");
      setStatus(affiliate.status);
    } else {
      setFullName("");
      setEmail("");
      setUsername("");
      setPassword("");
      setCommissionPct("20");
      setPlatformName("");
      setStatus("active");
    }
  }, [open, isEdit, affiliate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!email.trim()) return toast.error("Email is required");

    const pct = Number(commissionPct);
    if (Number.isNaN(pct) || pct < 0 || pct > 90) {
      return toast.error("Commission must be between 0 and 90");
    }

    if (!isEdit) {
      if (username.trim().length < 3) {
        return toast.error("Username must be at least 3 characters (letters, numbers, underscore)");
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        return toast.error("Username may only contain letters, numbers and underscores");
      }
      if (password.length < 8) {
        return toast.error("Password must be at least 8 characters");
      }
    }

    setSubmitting(true);
    try {
      if (isEdit && affiliate) {
        const body: Record<string, unknown> = {
          fullName: fullName.trim(),
          email: email.trim(),
          commissionPct: pct,
          status,
          platformName: platformName.trim() || null,
        };
        if (password) body.password = password;
        await apiPatch(`/api/admin/affiliates/${affiliate.id}`, body);
        toast.success("Affiliate updated");
      } else {
        await apiPost("/api/admin/affiliates", {
          fullName: fullName.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
          commissionPct: pct,
          platformName: platformName.trim() || undefined,
          status,
        });
        toast.success("Affiliate created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save affiliate");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit affiliate" : "Create affiliate"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update profile, commission rate or account status. Password is optional — leave blank to keep the current one."
              : "Create a new affiliate account. A unique referral code is generated automatically."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aff-fullname">Full name</Label>
            <Input
              id="aff-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Joshua Isok"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aff-email">Email</Label>
            <Input
              id="aff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="affiliate@esnaked.com"
              autoComplete="off"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="aff-username">Username</Label>
              <Input
                id="aff-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="joshua"
                autoComplete="off"
                disabled={isEdit}
                required={!isEdit}
              />
              {isEdit && (
                <p className="text-[11px] text-muted-foreground">Username cannot be changed.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-platform">Platform (optional)</Label>
              <Input
                id="aff-platform"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="e.g. BetStream"
                autoComplete="off"
                maxLength={40}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="aff-commission">
                Commission %{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (of platform revenue)
                </span>
              </Label>
              <Input
                id="aff-commission"
                type="number"
                min={0}
                max={90}
                step={1}
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Platform revenue = {PLATFORM_FEE_PCT}% of each wager.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AffiliateStatus)}>
                <SelectTrigger id="aff-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aff-password">
              {isEdit ? "New password (optional)" : "Password"}
            </Label>
            <Input
              id="aff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Leave blank to keep current" : "Min. 8 characters"}
              autoComplete="new-password"
              required={!isEdit}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create affiliate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
