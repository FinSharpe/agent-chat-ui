"use client";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import {
  Layers,
  PieChart,
  Repeat,
  TrendingUp,
  Umbrella,
  Wallet,
} from "lucide-react";
import { forwardRef } from "react";
import { BankAccountsPreviewModal } from "../modals/BankAccountsPreviewModal";
import { EquitiesPreviewModal } from "../modals/EquitiesPreviewModal";
import { EtfPreviewModal } from "../modals/EtfPreviewModal";
import { MutualFundsPreviewModal } from "../modals/MutualFundsPreviewModal";
import { SipPreviewModal } from "../modals/SipPreviewModal";
import { SectionTitle } from "../page/SectionTitle";
import { AccountTypeCard, ComingSoonAccountRow } from "./AccountTypeCard";
import { MoneyOneHoldingsCard } from "./MoneyOneHoldingsCard";

/**
 * Connected Accounts — every account type in one list, in the reference's
 * order, with the app's ETF and SIP links placed beside their siblings.
 * Account Aggregator types connect through MoneyOne; FD, insurance, real
 * estate, commodities and other are manual trackers; NPS has no link yet.
 * Desktop frames the list in one card; mobile leaves it cardless.
 */
export const ConnectedAccounts = forwardRef<HTMLElement>(
  function ConnectedAccounts(_, ref) {
    const isDesktopWeb = useIsDesktopWeb();
    return (
      <section
        ref={ref}
        className={`scroll-mt-6 ${isDesktopWeb ? "space-y-2" : "space-y-1"}`}
      >
        <SectionTitle>Connected Accounts</SectionTitle>
        <div
          className={
            isDesktopWeb
              ? "glass-card premium-shadow-sm rounded-card px-5 py-3"
              : undefined
          }
        >
          <MoneyOneHoldingsCard
            tone={0}
            consentType={ConsentType.EQUITIES}
            icon={TrendingUp}
            title="Equity Holdings"
            description="Connect your demat account to sync equity stocks and derivatives"
            AnalysisModal={EquitiesPreviewModal}
          />
          <MoneyOneHoldingsCard
            tone={1}
            consentType={ConsentType.MUTUAL_FUNDS}
            icon={PieChart}
            title="Mutual Fund Holdings"
            description="Import mutual fund portfolios from AMCs and platforms"
            AnalysisModal={MutualFundsPreviewModal}
          />
          <MoneyOneHoldingsCard
            tone={2}
            consentType={ConsentType.ETF}
            icon={Layers}
            title="ETF Holdings"
            description="Connect to sync Exchange Traded Fund holdings"
            AnalysisModal={EtfPreviewModal}
          />
          <MoneyOneHoldingsCard
            tone={3}
            consentType={ConsentType.SIP}
            icon={Repeat}
            title="SIP Accounts"
            description="View your Systematic Investment Plan registrations"
            AnalysisModal={SipPreviewModal}
          />
          <AccountTypeCard
            tone={4}
            category="fd"
          />
          <ComingSoonAccountRow
            tone={5}
            icon={Umbrella}
            title="NPS"
            description="Import National Pension System contributions and NAV data"
          />
          <AccountTypeCard
            tone={6}
            category="insurance"
          />
          <MoneyOneHoldingsCard
            tone={7}
            consentType={ConsentType.BANK_ACCOUNTS}
            icon={Wallet}
            title="Bank Accounts"
            description="Import savings, current account statements and transactions"
            AnalysisModal={BankAccountsPreviewModal}
          />
          <AccountTypeCard
            tone={8}
            category="realestate"
          />
          <AccountTypeCard
            tone={9}
            category="commodities"
          />
          <AccountTypeCard
            tone={10}
            category="other"
          />
        </div>
      </section>
    );
  },
);
