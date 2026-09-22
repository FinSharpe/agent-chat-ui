"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { PopupFrame } from "@/components/shared/Popup";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { useStrategyCatalog } from "../../hooks/useStrategyCatalog";
import { StrategyDetail } from "../strategy-detail/StrategyDetail";
import { IdeaCategoryCard } from "./IdeaCategoryCard";

/**
 * Explore Investment Ideas — the strategy catalog as category cards. Only
 * "Created by Advisors" has anything behind it and so only it expands; the
 * rest are disabled (T-04). A strategy opens as a popup over the list on
 * desktop and replaces the list on mobile.
 */
export function ExploreIdeas({
  onBack,
  selectedId,
  onSelect,
  onCloseDetail,
}: {
  onBack: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCloseDetail: () => void;
}) {
  const [open, setOpen] = useState<string | null>("advisors");
  const { categories, advisorStrategies, advisorsResolved } =
    useStrategyCatalog();
  const isDesktopWeb = useIsDesktopWeb();

  const listItem = advisorStrategies.find((s) => s.id === selectedId);

  // A share link to one of the deleted static baskets (`?strategy=ipo-corner`)
  // names nothing that exists. Once the catalog has actually answered, such a
  // link lands on this page rather than on a detail screen with nothing in it.
  const stale = !!selectedId && advisorsResolved && !listItem;
  useEffect(() => {
    if (stale) onCloseDetail();
  }, [stale, onCloseDetail]);

  const detail =
    selectedId && !stale ? (
      <StrategyDetail
        strategyId={selectedId}
        listItem={listItem}
        onBack={onCloseDetail}
      />
    ) : null;
  // Mobile swaps the page for the detail; desktop keeps the page and opens it as a popup.
  if (detail && !isDesktopWeb) return detail;

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      {isDesktopWeb && (
        <AnimatePresence>
          {detail && <PopupFrame onClose={onCloseDetail}>{detail}</PopupFrame>}
        </AnimatePresence>
      )}
      <FeatureHeader
        title="Explore Investment Ideas"
        subtitle="Strategies built by FinSharpe's advisers"
        onBack={onBack}
      />
      <div className="scrollbar-none flex-1 space-y-6 overflow-y-auto px-5 py-5 pb-[130px]">
        <SectionBanner
          eyebrow="Explore"
          title="Adviser-built strategies, with the holdings and the record behind each one"
          tone="mint"
          height={260}
          image={BANNER_WAVE.royal}
          imageScrim
        />

        <div className="space-y-3">
          {categories.map((cat, idx) => (
            <IdeaCategoryCard
              key={cat.id}
              category={cat}
              index={idx}
              isOpen={open === cat.id}
              onToggle={() => setOpen(open === cat.id ? null : cat.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
