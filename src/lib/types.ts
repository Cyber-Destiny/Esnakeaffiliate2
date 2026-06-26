// Shared API response types for the ENSNAKE affiliate frontend.

export type AffiliateRole = "affiliate" | "admin";
export type AffiliateStatus = "active" | "suspended" | "pending";
export type WithdrawalStatus = "pending" | "approved" | "rejected";
export type NotificationType =
  | "signup"
  | "deposit"
  | "withdrawal_requested"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "system";

export interface Affiliate {
  id: string;
  fullName: string;
  email: string;
  username: string;
  referralCode: string;
  referralLink: string;
  commissionPct: number;
  status: AffiliateStatus;
  role: AffiliateRole;
  emailVerified: boolean;
  platformName?: string | null;
  bio?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface OverviewStats {
  totalClicks: number;
  totalSignups: number;
  depositors: number;
  totalWagered: number;
  platformRevenue: number;
  totalCommissionEarned: number;
  totalPaid: number;
  pendingWithdrawals: number;
  availableBalance: number;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  clicks: number;
  signups: number;
  deposits: number;
  wagerVolume: number;
  revenue: number;
  commission: number;
}

export interface ReferredUser {
  id: string;
  username: string;
  email: string | null;
  deposited: number;
  totalWagered: number;
  revenueGenerated: number;
  commissionGenerated: number;
  status: string;
  joinedAt: string;
}

export interface Withdrawal {
  id: string;
  affiliateId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: WithdrawalStatus;
  transactionId: string | null;
  note: string | null;
  createdAt: string;
  processedAt: string | null;
  affiliate?: Pick<Affiliate, "id" | "fullName" | "email" | "username" | "referralCode">;
}

export interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  status: string;
  transactionId: string;
  method: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  affiliateId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminAffiliateRow {
  id: string;
  fullName: string;
  email: string;
  username: string;
  referralCode: string;
  referralLink: string;
  commissionPct: number;
  status: AffiliateStatus;
  platformName: string | null;
  createdAt: string;
  avatarUrl: string | null;
  signups: number;
  depositors: number;
  revenueGenerated: number;
  commissionEarned: number;
  totalPaid: number;
}

export interface AdminOverview {
  totalAffiliates: number;
  activeAffiliates: number;
  suspendedAffiliates: number;
  totalSignups: number;
  totalDeposits: number;
  totalWagered: number;
  totalPlatformRevenue: number;
  totalCommissionsEarned: number;
  totalPaid: number;
  totalCommissionsOwed: number;
  pendingWithdrawalsAmount: number;
  pendingWithdrawalsCount: number;
}
