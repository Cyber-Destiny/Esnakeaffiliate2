# ENSNAKE Affiliate System — Worklog

This is the shared worklog. Every agent MUST append (never overwrite) a new section starting with `---`.

---
Task ID: 1
Agent: orchestrator (main)
Task: Foundation — Prisma schema, libs, theme, seed

Work Log:
- Replaced `prisma/schema.prisma` with full affiliate models: Affiliate, ReferredUser, Click, Deposit, Wager, Withdrawal, Payout, Notification, VerificationToken. Ran `bun run db:push`.
- Installed `jose` (JWT) and `bcryptjs` (password hashing).
- Created `src/lib/constants.ts` (PLATFORM_FEE_PCT=10, DEFAULT_COMMISSION_PCT=20, cookie names, brand).
- Created `src/lib/auth.ts` (JWT sign/verify via jose, httpOnly cookie helpers, getCurrentAffiliate/requireAffiliate/requireAdmin, AuthError).
- Created `src/lib/password.ts` (bcrypt hash/compare).
- Created `src/lib/commission.ts` (calculatePlatformRevenue, calculateCommission, computeWagerEconomics). Commission = commissionPct% of (PLATFORM_FEE_PCT% of wager). Example: ₦1000 wager → ₦100 platform revenue → ₦20 commission at 20%.
- Created `src/lib/format.ts` (formatCurrency ₦, formatNumber, formatDate, timeAgo, compact).
- Created `src/lib/referral.ts` (generateReferralCode unique, buildReferralLink → https://ensnake.com?ref=CODE).
- Created `src/lib/api.ts` (ok/badRequest/unauthorized/forbidden/notFound/serverError, withErrors wrapper, parseZod, getClientIp).
- Rewrote `src/app/globals.css` with premium dark theme: near-black bg, neon green (#neon oklch ~0.82 0.22 149) accents, neon-glow utilities, grid-bg, custom scrollbar.
- Updated `src/app/layout.tsx`: forced `dark` class on `<html>`, ENSNAKE metadata, added Sonner toaster.
- Wrote `prisma/seed.ts` and ran it. Created 1 admin + 6 affiliates (incl. Joshua Isok / JOSHUA @20%, Amara Okafor / AMARA @25%, plus 4 others; Lerato suspended). Generated 30 days of clicks, ~18-40 referred users each, deposits, wagers (with computed platform revenue + commission), notifications, withdrawals (pending+approved+rejected), and payouts.

Stage Summary:
- Demo credentials:
  - Admin: `admin@ensnake.com` / `Admin@123`
  - Affiliate: `joshua@ensnake.com` / `Joshua@123`
  - Affiliate: `amara@ensnake.com` / `Amara@123`
- Commission model confirmed: 20% of PLATFORM REVENUE (which is 10% of wager), NOT of total wager.
- Theme is dark-first with neon green. Tailwind tokens: `--neon`, `.neon-glow`, `.text-neon`, `.grid-bg`, `.gradient-neon`.
- All shadcn/ui components already present in `src/components/ui/`. recharts available for charts. zustand available for client state.
- CONSTRAINT: user can only see the `/` route. Everything (auth + affiliate dashboard + admin dashboard) must live in `src/app/page.tsx` as a client-side SPA with view-state navigation. API routes live under `src/app/api/*`.
- Next: API routes (task 2).

---
Task ID: 2
Agent: orchestrator (main)
Task: Backend API routes (auth, affiliate, admin, tracking)

Work Log:
- Created directories under src/app/api/*.
- Auth routes: signup, login, logout, me (GET), forgot-password, reset-password, verify-email, resend-verification. JWT via jose, httpOnly cookies, bcrypt hashing, email-verification & password-reset tokens stored in VerificationToken table.
- Affiliate routes: profile (GET/PATCH), stats (overview cards), stats/daily (30-day series bucketed in JS), referred-users (paginated + searchable + sortable), withdrawals (GET + POST with balance check + fraud guard), payouts, notifications (GET), notifications/[id]/read (PATCH), notifications/read-all (POST).
- Admin routes: stats (platform-wide overview), affiliates (GET list with per-affiliate aggregates + POST create), affiliates/[id] (PATCH edit/suspend/commission/password + DELETE), withdrawals (GET filtered), withdrawals/[id] (PATCH approve/reject -> creates payout + notification).
- Tracking routes: click (records referral click w/ IP+UA), simulate (kind=signup|deposit|wager — creates referred user / deposit / wager with computed economics + notifications, for live demo).
- Verified end-to-end: login + /api/affiliate/stats returns correct overview for Joshua.

Stage Summary:
- Commission math confirmed via API: ₦911,200 wagered -> ₦91,120 platform revenue -> ₦18,224 commission (20%).
- All routes use `withErrors` wrapper + zod validation. Auth via `requireAffiliate` / `requireAdmin`.
- Next: frontend (task 4+).

---
Task ID: 6b
Agent: full-stack-developer
Task: Admin Dashboard UI — router + 3 panels (overview, affiliates management, withdrawal approval queue) for the ENSNAKE affiliate admin portal.

Work Log:
- Replaced the stub `src/components/admin/admin-dashboard.tsx` with a view-state router: reads `view` from `useUiStore`, switches between `admin:dashboard` / `admin:affiliates` / `admin:withdrawals`, wraps each panel in a `framer-motion` `AnimatePresence` fade (y:8 → 0, 200ms ease-out).
- Created `src/components/admin/affiliate-form-dialog.tsx` — shared create/edit `Dialog` used by the affiliates panel. Handles both modes: create (POST `/api/admin/affiliates`, username+password required) and edit (PATCH `/api/admin/affiliates/[id]`, username disabled/immutable, password optional "leave blank to keep"). Fields: fullName, email, username (create-only), platformName (optional), commissionPct (0–90 number, default 20, with helper copy explaining platform revenue = 10% of wager), status (Select: active/suspended/pending), password. Client-side validation + `toast` for success/error. Form re-syncs via `useEffect` when `open`/`affiliate` change.
- Created `src/components/admin/panels/admin-overview-panel.tsx`:
  - `PageHeader` "Admin Dashboard" with description + "Manage affiliates" outline button (`setView('admin:affiliates')`).
  - Amber alert card when `pendingWithdrawalsCount > 0` with a "Review now" button → `admin:withdrawals`.
  - 9 `StatCard`s in a responsive grid (2 cols mobile / 3 md / 4 lg): Total Affiliates (sub: active · suspended), Total Signups (cyan), Total Deposits ₦ (violet, tooltip), Total Wagered ₦ (tooltip), Platform Revenue ₦ (neon, tooltip "10% of total wagered"), Commissions Earned ₦ (neon), Total Paid ₦ (cyan), Commissions Owed ₦ (amber, tooltip "earned − paid"), Pending Withdrawals (amber, sub: count + amount). Lucide icons: Users, UserCheck, Banknote, Dice5, TrendingUp, Percent, Wallet, Clock.
  - Two-column section: "Top affiliates by commission" horizontal neon bar list (top 6 from `useAdminAffiliates('')` sorted by `commissionEarned` desc, bars sized relative to max, with `gradient-neon` + `neon-glow-sm`) + a "Revenue split" card (segmented bar showing platform share / paid to affiliates / owed to affiliates).
  - Loading: `StatGridSkeleton` (8 skeleton cards) + skeleton rows for the top-affiliates list. Error card with retry button.
- Created `src/components/admin/panels/admin-affiliates-panel.tsx`:
  - `PageHeader` "Affiliate Management" + "Create affiliate" button.
  - Filters row: search `Input` (with `Search` icon, searches name/email/username/referralCode) + status `Select` (all/active/suspended/pending) + refresh icon button.
  - Responsive `Table` (horizontal scroll on mobile) with columns: Affiliate (neon initial avatar + fullName + email + platform badge), Referral Code (mono, click-to-copy with `Copy` icon + `toast`, joined date), Signups, Depositors, Revenue Generated (compact ₦), Commission Earned (compact ₦, neon), Rate (neon badge `XX%`), Total Paid (compact ₦), Status (`StatusBadge`), Actions (`DropdownMenu`: Edit / Suspend-or-Activate / Delete).
  - Edit → opens `AffiliateFormDialog` in edit mode. Suspend/Activate/Delete → set `confirm` state, rendered as a single `AlertDialog` with contextual copy (destructive = rose, activate = neon, suspend = amber). `AlertDialogAction` uses `e.preventDefault()` so the dialog stays open during the async PATCH/DELETE, then closes on success.
  - `EmptyState` card (dashed border, `Users` icon, "Create affiliate" CTA) when no rows. `TableSkeleton` while loading. Row count summary line at the bottom.
- Created `src/components/admin/panels/admin-withdrawals-panel.tsx`:
  - `PageHeader` "Withdrawal Requests".
  - 3 summary `StatCard`s (Pending count / Pending value / Total paid out) from `useAdminStats()`.
  - Neon info banner: "Approving or rejecting a request automatically notifies the affiliate and records a payout on approval."
  - `Tabs` filter: All / Pending / Approved / Rejected (`useAdminWithdrawals(status)` re-fetches on tab change; "all" → undefined).
  - Responsive `Table`: Affiliate (neon initial + fullName + @username · referralCode), Amount (bold neon ₦), Bank, Account (masked `••••1234` + accountName), Requested (`timeAgo` + processed timeAgo if settled), Status (`StatusBadge` + rejection note preview), Transaction (mono neon `Hash` badge if approved, else em-dash), Actions.
  - Pending rows: Approve (neon) + Reject (rose outline) buttons. Processed rows: "Settled" muted label.
  - Approve `Dialog`: payout summary card (amount/bank/account), optional transactionId `Input` (placeholder "Leave blank to auto-generate"), confirm → PATCH `{ status:'approved', transactionId? }`. Reject `Dialog`: optional note `Textarea` (max 200) → PATCH `{ status:'rejected', note? }`. Both `toast` on success/error and refresh the list.
  - `TableSkeleton` + `EmptyState` (context-aware message per tab).
- All files use `'use client'`, typed via `@/lib/types` (`AdminAffiliateRow`, `AdminOverview`, `Withdrawal`, `AffiliateStatus`), use existing shadcn/ui components + shared components only, and use `lucide-react` icons. Numbers via `formatCurrency`/`formatNumber` (compact where appropriate), dates via `formatDate`/`timeAgo`. `sonner` `toast` for all mutation feedback.
- `bun run lint` → 0 errors, 0 warnings in admin files (4 pre-existing warnings in other agents' files: seed.ts, topbar.tsx, use-affiliate-data.ts, referral.ts).

Stage Summary:
- Admin dashboard is fully functional end-to-end: overview analytics, affiliate CRUD (create/edit/suspend/activate/delete with confirms), and withdrawal approve/reject queue with auto-notifications.
- Design: premium dark betting-platform aesthetic — `bg-card/50 backdrop-blur-sm` cards, `rounded-xl border-border/60`, neon green accents for primary/money, amber for pending/owed, rose for destructive, violet/cyan for secondary stats. Generous `p-4`/`p-5`/`gap-4` spacing. Mobile-first responsive (grids collapse 4→3→2 cols, tables scroll horizontally).
- A reusable `AffiliateFormDialog` was extracted into `src/components/admin/affiliate-form-dialog.tsx` to keep the affiliates panel clean — it handles both create and edit modes via a `mode` prop.
- The overview panel avoids needing a new admin daily-series endpoint by using a "Top affiliates by commission" horizontal neon bar list (built from the existing `useAdminAffiliates('')` list) plus a "Revenue split" segmented bar — no new API routes required.
- Pre-existing dev-log `Module not found` errors are exclusively from `src/components/affiliate/affiliate-dashboard.tsx` (parallel affiliate-agent task 6a importing panels not yet created) — NOT from admin files. All admin imports resolve and compile cleanly.
- No tests written (per instructions). No files touched outside `src/components/admin/`.

---
Task ID: 6a
Agent: full-stack-developer
Task: Affiliate Dashboard UI — router + 7 panels (overview, statistics, referrals, withdrawals, payouts, notifications, profile) for the ENSNAKE affiliate portal.

Work Log:
- Verified the existing router at `src/components/affiliate/affiliate-dashboard.tsx` — already complete with `useUiStore` view-state switch + `framer-motion` `AnimatePresence` fade transitions (y:8→0, 200ms ease-out). No changes needed.
- Reviewed the 4 existing panels (overview / statistics / referrals / withdrawals) created by the prior orchestrator pass; all were fully spec-compliant (referral hero card with code+link+Copy, 8 StatCards with neon accents + tooltips, commission explainer ₦1000→₦100→₦20, Simulate activity buttons hitting `/api/tracking/simulate`, mini charts; 6-chart statistics grid with 7/14/30/60-day selector; paginated+searchable+sortable referrals table with empty-state CTA; withdrawals dialog with balance hint + balance summary + masked-account table). Left them untouched.
- Created `src/components/affiliate/panels/payouts-panel.tsx`:
  - `PageHeader` "Payout History".
  - Responsive `Table` (horizontal scroll on mobile) — Amount (neon bold ₦ + `Banknote` method subtext), Date (`CalendarDays` icon + `formatDate`), Status (`StatusBadge` with `completed` fallback), Transaction ID (mono `Hash`-prefixed neon badge if present else em-dash), Method (capitalised).
  - `TableSkeleton` while loading; context-aware `Wallet`-icon EmptyState ("Approved withdrawals will be recorded here as payouts. Request a withdrawal from the Withdrawals page…").
  - Footer line showing row count ("Showing N payouts — most recent first") with `CheckCircle2` neon accent.
- Created `src/components/affiliate/panels/notifications-panel.tsx`:
  - `PageHeader` "Notifications" + "Mark all read" button (calls `POST /api/affiliate/notifications/read-all`, toasts, refreshes; disabled when unreadCount=0 or loading).
  - `useNotifications()` → `{ rows, unreadCount }`. While loading shows 5 `Skeleton` rows.
  - Unread summary banner (neon `Bell` + neon-outline Badge "N unread") only when unreadCount > 0.
  - List items are clickable `<button>`s — clicking an unread notification fires `PATCH /api/affiliate/notifications/[id]/read` then refreshes; read notifications have `cursor-default` and don't refetch.
  - Each item: per-type icon (signup→`UserPlus` cyan, deposit→`Wallet` amber, withdrawal_requested→`Clock` amber, withdrawal_approved→`CheckCircle` neon, withdrawal_rejected→`XCircle` rose, system→`Info` muted), title, message, `timeAgo`, unread neon dot (`neon-glow-sm`) in top-right.
  - Unread items styled with `border-neon/25 bg-neon/[0.04] hover:bg-neon/[0.07]`; read items `border-border/60 bg-card/40`.
  - Empty state with `BellOff` icon ("You're all caught up").
- Created `src/components/affiliate/panels/profile-panel.tsx`:
  - `PageHeader` "Profile & Referral Link".
  - Two-column responsive grid (`lg:grid-cols-2`):
    - **Left (Profile card)**: editable form (Full Name, Platform/Channel w/ `Building2` icon, Phone w/ `Phone` icon, Bio textarea with 400-char counter) → `PATCH /api/affiliate/profile`. Form state syncs via `useEffect([current])` from `useProfile()` (with fallback to `useAuthStore.affiliate` to avoid flicker). Save button is disabled until `dirty`; only sends changed fields. After save calls `refreshProfile()` (auth store) + toasts success/error. Read-only `@username` + `email` shown in a `ReadOnlyField` sub-component, plus StatusBadge in header and "Joined DATE · role" footer. Amber-bordered Security note: "Your password can be reset from the **sign-in page**" (button → `setView('auth:forgot')`).
    - **Right (Referral card)**: hero card with `grid-bg` overlay + `border-neon/25`, big mono neon-glow referral code (text-3xl→4xl), commission % badge, referral link input row with Copy button (variant flips to `secondary`+Check icon on success), full-width "Copy referral code" outline button, platform breakdown card if `platformName` set, neon "Share tip" hint card, muted "How commission is calculated" reminder (₦1000 wager → ₦100 revenue → ₦{pct} commission, dynamically computed from the affiliate's actual `commissionPct`), and a `KeyRound` footer note "Referral codes never expire and cannot be changed."
- All files use `'use client'`, typed via `@/lib/types` (`Payout`, `AppNotification`, `NotificationType`, `Affiliate`), use only existing shadcn/ui components + shared components + `lucide-react` icons. `sonner` `toast` for all mutation feedback. Numbers via `formatCurrency`/`formatDate`/`timeAgo`. Fully responsive (mobile-first: grids collapse to 1 col, tables scroll horizontally, padding scales `p-4 sm:p-5 sm:p-6`).
- `bun run lint` → **0 errors, 0 warnings in affiliate files**. The 4 warnings remaining are pre-existing in other agents' files (`seed.ts`, `topbar.tsx`, `use-affiliate-data.ts`, `referral.ts`).
- Verified end-to-end via `curl http://localhost:3000/` → HTTP 200 with clean compile (no more `Module not found` errors that were previously caused by the missing 3 panels).

Stage Summary:
- Affiliate Dashboard is now fully functional end-to-end: 7 panels reachable from the sidebar, all API hooks wired (`useOverviewStats`, `useDailyStats`, `useReferredUsers`, `useWithdrawals`, `usePayouts`, `useNotifications`, `useProfile`), all mutations use `apiPost`/`apiPatch` with `ApiError`-aware toast feedback.
- The "Simulate activity" buttons on the overview panel hit `/api/tracking/simulate?kind=signup|deposit|wager` and refresh both stats + daily series, with a contextual toast showing the commission earned for wagers — making the dashboard feel live for demo logins (e.g. `joshua@ensnake.com` / `Joshua@123`).
- Design consistent with the parallel admin (task 6b) work: `bg-card/50 backdrop-blur-sm` cards, `rounded-xl border-border/60`, neon-green primary buttons (`bg-neon text-primary-foreground hover:bg-neon/90`), amber for pending/security, rose for destructive, violet/cyan for secondary stats. Premium betting-platform aesthetic with `neon-text-glow`, `neon-glow-sm`, and `grid-bg` accents.
- No files touched outside `src/components/affiliate/`. No new routes. No tests written (per instructions).

---
Task ID: 7
Agent: orchestrator (main)
Task: Integration, responsive/sticky footer, lint, Agent Browser self-verification

Work Log:
- Wired `src/app/page.tsx` as the SPA entry: hydrates auth via `/api/auth/me`, shows AuthScreen when logged out, AppShell when logged in, and keeps the view consistent with the user's role.
- Built `src/components/layout/app-shell.tsx` (desktop sidebar + mobile Sheet + Topbar + main + sticky Footer using `min-h-screen flex flex-col` + `mt-auto` footer), `sidebar.tsx` (role-aware nav, referral-code card, user card, sign-out), `topbar.tsx` (mobile menu toggle, notifications popover with live unread count + mark-all-read), `footer.tsx` (sticky bottom, brand, version).
- Built shared components: `brand.tsx` (ENSNAKE snake mark + wordmark), `stat-card.tsx` (neon-accented overview cards), `status-badge.tsx`, `page-header.tsx`, `charts.tsx` (AreaTrend/BarTrend/ChartCard recharts wrappers).
- Built Zustand stores: `auth-store.ts` (hydrate/login/signup/logout/refreshProfile) and `ui-store.ts` (view router + mobile sidebar + reset/verify token carry-over).
- Built hooks: `use-affiliate-data.ts` (overview/daily/referred-users/withdrawals/payouts/notifications/profile + generic useAsync) and `use-admin-data.ts` (admin stats/affiliates/withdrawals).
- Delegated Task 6a (affiliate dashboard, 7 panels) and Task 6b (admin dashboard, 3 panels + affiliate-form-dialog) to parallel full-stack-developer subagents. Both completed and linted clean.
- Quietened Prisma logging (query -> error/warn only).
- `bun run lint`: 0 errors, 0 warnings after --fix.

Agent Browser self-verification (all passed):
- `/` loads the premium split-screen auth screen (marketing panel + login form + demo account buttons).
- Logged in as affiliate Joshua (demo button) -> affiliate dashboard renders: 8 stat cards, referral-link card with copy, "How you earn" commission explainer (₦1000→₦100→₦20), Daily Clicks + Daily Commission mini charts, sticky footer with ensnake.com link.
- "Simulate wager" button -> toast "Wager simulated — you earned ₦40.00 commission" (live commission calc confirmed end-to-end).
- Navigated Statistics (6 charts + days selector), Referrals (paginated+searchable table), Withdrawals (request dialog + balance summary + list), Profile & Referral Link (editable form + referral hero). All render with loading/empty states.
- Mobile viewport 390x844: hamburger "Open menu" appears, layout adapts, "Request withdrawal" CTA visible.
- Footer is sticky (visible after scroll) and pushes down naturally on long content.
- Logged in as admin (demo button) -> admin dashboard renders: 9 analytics cards, pending-withdrawals alert, "Top affiliates by commission" neon bars, "Revenue split" bar.
- Admin Affiliates panel: full table (Affiliate/Referral code/Signups/Depositors/Revenue/Commission/Rate/Paid/Status/Actions) + Create button + search.
- Admin Withdrawals panel: All/Pending/Approved/Rejected tabs + table. Approved a pending withdrawal -> confirm dialog -> toast "Withdrawal approved — payout recorded & affiliate notified". Verified a new Payout row was created server-side via `/api/affiliate/payouts`.
- No browser console errors, no runtime errors in dev.log.

Stage Summary:
- The ENSNAKE Affiliate System is complete and verified end-to-end in the browser.
- All requested features implemented: JWT auth (signup/login/forgot/reset/verify-email), affiliate profile + referral link/code, dashboard with 8 overview cards, 6 daily statistics charts, referral tracking (click + simulate attribution), commission logic (20% of platform revenue where platform revenue = 10% of wager — NOT of total wager), referred-users table (paginated+searchable), withdrawals (request + admin approval), payout history, notifications (signup/deposit/withdrawal events), admin dashboard (analytics + affiliate CRUD + suspend + commission editor + withdrawal approval).
- Design: premium dark theme, neon green accents, betting-platform aesthetic, fully responsive, sticky footer.
- CONSTRAINT NOTE: User requested PostgreSQL; the sandbox only supports SQLite, so the schema uses SQLite but is written portably (switch `provider` + `datasource` to postgres to migrate). The `?ref=CODE` referral attribution + cookie model is implemented via the tracking API and `REFERRAL_COOKIE_NAME` constant.
- Demo credentials: admin@ensnake.com / Admin@123 · joshua@ensnake.com / Joshua@123 · amara@ensnake.com / Amara@123.
