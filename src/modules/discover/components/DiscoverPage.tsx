"use client";
import { useGetAllStrategiesApiStrategiesGet } from "@/api/generated/strategy-apis/strategy-apis/strategy-apis";
import {
  AlertTriangle,
  BookOpen,
  Crown,
  Layers,
  Lightbulb,
  Newspaper,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  curatedBaskets,
  investorBaskets,
  newsBasedBaskets,
  researchPaperBaskets,
  specialBaskets,
  thematicBaskets,
} from "../constants/discover-data";
import { useIsMobile } from "@/hooks/useIsMobile";
import { AdvisorStrategyCard } from "./cards/AdvisorStrategyCard";
import { CustomBasketBuilderCard } from "./cards/CustomBasketBuilderCard";
import { InvestmentBasketCard } from "./cards/InvestmentBasketCard";
import { InvestorBasketCard } from "./cards/InvestorBasketCard";
import { ThematicBasketCard } from "./cards/ThematicBasketCard";
import { DropdownSection } from "./sections/DropdownSection";
import { CollapsibleInfo } from "./shared/CollapsibleInfo";
import {
  CarouselBanner,
  type CarouselSlide,
} from "@/modules/core/common/ui/CarouselBanner";
import { ResearchReportsCard } from "@/modules/pipelines";

const discoverSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Discover",
    subtitle: "Explore curated investment portfolios tailored to your goals",
    image: "/banners/futuristic_analyst.png",
  },
  {
    id: 2,
    title: "Discover",
    subtitle: "Expert-curated investment baskets and thematic strategies",
    image: "/banners/aesthetic_tablet.png",
  },
  {
    id: 3,
    title: "Discover",
    subtitle: "Emerging market trends and investment opportunities",
    image: "/banners/futuristic_tablet.png",
  },
  {
    id: 4,
    title: "Discover",
    subtitle: "Proven strategies from legendary investors",
    image: "/banners/reports.png",
  },
];

/**
 * Main Discover page component
 * Orchestrates all sub-components and manages section expansion state
 * Displays investment baskets organized by categories with collapsible sections
 */
export function DiscoverPage() {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    advisorStrategies: false,
    specialOpportunities: false,
    newsBasedBaskets: false,
    researchPaperBaskets: false,
    curatedBaskets: false,
    thematicThemes: false,
    investorStrategies: false,
  });

  // Fetch advisor strategies from API
  const { data, isLoading, error } = useGetAllStrategiesApiStrategiesGet();
  const advisorStrategies = data?.data.strategies || [];

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Define all sections with their properties
  const allSections = [
    {
      id: "advisorStrategies",
      title: "Created by Advisors",
      icon: Users,
      iconColor: "text-accent-purple",
      count: advisorStrategies.length,
      content: (
        <>
          {isLoading && (
            <div className="text-text-secondary py-4 text-center">
              Loading strategies...
            </div>
          )}
          {error ? (
            <div className="py-4 text-center text-red-500">
              Failed to load strategies. Please try again later.
            </div>
          ) : null}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 md:gap-6">
              {advisorStrategies.map((strategy, index) => (
                <AdvisorStrategyCard
                  key={strategy.strategy || `advisor-${index}`}
                  strategy={strategy}
                />
              ))}
            </div>
          )}
        </>
      ),
    },
    {
      id: "specialOpportunities",
      title: "Special Investment Opportunities",
      icon: AlertTriangle,
      iconColor: "text-accent-red",
      count: specialBaskets.length,
      content: (
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 md:gap-6">
          {specialBaskets.map((basket, index) => (
            <InvestmentBasketCard
              key={`special-${index}`}
              {...basket}
            />
          ))}
        </div>
      ),
    },
    {
      id: "newsBasedBaskets",
      title: "News-Based Investment Baskets",
      icon: Newspaper,
      iconColor: "text-accent-blue",
      count: newsBasedBaskets.length,
      content: (
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 md:gap-6">
          {newsBasedBaskets.map((basket, index) => (
            <InvestmentBasketCard
              key={`news-${index}`}
              {...basket}
            />
          ))}
        </div>
      ),
    },
    {
      id: "researchPaperBaskets",
      title: "Ideas from Research Papers",
      icon: BookOpen,
      iconColor: "text-accent-indigo",
      count: researchPaperBaskets.length,
      content: (
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 md:gap-6">
          {researchPaperBaskets.map((basket, index) => (
            <InvestmentBasketCard
              key={`research-${index}`}
              {...basket}
            />
          ))}
        </div>
      ),
    },
    {
      id: "curatedBaskets",
      title: "Curated Investment Baskets",
      icon: Star,
      iconColor: "text-accent-yellow",
      count: curatedBaskets.length,
      content: (
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 md:gap-6">
          {curatedBaskets.map((basket, index) => (
            <InvestmentBasketCard
              key={`curated-${index}`}
              {...basket}
            />
          ))}
        </div>
      ),
    },
    {
      id: "thematicThemes",
      title: "Trending Investment Themes",
      icon: Layers,
      iconColor: "text-accent-purple",
      count: thematicBaskets.length,
      content: (
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 md:gap-6">
          {thematicBaskets.map((basket, index) => (
            <ThematicBasketCard
              key={`thematic-${index}`}
              {...basket}
            />
          ))}
        </div>
      ),
    },
    {
      id: "investorStrategies",
      title: "Famous Investor Strategies",
      icon: Crown,
      iconColor: "text-accent-amber",
      count: investorBaskets.length,
      content: (
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 md:gap-6">
          {investorBaskets.map((basket, index) => (
            <InvestorBasketCard
              key={`investor-${index}`}
              {...basket}
            />
          ))}
        </div>
      ),
    },
  ];

  // Reorder sections: if an odd-indexed section is expanded, move it to even index
  // This layout shift is only required for desktop view (2 columns)
  const isMobile = useIsMobile();
  const orderedSections = [...allSections];
  const expandedIndex = orderedSections.findIndex(
    (section) => expandedSections[section.id],
  );

  // If an odd-indexed section is expanded, swap it with the previous one
  if (!isMobile && expandedIndex > 0 && expandedIndex % 2 === 1) {
    [orderedSections[expandedIndex - 1], orderedSections[expandedIndex]] = [
      orderedSections[expandedIndex],
      orderedSections[expandedIndex - 1],
    ];
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-24">
      <div className="space-y-6 p-6">
        {/* Carousel Banner */}
        <CarouselBanner slides={discoverSlides} />

        <CollapsibleInfo
          title="Investment Discovery"
          description="Explore thematic baskets, trending investment themes, curated portfolios, and news-based investment opportunities tailored to your financial goals."
          icon={Lightbulb}
          bgColor="bg-info-bg border-info-border"
          iconBgColor="bg-info-icon-bg"
          textColor="text-info-foreground"
          iconColor="text-info-icon"
          defaultExpanded={true}
        />

        <ResearchReportsCard />

        <CustomBasketBuilderCard />

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {orderedSections.map((section) => (
            <DropdownSection
              key={section.id}
              title={section.title}
              icon={section.icon}
              iconColor={section.iconColor}
              count={section.count}
              isExpanded={expandedSections[section.id]}
              onToggle={() => toggleSection(section.id)}
              className={expandedSections[section.id] ? "md:col-span-2" : ""}
              isLoading={section.id === "advisorStrategies" ? isLoading : false}
            >
              {section.content}
            </DropdownSection>
          ))}
        </div>
      </div>
    </div>
  );
}
