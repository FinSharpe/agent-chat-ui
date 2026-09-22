"use client";
import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";

interface FiDataAnimationProps {
  status: "fetching" | "success" | "error";
}

/**
 * Progress for the first data pull after an Account Aggregator consent: the
 * brand "sync" ring while fetching, then a success or failure tile.
 */
const FiDataAnimation: React.FC<FiDataAnimationProps> = ({ status }) => {
  if (status === "success") {
    return (
      <div className="font-funnel flex min-h-[120px] flex-col items-center justify-center gap-3.5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#97edcc]/30 text-[#0A9E6E]">
          <Check size={22} />
        </div>
        <div className="space-y-1">
          <p className="text-forest-deep font-geist text-[14px] font-medium dark:text-white">
            Your data is in
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Holdings and balances are ready to analyse.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="font-funnel flex min-h-[120px] flex-col items-center justify-center gap-3.5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertTriangle size={22} />
        </div>
        <div className="space-y-1">
          <p className="text-forest-deep font-geist text-[14px] font-medium dark:text-white">
            Failed to fetch data
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-funnel flex min-h-[120px] flex-col items-center justify-center gap-4 text-center">
      <div className="relative h-12 w-12">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(30deg, #063BAA 0%, #96E7CD 100%)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-1 flex items-center justify-center rounded-full bg-white dark:bg-[#0C1524]">
          <motion.div
            className="h-2.5 w-2.5 rounded-full bg-[#063BAA]"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-forest-deep font-geist text-[14px] font-medium dark:text-white">
          Fetching your financial data…
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Securely syncing through the Account Aggregator.
        </p>
      </div>
    </div>
  );
};

export default FiDataAnimation;
