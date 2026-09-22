"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DollarSign, MessageSquarePlus, Pencil } from "lucide-react";

import FeatureHeader from "@/components/discover/FeatureHeader";
import { cn } from "@/lib/utils";

export interface ResultStat {
  label: string;
  value: string;
  accent?: boolean;
}

export interface HoldingCell {
  text: ReactNode;
  /** Column width and tone; the name column takes the rest. */
  className: string;
}

/** A holdings column's header — same width class as its cells. */
export interface HoldingColumn {
  label: string;
  className: string;
}

export interface ResultHolding {
  key: string;
  name: string;
  cells: HoldingCell[];
}

/** An uppercase section label, as the reference result page draws them. */
export function ResultLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h4
      className={cn(
        "text-[10px] font-medium tracking-wider text-slate-400 uppercase",
        className,
      )}
    >
      {children}
    </h4>
  );
}

/**
 * The generated basket as the reference result page: an identity block, a
 * divided stat grid, the preferences that produced it, the holdings, then
 * the actions. Everything in it is the generation API's answer; the flows
 * only choose which figures go where.
 *
 * `sections` carries the rest of the real analytics (performance, allocation,
 * key metrics) in the same cardless, hairline-divided language, so nothing
 * the builder returned is dropped on the way to the reference layout.
 */
export function BasketResultView({
  icon,
  title,
  description,
  stats,
  preferences,
  holdings,
  holdingColumns,
  holdingsNotice,
  sections,
  onInvest,
  onAddToChat,
  onModify,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  stats: ResultStat[];
  preferences: string[];
  holdings: ResultHolding[];
  /** Headers for the value columns. The reference's own rows go without;
   *  real holdings carry a size band or a one-year return that does not
   *  explain itself the way a price and a change do. */
  holdingColumns?: HoldingColumn[];
  holdingsNotice?: ReactNode;
  sections?: ReactNode;
  onInvest: () => void;
  onAddToChat: () => void;
  onModify: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title="Your Custom Basket"
        subtitle="AI-generated from your preferences"
        onBack={() => router.push("/discover")}
      />
      <div className="scrollbar-none flex-1 overflow-y-auto px-5 py-5 pb-[130px]">
        <div className="space-y-2">
          <div className="bg-brand-gradient rounded-nested mb-1 flex h-11 w-11 items-center justify-center text-white">
            {icon}
          </div>
          <h3 className="font-geist text-base font-medium text-[#0A1F4D] dark:text-white">
            {title}
          </h3>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-2 py-3 text-center"
            >
              <p className="text-[8px] leading-tight tracking-wider text-slate-400 uppercase">
                {stat.label}
              </p>
              <p
                className={cn(
                  "font-geist mt-1 text-[13px] font-medium tabular-nums",
                  stat.accent
                    ? "text-[#0A9E6E]"
                    : "text-[#0A1F4D] dark:text-white",
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          <section className="py-5">
            <ResultLabel>Your Preferences Applied</ResultLabel>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {preferences.map((preference) => (
                <span
                  key={preference}
                  className="rounded-full bg-[#063BAA]/8 px-2 py-1 text-[10px] font-medium text-[#063BAA]"
                >
                  {preference}
                </span>
              ))}
            </div>
          </section>

          <section className="py-5">
            <div className="flex items-center pb-1.5">
              <ResultLabel className="flex-1">Holdings</ResultLabel>
              {holdingColumns?.map((column) => (
                <span
                  key={column.label}
                  className={cn(
                    "shrink-0 text-right text-[9px] font-medium tracking-wider text-slate-400 uppercase",
                    column.className,
                  )}
                >
                  {column.label}
                </span>
              ))}
            </div>
            {holdingsNotice}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {holdings.map((holding) => (
                <div
                  key={holding.key}
                  className="flex items-center py-2.5"
                >
                  <span
                    className="flex-1 truncate pr-2 text-[11px] font-medium text-[#0A1F4D] dark:text-white"
                    title={holding.name}
                  >
                    {holding.name}
                  </span>
                  {holding.cells.map((cell, index) => (
                    <span
                      key={index}
                      className={cn(
                        "shrink-0 text-right text-[11px] tabular-nums",
                        cell.className,
                      )}
                    >
                      {cell.text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {sections}
        </div>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onInvest}
            className="bg-brand-gradient flex w-full items-center justify-center gap-1.5 rounded-full py-3.5 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98"
          >
            <DollarSign size={14} /> Invest in this Basket
          </button>
          <button
            type="button"
            onClick={onAddToChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#DFF9EF] py-3 text-xs font-medium tracking-wide text-[#0A1F4D] uppercase transition-colors"
          >
            <MessageSquarePlus size={14} /> Add to Chat
          </button>
          <button
            type="button"
            onClick={onModify}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-[#0A1F4D]"
          >
            <Pencil size={13} /> Modify Basket
          </button>
        </div>
      </div>
    </div>
  );
}
