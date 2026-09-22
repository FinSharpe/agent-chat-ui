"use client";
import FetchingFiDataModal from "@/components/moneyone/FetchingFiDataModal";
import {
  BANNER_WAVE,
  ScreenFooter,
  SectionBanner,
} from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useRef } from "react";
import { ConnectedAccounts } from "./account-types/ConnectedAccounts";
import { ComprehensiveAnalysisCard } from "./ComprehensiveAnalysisCard";
import { DataSecurityInfo } from "./DataSecurityInfo";
import { NetworthGraph } from "./NetworthGraph";
import { PortfolioNudges } from "./nudges/PortfolioNudges";
import { ImportViewToggle } from "./page/ImportViewToggle";
import { RbiApprovedPanel } from "./page/RbiApprovedPanel";
import { QuickUpload } from "./QuickUpload";
import { WatchlistView } from "./watchlist/WatchlistView";

const VIEWS = ["networth", "watchlist"] as const;
const TAGLINE = "Navigate through your financial journey.";

// The reference hides the My Net Worth / Watchlist pill until the watchlist
// goes live. The view is built and still opens from `?view=watchlist`; flip
// this to show the switch.
const SHOW_VIEW_TOGGLE = false;

/**
 * The Import tab — the reference Import screen on live data. The page owns
 * its scrolling (the shell gives it a fixed-height, overflow-hidden slot);
 * the root is the positioning context for full-page overlays. The view
 * (net worth / watchlist) lives in the URL so it survives reloads and Back.
 */
export function ImportDataPage() {
  const isDesktopWeb = useIsDesktopWeb();
  const accountsRef = useRef<HTMLElement>(null);
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEWS).withDefault("networth"),
  );

  const scrollToAccounts = () =>
    accountsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div
      data-import-root
      className="font-funnel relative flex h-full w-full flex-col overflow-hidden"
    >
      <div className="scrollbar-none h-full w-full flex-1 overflow-y-auto bg-transparent">
        <div
          className={
            isDesktopWeb
              ? "mx-auto w-full max-w-[calc(844px*var(--wx,1)_+_6px)] space-y-12 px-10 pt-[52px] pb-20"
              : "space-y-12 px-5 pt-5 pb-4"
          }
        >
          <SectionBanner
            eyebrow="Connect"
            title="Bring your entire portfolio into one place"
            tone="mint"
            height={260}
            image={BANNER_WAVE.sky}
            imageScrim
          />

          {SHOW_VIEW_TOGGLE && (
            <ImportViewToggle
              value={view}
              onChange={(v) => setView(v === "networth" ? null : v)}
            />
          )}

          {view === "networth" ? (
            <>
              <NetworthGraph onConnect={scrollToAccounts} />
              <PortfolioNudges />
              <RbiApprovedPanel />
              <ConnectedAccounts ref={accountsRef} />
              <ComprehensiveAnalysisCard />
              <SectionBanner
                eyebrow="Documents"
                title="Upload statements and reports securely, anytime"
                tone="mint"
                height={260}
                image="/graphics/import-documents.jpg"
                imageScrim
              />
              <QuickUpload />
              <DataSecurityInfo />
            </>
          ) : (
            <WatchlistView />
          )}

          {!isDesktopWeb && <ScreenFooter tagline={TAGLINE} />}
        </div>
        {isDesktopWeb && (
          <ScreenFooter
            wide
            tagline={TAGLINE}
          />
        )}
      </div>

      {/* Completes the MoneyOne consent on return from the AA and pulls the
          first data in (opens only when the return params are present). */}
      <FetchingFiDataModal />
    </div>
  );
}
