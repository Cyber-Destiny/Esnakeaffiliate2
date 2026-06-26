"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "@/store/ui-store";
import { OverviewPanel } from "./panels/overview-panel";
import { StatisticsPanel } from "./panels/statistics-panel";
import { ReferralsPanel } from "./panels/referrals-panel";
import { WithdrawalsPanel } from "./panels/withdrawals-panel";
import { PayoutsPanel } from "./panels/payouts-panel";
import { NotificationsPanel } from "./panels/notifications-panel";
import { ProfilePanel } from "./panels/profile-panel";

export function AffiliateDashboard() {
  const view = useUiStore((s) => s.view);

  let panel: React.ReactNode = null;
  switch (view) {
    case "affiliate:dashboard":
      panel = <OverviewPanel />;
      break;
    case "affiliate:statistics":
      panel = <StatisticsPanel />;
      break;
    case "affiliate:referrals":
      panel = <ReferralsPanel />;
      break;
    case "affiliate:withdrawals":
      panel = <WithdrawalsPanel />;
      break;
    case "affiliate:payouts":
      panel = <PayoutsPanel />;
      break;
    case "affiliate:notifications":
      panel = <NotificationsPanel />;
      break;
    case "affiliate:profile":
      panel = <ProfilePanel />;
      break;
    default:
      panel = <OverviewPanel />;
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {panel}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
