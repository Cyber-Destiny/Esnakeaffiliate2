"use client";

import * as React from "react";
import { useState } from "react";
import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { ApiError, apiPost } from "@/lib/fetcher";
import { toast } from "sonner";
import {
  MousePointerClick,
  Users,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  User as UserIcon,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthScreen() {
  const view = useUiStore((s) => s.view);
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <MarketingPanel />
      <div className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          {view === "auth:login" && <LoginForm />}
          {view === "auth:signup" && <SignupForm />}
          {view === "auth:forgot" && <ForgotForm />}
          {view === "auth:reset" && <ResetForm />}
          {view === "auth:verify" && <VerifyForm />}
        </div>
      </div>
    </div>
  );
}

function MarketingPanel() {
  const features = [
    { icon: MousePointerClick, title: "Track every click", desc: "Real-time attribution from link to commission." },
    { icon: Users, title: "Grow your audience", desc: "Earn from every depositor you refer." },
    { icon: Wallet, title: "Instant payouts", desc: "Withdraw to any Nigerian bank account." },
    { icon: TrendingUp, title: "20% revenue share", desc: "Industry-leading commission on platform revenue." },
  ];
  return (
    <div className="relative hidden overflow-hidden border-r border-border/40 bg-card/30 lg:flex lg:flex-col lg:justify-between lg:p-10">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-neon/20 blur-[120px]" />
      <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-neon/10 blur-[120px]" />

      <div className="relative">
        <Brand size="lg" />
      </div>

      <div className="relative space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/5 px-3 py-1 text-xs font-medium text-neon">
            <Sparkles className="h-3 w-3" /> Creator Affiliate Program
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Turn your audience
            <br />
            into <span className="text-neon neon-text-glow">recurring revenue.</span>
          </h1>
          <p className="max-w-md text-muted-foreground">
            Promote ENSNAKE games and earn 20% of platform revenue from every player
            you refer. Built for creators, streamers, and influencers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border/50 bg-background/40 p-4 backdrop-blur-sm"
            >
              <f.icon className="h-5 w-5 text-neon" />
              <p className="mt-2 text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-neon" />
        Secure JWT authentication · Bank-grade encryption
      </div>
    </div>
  );
}

function FormShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <Brand />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      <div className="text-sm text-muted-foreground">{footer}</div>
    </div>
  );
}

function fieldError(msg?: string) {
  return msg ? <p className="mt-1 text-xs text-rose-400">{msg}</p> : null;
}

function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const setView = useUiStore((s) => s.setView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!email) next.email = "Email is required";
    if (!password) next.password = "Password is required";
    setErrs(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const aff = await login(email, password);
      toast.success(`Welcome back, ${aff.fullName.split(" ")[0]}!`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormShell
      title="Welcome back"
      subtitle="Sign in to your ENSNAKE Partners dashboard."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-medium text-neon hover:underline"
            onClick={() => setView("auth:signup")}
          >
            Create one
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {fieldError(errs.email)}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-neon"
              onClick={() => setView("auth:forgot")}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {fieldError(errs.password)}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
      <DemoAccounts />
    </FormShell>
  );
}

function SignupForm() {
  const signup = useAuthStore((s) => s.signup);
  const startVerify = useUiStore((s) => s.startVerify);
  const setView = useUiStore((s) => s.setView);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    platformName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 2) next.fullName = "Enter your full name";
    if (!/.+@.+\..+/.test(form.email)) next.email = "Enter a valid email";
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(form.username)) next.username = "3-24 letters, numbers or _";
    if (form.password.length < 8) next.password = "At least 8 characters";
    setErrs(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const res = await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        platformName: form.platformName.trim() || undefined,
      });
      toast.success("Account created! Check your email to verify.");
      startVerify(res.affiliate.email);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormShell
      title="Create your account"
      subtitle="Join the ENSNAKE affiliate program and start earning."
      footer={
        <>
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium text-neon hover:underline"
            onClick={() => setView("auth:login")}
          >
            Sign in
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="fullName" placeholder="Joshua Isok" className="pl-9" value={form.fullName} onChange={set("fullName")} />
          </div>
          {fieldError(errs.fullName)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="username" placeholder="joshua" className="pl-9" value={form.username} onChange={set("username")} />
            </div>
            {fieldError(errs.username)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platformName">Platform (optional)</Label>
            <Input id="platformName" placeholder="TikTok" value={form.platformName} onChange={set("platformName")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="pl-9" value={form.email} onChange={set("email")} />
          </div>
          {fieldError(errs.email)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" className="pl-9" value={form.password} onChange={set("password")} />
          </div>
          {fieldError(errs.password)}
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </FormShell>
  );
}

function ForgotForm() {
  const startReset = useUiStore((s) => s.startReset);
  const setView = useUiStore((s) => s.setView);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ sent: boolean; resetToken?: string }>(
        "/api/auth/forgot-password",
        { email }
      );
      setSent(true);
      if (res.resetToken) {
        // Demo: auto-fill the reset flow with the token (would be emailed in prod)
        toast.success("Reset link generated. (Demo: filling it in for you.)");
        setTimeout(() => startReset(res.resetToken!), 900);
      } else {
        toast.success("If that email exists, a reset link is on its way.");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <>
          Remembered it?{" "}
          <button type="button" className="font-medium text-neon hover:underline" onClick={() => setView("auth:login")}>
            Back to sign in
          </button>
        </>
      }
    >
      {sent ? (
        <div className="rounded-lg border border-neon/30 bg-neon/5 p-4 text-sm">
          <p className="font-medium text-neon">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">
            We sent a reset link to <span className="text-foreground">{email}</span>. It expires in 1 hour.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="forgot-email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </FormShell>
  );
}

function ResetForm() {
  const resetToken = useUiStore((s) => s.resetToken);
  const setView = useUiStore((s) => s.setView);
  const [token, setToken] = useState(resetToken || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (resetToken) setToken(resetToken);
  }, [resetToken]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    if (!token) return toast.error("Reset token is missing");
    setLoading(true);
    try {
      await apiPost("/api/auth/reset-password", { token, password });
      toast.success("Password reset! You can now sign in.");
      setView("auth:login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormShell
      title="Set a new password"
      subtitle="Enter your reset token and a new password."
      footer={
        <>
          <button type="button" className="font-medium text-neon hover:underline" onClick={() => setView("auth:login")}>
            Back to sign in
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" placeholder="Paste your reset token" value={token} onChange={(e) => setToken(e.target.value)} className="font-mono text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="new-password" type="password" placeholder="At least 8 characters" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirm" type="password" placeholder="Re-enter password" className="pl-9" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </FormShell>
  );
}

function VerifyForm() {
  const verifyEmail = useUiStore((s) => s.verifyEmail);
  const affiliate = useAuthStore((s) => s.affiliate);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const setView = useUiStore((s) => s.setView);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const email = verifyEmail || affiliate?.email || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Enter your verification token");
    setLoading(true);
    try {
      await apiPost("/api/auth/verify-email", { token });
      await refreshProfile();
      toast.success("Email verified! Welcome aboard.");
      setView(affiliate?.role === "admin" ? "admin:dashboard" : "affiliate:dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return toast.error("No email on file");
    try {
      const res = await apiPost<{ verificationToken?: string }>("/api/auth/resend-verification", { email });
      if (res.verificationToken) {
        setToken(res.verificationToken);
        toast.success("New verification token generated (demo: filled in).");
      } else {
        toast.success("Verification email resent.");
      }
    } catch {
      toast.error("Could not resend");
    }
  };

  return (
    <FormShell
      title="Verify your email"
      subtitle={email ? `We sent a verification token to ${email}.` : "Enter the verification token we sent you."}
      footer={
        <>
          <button type="button" className="font-medium text-neon hover:underline" onClick={() => setView(affiliate?.role === "admin" ? "admin:dashboard" : "affiliate:dashboard")}>
            Skip for now
          </button>
        </>
      }
    >
      <div className="rounded-lg border border-neon/20 bg-neon/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-neon">
          <ShieldCheck className="h-4 w-4" /> Demo mode
        </p>
        <p className="mt-1 text-muted-foreground">
          In production this token is emailed. For this demo, sign up and the token is returned directly — sign up now to get one, or use a seeded account.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="verify-token">Verification token</Label>
          <Input id="verify-token" placeholder="Paste token" value={token} onChange={(e) => setToken(e.target.value)} className="font-mono text-xs" />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Verifying..." : "Verify email"}
        </Button>
        <button type="button" onClick={resend} className="w-full text-center text-xs text-muted-foreground hover:text-neon">
          Resend verification token
        </button>
      </form>
    </FormShell>
  );
}

function DemoAccounts() {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState<string | null>(null);
  const fill = async (email: string, password: string, label: string) => {
    setLoading(label);
    try {
      await login(email, password);
      toast.success("Signed in with demo account");
    } catch {
      toast.error("Demo login failed");
    } finally {
      setLoading(null);
    }
  };
  const items = [
    { label: "Affiliate", email: "joshua@ensnake.com", password: "Joshua@123", note: "Joshua Isok · JOSHUA" },
    { label: "Admin", email: "admin@ensnake.com", password: "Admin@123", note: "Full admin access" },
  ];
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Demo accounts
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => fill(it.email, it.password, it.label)}
            disabled={loading !== null}
            className={cn(
              "flex flex-col items-start rounded-md border border-border/60 bg-background/50 p-2.5 text-left transition-colors hover:border-neon/40 hover:bg-neon/5 disabled:opacity-60"
            )}
          >
            <span className="text-xs font-semibold text-neon">{it.label}</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">{it.note}</span>
            <span className="mt-1 text-[11px] font-mono text-foreground/70">{loading === it.label ? "Signing in..." : it.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
