"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { AaConsentType } from "../../types/aa";
import {
  ACCOUNT_ROW_ORDER,
  CLASS_LABELS,
  CLASS_PITCHES,
} from "../../utils/aa-fold";
import {
  CLASS_META,
  CLASS_TONE_CLASS,
} from "../account-types/account-class-meta";

/**
 * "What would you like to connect?" — the picker behind the empty state's CTA.
 * Each asset class is a separate consent, so the choice has to be made before
 * the mobile + PAN form (finsharpe-mobile `portfolio_tab.dart` ln 2151).
 */
export function ClassPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (type: AaConsentType) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-card font-funnel border-0 bg-white p-5 shadow-[0_24px_60px_rgba(10,31,77,0.28)] sm:max-w-[420px] dark:bg-[#0C1524]">
        <DialogTitle className="text-forest-deep text-[16px] font-semibold dark:text-white">
          What would you like to connect?
        </DialogTitle>
        <DialogDescription className="sr-only">
          Choose an asset class to connect through the Account Aggregator.
        </DialogDescription>

        <ul className="-mx-1 space-y-0.5">
          {ACCOUNT_ROW_ORDER.map((type) => {
            const { icon: Icon, tone } = CLASS_META[type];
            return (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => onPick(type)}
                  className="hover-tint flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left transition-colors"
                >
                  <span
                    className={cn(
                      "rounded-tile flex h-10 w-10 shrink-0 items-center justify-center",
                      CLASS_TONE_CLASS[tone],
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-forest-deep block text-[12px] font-medium dark:text-white">
                      {CLASS_LABELS[type]}
                    </span>
                    <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {CLASS_PITCHES[type]}
                    </span>
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-slate-400" />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          Each account type is a separate consent you approve on the Account
          Aggregator.
        </p>
      </DialogContent>
    </Dialog>
  );
}
