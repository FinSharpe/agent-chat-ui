"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import FeatureHeader from "@/components/discover/FeatureHeader";
import { PopupFrame } from "@/components/shared/Popup";
import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { staticIdeaCategories } from "../../constants/discover-data";
import { useStrategyCatalog } from "../../hooks/useStrategyCatalog";
import { StrategyDetail } from "../strategy-detail/StrategyDetail";
import { IdeaCategoryCard } from "./IdeaCategoryCard";

/**
 * Explore Investment Ideas — the strategy catalog as collapsible category
 * cards. A strategy opens as a popup over the list on desktop and replaces
 * the list on mobile.
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
  // A deep link to a static basket opens with its category expanded.
  const [open, setOpen] = useState<string | null>(
    () =>
      staticIdeaCategories.find((c) =>
        c.strategies.some((s) => s.id === selectedId),
      )?.id ?? "advisors",
  );
  const { categories, advisorStrategies } = useStrategyCatalog();
  const isDesktopWeb = useIsDesktopWeb();

  const detail = selectedId ? (
    <StrategyDetail
      strategyId={selectedId}
      listItem={advisorStrategies.find((s) => s.id === selectedId)}
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
        subtitle="Curated baskets and thematic strategies"
        onBack={onBack}
      />
      <div className="scrollbar-none flex-1 space-y-6 overflow-y-auto px-5 py-5 pb-[130px]">
        <SectionBanner
          eyebrow="Explore"
          title="Curated baskets, grouped by how they're built"
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
