"use client";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { Loader2 } from "lucide-react";
import { forwardRef, useState } from "react";
import { useAaPortfolio } from "../../hooks/useAaPortfolio";
import type { AaConsentType } from "../../types/aa";
import { ACCOUNT_ROW_ORDER } from "../../utils/aa-fold";
import { ClassPickerDialog } from "../connect/ClassPickerDialog";
import { ConnectAccountDialog } from "../connect/ConnectAccountDialog";
import { BankAccountsPreviewModal } from "../modals/BankAccountsPreviewModal";
import { EquitiesPreviewModal } from "../modals/EquitiesPreviewModal";
import { EtfPreviewModal } from "../modals/EtfPreviewModal";
import { MutualFundsPreviewModal } from "../modals/MutualFundsPreviewModal";
import { SipPreviewModal } from "../modals/SipPreviewModal";
import { SectionTitle } from "../page/SectionTitle";
import { AaAccountRow } from "./AaAccountRow";
import { AccountsEmptyState } from "./AccountsEmptyState";
import { ConnectionManageSheet } from "./ConnectionManageSheet";
import type { BaseAnalysisModalProps } from "../../types";

/** Each class's analysis surface. These own their own "Analyse" trigger. */
const ANALYSIS_MODALS: Record<
  AaConsentType,
  React.ComponentType<BaseAnalysisModalProps>
> = {
  EQUITIES: EquitiesPreviewModal,
  MUTUAL_FUNDS: MutualFundsPreviewModal,
  ETF: EtfPreviewModal,
  BANK_ACCOUNTS: BankAccountsPreviewModal,
  SIP: SipPreviewModal,
};

/**
 * "Your accounts" — one row per asset class, in a fixed order, whether or not
 * it is connected. Ported from finsharpe-mobile `_AccountsSection`
 * (`portfolio_tab.dart` ln 1418-1462): the count chip counts CLASSES, not
 * consents, and several consents of one class fold into a single row showing
 * the worst of their states.
 *
 * Only the five Account Aggregator consent types exist — the manual trackers
 * that used to sit here were never connectors and never reached a backend.
 */
export const ConnectedAccounts = forwardRef<HTMLElement>(
  function ConnectedAccounts(_, ref) {
    const isDesktopWeb = useIsDesktopWeb();
    const portfolio = useAaPortfolio();
    const [connectType, setConnectType] = useState<AaConsentType | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [manageType, setManageType] = useState<AaConsentType | null>(null);
    const [analysisType, setAnalysisType] = useState<AaConsentType | null>(null);

    const byType = new Map(portfolio.positions.map((p) => [p.type, p]));
    const managed = manageType ? byType.get(manageType) : null;

    return (
      <section
        ref={ref}
        className={`scroll-mt-6 ${isDesktopWeb ? "space-y-2" : "space-y-1"}`}
      >
        <div className="flex items-center gap-2">
          <SectionTitle>Your accounts</SectionTitle>
          {portfolio.hasConnections && (
            <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
              {portfolio.connectedClassCount} of {ACCOUNT_ROW_ORDER.length}
            </span>
          )}
        </div>

        <div
          className={
            isDesktopWeb
              ? "glass-card premium-shadow-sm rounded-card px-5 py-3"
              : undefined
          }
        >
          {portfolio.isLoading ? (
            <div
              role="status"
              aria-label="Loading your accounts"
              className="flex items-center justify-center py-12"
            >
              <Loader2
                size={20}
                className="animate-spin text-slate-400 motion-reduce:animate-none"
              />
            </div>
          ) : portfolio.isError ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <p className="text-forest-deep text-[13px] font-medium dark:text-white">
                Could not load your portfolio
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={portfolio.refetch}
                className="mt-2 rounded-full bg-[#063BAA]/8 px-5 py-2 text-[11px] font-medium text-[#063BAA] hover:brightness-95 dark:bg-[#22335C] dark:text-[#8FB4FF]"
              >
                Retry
              </button>
            </div>
          ) : !portfolio.hasConnections ? (
            <AccountsEmptyState onConnect={() => setPickerOpen(true)} />
          ) : (
            portfolio.positions.map((position) => {
              const AnalysisModal = ANALYSIS_MODALS[position.type];
              return (
                <AaAccountRow
                  key={position.type}
                  position={position}
                  trouble={portfolio.trouble}
                  onConnect={() => setConnectType(position.type)}
                  onOpenAnalysis={() => setAnalysisType(position.type)}
                  onManage={() => setManageType(position.type)}
                  analyseSlot={
                    <AnalysisModal
                      consent={position.consents[0] ?? null}
                      // Drops the shared mint `bg-[#DFF9EF]` / `text-[#0A1F4D]`
                      // classes, which design-system.css remaps with
                      // `!important` in dark; import.css then owns the pill's
                      // blue wash in both themes (see `.import-slot-analyse`).
                      triggerClassName="bg-transparent text-current"
                      open={analysisType === position.type}
                      onOpenChange={(next: boolean) =>
                        setAnalysisType(next ? position.type : null)
                      }
                    />
                  }
                />
              );
            })
          )}
        </div>

        <ClassPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPick={(type) => {
            setPickerOpen(false);
            setConnectType(type);
          }}
        />

        {connectType && (
          <ConnectAccountDialog
            type={connectType}
            open
            onOpenChange={(next) => !next && setConnectType(null)}
            onLinked={portfolio.refetch}
          />
        )}

        {managed && (
          <ConnectionManageSheet
            position={managed}
            trouble={portfolio.trouble}
            open
            onOpenChange={(next) => !next && setManageType(null)}
            onRenew={() => setConnectType(managed.type)}
          />
        )}
      </section>
    );
  },
);
