"use client";
import { Sparkles, Landmark, TrendingUp, Wallet } from "lucide-react";

const BULLETS = [
  { icon: TrendingUp, label: "Stocks, mutual funds and ETFs" },
  { icon: Landmark, label: "Bank balances and SIPs" },
  { icon: Sparkles, label: "One net worth, analyzed in chat" },
];

/**
 * Shown in place of the account list when the user has no consents at all.
 * Copy and structure from finsharpe-mobile `_EmptyState` (ln 191-265).
 */
export function AccountsEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <div className="rounded-nested flex h-14 w-14 items-center justify-center bg-[#063BAA]/8 text-[#063BAA] dark:bg-[#22335C] dark:text-[#8FB4FF]">
        <Wallet size={28} />
      </div>

      <h3 className="text-forest-deep mt-4 text-[17px] leading-snug font-semibold dark:text-white">
        See your whole portfolio here
      </h3>
      <p className="mt-2 max-w-[320px] text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
        Connect your accounts through the RBI-regulated Account Aggregator.
        FinSharpe gets read-only data and never sees your credentials.
      </p>

      <div className="mt-5 w-full max-w-[320px] space-y-2">
        {BULLETS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-[#0C1524]"
          >
            <Icon
              size={16}
              className="shrink-0 text-[#063BAA] dark:text-[#8FB4FF]"
            />
            <span className="text-forest-deep text-[12px] dark:text-white">
              {label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onConnect}
        className="bg-brand-gradient mt-5 h-11 w-full max-w-[320px] rounded-full text-[12px] font-medium tracking-[0.06em] text-white uppercase transition-all hover:brightness-110 active:scale-98"
      >
        Connect an account
      </button>
    </div>
  );
}
