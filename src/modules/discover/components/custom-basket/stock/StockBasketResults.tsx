"use client";

import { AlertTriangle, Package } from "lucide-react";

import { useAppNavigation } from "@/hooks/useAppNavigation";
import { PortfolioMetric } from "@/modules/core/portfolio/constants/portfolio-metrics";
import {
  marketCapOptions,
  portfolioAllocationOptions,
  portfolioSizeOptions,
  investmentStyleOptions,
} from "../../../constants/stock-basket-data";
import { useBasketBuilderContext } from "../../../hooks/useBasketBuilderContext";
import { useStockBasketBuilderContext } from "../../../hooks/useStockBasketBuilderContext";
import { generateBasketName } from "../../../utils/generateBasketName";
import {
  basketChatMessage,
  num,
  pct,
  rupees,
  statNumber,
  statRows,
} from "../results/basketFormat";
import { BasketResultView } from "../results/BasketResultView";
import {
  AllocationSection,
  MetricRowsSection,
  PerformanceSection,
} from "../results/ResultSections";

const nameOf = <T extends { id: string; name: string }>(
  options: T[],
  id: string,
) => options.find((option) => option.id === id)?.name ?? id;

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

/**
 * The generated stock basket in the reference result layout, filled from the
 * portfolio API's answer: its CAGR, drawdown, volatility and Sharpe; its
 * holdings with their weight, price and size band; then the returns, sector
 * and size allocation and every statistic it reported.
 */
export function StockBasketResults() {
  const { createNewChat } = useAppNavigation();
  const { resetInvestmentType } = useBasketBuilderContext();
  const { basketConfig, generatedBasket, restart } =
    useStockBasketBuilderContext();

  if (!generatedBasket) return null;
  const analytics = generatedBasket.analytics;
  const stats = analytics.stats;

  const title = generateBasketName(generatedBasket.investment_style);
  const style = nameOf(investmentStyleOptions, basketConfig.investmentStyle);
  const allocation = nameOf(
    portfolioAllocationOptions,
    basketConfig.portfolioAllocation,
  );
  const isCustomCap = basketConfig.marketCap.includes("custom");
  const [low, high] = basketConfig.customMarketCapRange;
  const capWords = isCustomCap
    ? `within a ₹${low.toLocaleString("en-IN")}–${high.toLocaleString("en-IN")} Cr market-cap range`
    : `across ${joinWords(
        basketConfig.marketCap.map((cap) =>
          nameOf(marketCapOptions, cap).replace(" Cap", "").toLowerCase(),
        ),
      )} caps`;
  const description = `A ${allocation.toLowerCase()} basket of ${analytics.total_stocks} stocks selected for a ${style.toLowerCase()} tilt ${capWords}.`;

  const cagr = statNumber(stats, PortfolioMetric.CAGR);
  const preferences = [
    "Stocks",
    style,
    ...(isCustomCap
      ? [`₹${low.toLocaleString("en-IN")}–${high.toLocaleString("en-IN")} Cr`]
      : basketConfig.marketCap.map((cap) => nameOf(marketCapOptions, cap))),
    basketConfig.portfolioSize === "custom"
      ? `${basketConfig.customStockCount} stocks`
      : nameOf(portfolioSizeOptions, basketConfig.portfolioSize),
    allocation,
  ];

  const holdings = analytics.holdings.map((holding, index) => ({
    key: String(holding.Ticker ?? index),
    name: String(holding.Company_Name ?? holding.Ticker ?? "—"),
    cells: [
      {
        text: `${Number(holding.weight ?? 0).toFixed(1)}%`,
        className: "w-12 text-slate-500 dark:text-slate-400",
      },
      {
        text: rupees(holding.CMP),
        className: "w-[4.5rem] text-[#0A1F4D] dark:text-white",
      },
      {
        text: String(holding.Size ?? "—"),
        className: "w-12 text-slate-400",
      },
    ],
  }));
  const missing = analytics.missing_holdings ?? [];
  const metrics = statRows(stats);

  const chatRows = analytics.holdings.map((holding) => ({
    Ticker: String(holding.Ticker ?? ""),
    "Company Name": String(holding.Company_Name ?? "N/A"),
    Industry: String(holding.Industry ?? "N/A"),
    Size: String(holding.Size ?? "N/A"),
    "Weight (%)": Number(holding.weight ?? 0).toFixed(2),
  }));

  return (
    <BasketResultView
      icon={<Package size={20} />}
      title={title}
      description={description}
      stats={[
        { label: "CAGR", value: pct(cagr, true), accent: (cagr ?? 0) > 0 },
        { label: "Holdings", value: `${analytics.total_stocks}` },
        {
          label: "Max Drawdown",
          value: pct(statNumber(stats, PortfolioMetric.MaxDrawdown)),
        },
        {
          label: "Volatility",
          value: pct(statNumber(stats, PortfolioMetric.Volatility)),
        },
        {
          label: "Sharpe Ratio",
          value: num(statNumber(stats, PortfolioMetric.SharpeRatio)),
        },
      ]}
      preferences={preferences}
      holdings={holdings}
      holdingColumns={[
        { label: "Weight", className: "w-12" },
        { label: "Price", className: "w-[4.5rem]" },
        { label: "Size", className: "w-12" },
      ]}
      holdingsNotice={
        missing.length > 0 && (
          <p className="flex items-start gap-1.5 pb-1.5 text-[10px] leading-relaxed text-amber-600">
            <AlertTriangle
              size={12}
              className="mt-px shrink-0"
            />
            {missing.length}{" "}
            {missing.length === 1 ? "holding lacks" : "holdings lack"} price or
            screener data and {missing.length === 1 ? "is" : "are"} left out of
            the analytics: {missing.map((m) => m.Ticker).join(", ")}.
          </p>
        )
      }
      sections={
        <>
          <PerformanceSection chart={analytics.returns_chart_data} />
          <AllocationSection
            title="Sector Allocation"
            items={analytics.industry_distribution}
          />
          <AllocationSection
            title="Market Cap Allocation"
            items={analytics.size_distribution}
          />
          <MetricRowsSection
            title="Key Metrics"
            rows={metrics.rows}
            columns={metrics.columns}
          />
        </>
      }
      onInvest={() =>
        createNewChat(
          basketChatMessage(
            `I'd like to invest in the custom "${title}" I just built. Help me plan how to put money into it — the amount per stock at these weights, and whether to go in at once or stagger it.`,
            chatRows,
          ),
        )
      }
      onAddToChat={() =>
        createNewChat(
          basketChatMessage(
            `I have created a custom stock portfolio with a ${style.toLowerCase()} style. Review my custom "${title}" and suggest improvements.`,
            chatRows,
          ),
        )
      }
      onModify={() => {
        restart();
        resetInvestmentType();
      }}
    />
  );
}
