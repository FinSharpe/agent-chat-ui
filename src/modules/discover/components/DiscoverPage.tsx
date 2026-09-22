"use client";

import { AnimatePresence, motion } from "framer-motion";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";
import { useDiscoverNavigation } from "../hooks/useDiscoverNavigation";
import { LocalDiscoverFeature } from "../types/discover.types";
import { DiscoverLanding } from "./landing/DiscoverLanding";
import { ExploreIdeas } from "./explore-ideas/ExploreIdeas";
import { NewsImpact } from "./news-impact/NewsImpact";
import { TradingIdeas } from "./trading-ideas/TradingIdeas";
import { GlobalInvesting } from "./global-investing/GlobalInvesting";

/**
 * The Discover tab: a landing list of features, each opening in place with
 * the reference's slide-in. Agent Workflows and Build Your Own Portfolios are
 * their own routes; the rest render here, driven by `?feature=`.
 */
export function DiscoverPage() {
  const isDesktopWeb = useIsDesktopWeb();
  const nav = useDiscoverNavigation();
  const { feature } = nav;

  const renderFeature = (f: LocalDiscoverFeature) => {
    switch (f) {
      case "news":
        return <NewsImpact onBack={nav.closeFeature} />;
      case "ideas":
        return (
          <ExploreIdeas
            onBack={nav.closeFeature}
            selectedId={nav.strategyId}
            onSelect={nav.openStrategy}
            onCloseDetail={nav.closeStrategy}
          />
        );
      case "trading":
        return <TradingIdeas onBack={nav.closeFeature} />;
      case "global":
        return <GlobalInvesting onBack={nav.closeFeature} />;
    }
  };

  return (
    <div className="font-funnel relative h-full w-full flex-1 overflow-hidden bg-transparent">
      <AnimatePresence mode="wait">
        {feature ? (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 flex flex-col"
          >
            {isDesktopWeb ? (
              <div className="mx-auto flex h-full min-h-0 w-full max-w-[calc(804px*var(--wx,1))] flex-col">
                {renderFeature(feature)}
              </div>
            ) : (
              renderFeature(feature)
            )}
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`scrollbar-none absolute inset-0 overflow-y-auto ${isDesktopWeb ? "" : "px-5 pt-5 pb-4"}`}
          >
            <DiscoverLanding
              isDesktopWeb={isDesktopWeb}
              onOpen={(id) => nav.openFeature(id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
