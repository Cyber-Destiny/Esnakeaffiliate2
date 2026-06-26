"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "@/store/ui-store";
import { AdminOverviewPanel } from "./panels/admin-overview-panel";
import { AdminAffiliatesPanel } from "./panels/admin-affiliates-panel";
import { AdminWithdrawalsPanel } from "./panels/admin-withdrawals-panel";

/**
 * Admin Dashboard router.
 *
 * Reads `view` from the UI store and renders the matching admin panel.
 * Everything lives inside the single `/` route — no Next.js routing.
 */
export function AdminDashboard() {
  const view = useUiStore((s) => s.view);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {view === "admin:dashboard" && <AdminOverviewPanel />}
          {view === "admin:affiliates" && <AdminAffiliatesPanel />}
          {view === "admin:withdrawals" && <AdminWithdrawalsPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
