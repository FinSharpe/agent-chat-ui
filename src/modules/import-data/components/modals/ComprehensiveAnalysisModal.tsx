/**
 * Comprehensive Analysis Modal — renders the reference "Run Comprehensive
 * Analysis" gradient button and opens a reference analysis popup listing
 * which connected accounts are ready, what the analysis covers, and the run
 * action (which asks chat for the analysis; the agent reads the book itself).
 */

"use client";
import { useMemo, type ComponentType } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  PieChart,
  Repeat,
  TrendingUp,
} from "lucide-react";
import useModalState from "@/hooks/useModalState";
import { cn } from "@/lib/utils";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import { useAaPortfolio } from "../../hooks/useAaPortfolio";
import { useComprehensiveAnalysisMutation } from "../../hooks/useComprehensiveAnalysisMutation";
import {
  DataPanel,
  FlagList,
  FooterButton,
  ImportOverlay,
  Notice,
  OverlayBody,
  OverlayFooter,
  OverlayHeader,
  StatGrid,
  StatTile,
} from "../shared/ui";

type IconType = ComponentType<{ size?: number }>;

const ACCOUNT_TYPES: { type: ConsentType; label: string; icon: IconType }[] = [
  { type: ConsentType.EQUITIES, label: "Equity Holdings", icon: BarChart3 },
  {
    type: ConsentType.MUTUAL_FUNDS,
    label: "Mutual Fund Holdings",
    icon: PieChart,
  },
  { type: ConsentType.ETF, label: "ETF Holdings", icon: TrendingUp },
  { type: ConsentType.BANK_ACCOUNTS, label: "Bank Accounts", icon: CreditCard },
  { type: ConsentType.SIP, label: "SIP Accounts", icon: Repeat },
];

const TONES = [
  "bg-[#063BAA]/8 text-[#063BAA]",
  "bg-[#97edcc]/30 text-[#0A9E6E]",
  "bg-[#0A1F4D]/8 text-forest-deep dark:text-white",
];

const WHAT_YOU_GET = [
  "Holistic view of your entire portfolio across all connected accounts",
  "AI-powered insights on asset allocation and diversification",
  "Personalized recommendations based on your complete financial picture",
  "Cross-asset correlation analysis and risk assessment",
];

type Status = "ready" | "syncing" | "none";

const STATUS: Record<
  Status,
  { line: string; lineClass: string; pill: string; pillClass: string }
> = {
  ready: {
    line: "Ready for analysis",
    lineClass: "text-[#0A9E6E]",
    pill: "Ready",
    pillClass: "bg-[#97edcc]/25 text-[#0A9E6E]",
  },
  syncing: {
    line: "Connected, fetching data…",
    lineClass: "text-amber-600",
    pill: "Syncing",
    pillClass: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  },
  none: {
    line: "Not connected",
    lineClass: "text-slate-400",
    pill: "Not connected",
    pillClass: "bg-slate-100 text-slate-500",
  },
};

export function ComprehensiveAnalysisModal() {
  const { open, handleOpen, handleClose } = useModalState();
  const comprehensiveAnalysisMutation = useComprehensiveAnalysisMutation();

  // The signed-in user's consents, as the account rows see them. A class is
  // "ready" only once its data has actually landed on this device.
  const { positions } = useAaPortfolio();
  const positionsByType = useMemo(
    () => new Map(positions.map((p) => [p.type as ConsentType, p])),
    [positions],
  );

  const rows = ACCOUNT_TYPES.map((a) => {
    const position = positionsByType.get(a.type);
    const consent = position?.consents[0] ?? null;
    const status: Status = position?.hasData
      ? "ready"
      : consent
        ? "syncing"
        : "none";
    return { ...a, consent, status };
  });
  const ready = rows.filter((r) => r.status === "ready");
  const syncing = rows.filter((r) => r.status === "syncing").length;
  const hasReadyConsents = ready.length > 0;

  const handleAnalyze = () => {
    if (!hasReadyConsents) return;
    handleClose();
    comprehensiveAnalysisMutation.mutate({ positions });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="bg-brand-gradient flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-xs font-medium tracking-wide text-white uppercase transition-all hover:brightness-110 active:scale-98"
      >
        Run Comprehensive Analysis <ArrowRight size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <ImportOverlay
            onClose={handleClose}
            label="Comprehensive Portfolio Analysis"
          >
            <OverlayHeader
              title="Comprehensive Portfolio Analysis"
              subtitle={`${ready.length} of ${rows.length} accounts ready`}
              onClose={handleClose}
            />
            <OverlayBody>
              <StatGrid>
                <StatTile
                  label="Ready"
                  value={ready.length}
                  intent={hasReadyConsents ? "positive" : "neutral"}
                  hint="accounts with data"
                />
                <StatTile
                  label="Syncing"
                  value={syncing}
                  intent={syncing ? "warning" : "neutral"}
                  hint="fetching data"
                />
                <StatTile
                  label="Not Connected"
                  value={rows.length - ready.length - syncing}
                  hint="connect to include"
                />
              </StatGrid>

              <DataPanel
                title="Connected Accounts"
                addon={`${rows.length} types`}
              >
                <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {rows.map((r, idx) => {
                    const Icon = r.icon;
                    const s = STATUS[r.status];
                    return (
                      <div
                        key={r.type}
                        className="flex items-center gap-3.5 py-3"
                      >
                        <div
                          className={cn(
                            "rounded-tile flex h-10 w-10 shrink-0 items-center justify-center",
                            TONES[idx % TONES.length],
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-forest-deep text-[13px] leading-snug font-medium dark:text-white">
                            {r.label}
                          </p>
                          <p
                            className={cn(
                              "text-[10px] font-medium",
                              s.lineClass,
                            )}
                          >
                            {s.line}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase",
                            s.pillClass,
                          )}
                        >
                          {s.pill}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </DataPanel>

              <DataPanel title="What You'll Get">
                <FlagList
                  flags={WHAT_YOU_GET.map((text) => ({ text, warn: false }))}
                />
              </DataPanel>

              {!hasReadyConsents && (
                <Notice tone="warning">
                  Connect at least one account and wait for its data to sync
                  before running a comprehensive analysis.
                </Notice>
              )}
            </OverlayBody>
            <OverlayFooter>
              <FooterButton
                variant="secondary"
                onClick={handleClose}
              >
                Close
              </FooterButton>
              <FooterButton
                onClick={handleAnalyze}
                disabled={
                  !hasReadyConsents || comprehensiveAnalysisMutation.isPending
                }
                busy={comprehensiveAnalysisMutation.isPending}
                busyLabel="Analysing…"
              >
                Run Analysis
              </FooterButton>
            </OverlayFooter>
          </ImportOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
