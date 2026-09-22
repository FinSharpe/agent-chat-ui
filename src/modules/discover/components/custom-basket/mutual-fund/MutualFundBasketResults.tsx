"use client";

import {
  AlertTriangle,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useAppNavigation } from "@/hooks/useAppNavigation";
import { PortfolioMetric } from "@/modules/core/portfolio/constants/portfolio-metrics";
import type { MFPortfolioItem } from "@/types/mf-portfolio";
import {
  categoryPreferenceOptions,
  planTypeOptions,
} from "../../../constants/mutual-fund-basket-data";
import { useBasketBuilderContext } from "../../../hooks/useBasketBuilderContext";
import { useMutualFundBasketBuilderContext } from "../../../hooks/useMutualFundBasketBuilderContext";
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

/** A fund's one-year return, the reference's coloured change column. */
function YearReturn({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-slate-400">—</span>;
  }
  const up = value >= 0;
  return (
    <span
      className={`flex items-center justify-end gap-0.5 font-medium ${up ? "text-[#0A9E6E]" : "text-rose-500"}`}
    >
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/**
 * The generated fund basket in the reference result layout, filled from the
 * MF portfolio API: CAGR, schemes, expense ratio, volatility and Sharpe; each
 * scheme with its weight and one-year return; then returns, category split,
 * running cost and every statistic it reported.
 */
export function MutualFundBasketResults() {
  const { createNewChat } = useAppNavigation();
  const { resetInvestmentType } = useBasketBuilderContext();
  const { basketConfig, portfolioResponse, restart } =
    useMutualFundBasketBuilderContext();

  if (!portfolioResponse) return null;
  const analytics = portfolioResponse.analytics;
  const stats = analytics.stats;
  const funds = analytics.holdings as unknown as MFPortfolioItem[];
  const cost = analytics.cost_analysis;

  const plan =
    planTypeOptions.find((option) => option.id === portfolioResponse.plan_type)
      ?.name ?? "Direct Plan";
  const preference = categoryPreferenceOptions.find(
    (option) => option.id === basketConfig.categoryPreference,
  )?.name;
  const categoryCount = portfolioResponse.categories.length;
  const title = `${plan} Mutual Fund Basket`;
  const description = `A ${plan.toLowerCase()} basket of ${analytics.total_schemes} ${analytics.total_schemes === 1 ? "scheme" : "schemes"} across ${categoryCount} fund ${categoryCount === 1 ? "category" : "categories"}, weighted to the split you set.`;

  const cagr = statNumber(stats, PortfolioMetric.CAGR);
  const preferences = [
    "Mutual Funds",
    plan,
    ...(preference ? [preference] : []),
    ...basketConfig.fundCategories.map(
      (category) => `${category.name} · ${category.percentage}%`,
    ),
  ];

  const holdings = funds.map((fund, index) => ({
    key: fund.ISIN || String(index),
    name: fund.Scheme_Name,
    cells: [
      {
        text: `${Number(fund.weight ?? 0).toFixed(1)}%`,
        className: "w-12 text-slate-500 dark:text-slate-400",
      },
      {
        text: <YearReturn value={fund.Y_per} />,
        className: "w-14",
      },
    ],
  }));
  const missing = analytics.missing_holdings ?? [];
  const metrics = statRows(stats);

  const chatRows = funds.map((fund) => ({
    "Scheme Name": String(fund.Scheme_Name ?? "N/A"),
    "SEBI Category": String(fund.Sebi_Category ?? "N/A"),
    "Weight (%)": Number(fund.weight ?? 0).toFixed(2),
    ISIN: String(fund.ISIN ?? "N/A"),
  }));

  return (
    <BasketResultView
      icon={<PieChart size={20} />}
      title={title}
      description={description}
      stats={[
        { label: "CAGR", value: pct(cagr, true), accent: (cagr ?? 0) > 0 },
        { label: "Schemes", value: `${analytics.total_schemes}` },
        {
          label: "Expense Ratio",
          value: cost ? pct(cost.weighted_expense_ratio) : "—",
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
        { label: "1Y", className: "w-14" },
      ]}
      holdingsNotice={
        missing.length > 0 && (
          <p className="flex items-start gap-1.5 pb-1.5 text-[10px] leading-relaxed text-amber-600">
            <AlertTriangle
              size={12}
              className="mt-px shrink-0"
            />
            {missing.length}{" "}
            {missing.length === 1 ? "scheme lacks" : "schemes lack"} screener
            data and {missing.length === 1 ? "is" : "are"} left out of the
            analytics.
          </p>
        )
      }
      sections={
        <>
          <PerformanceSection chart={analytics.returns_chart_data} />
          <AllocationSection
            title="Category Allocation"
            items={analytics.category_wise_allocations}
          />
          {cost && (
            <MetricRowsSection
              title="Running Cost"
              rows={[
                {
                  label: "Weighted expense ratio",
                  values: [pct(cost.weighted_expense_ratio)],
                },
                {
                  label: `Annual cost on ${rupees(cost.portfolio_value)}`,
                  values: [rupees(cost.annual_cost)],
                },
                {
                  label: `Monthly cost on ${rupees(cost.portfolio_value)}`,
                  values: [rupees(cost.monthly_cost)],
                },
              ]}
            />
          )}
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
            `I'd like to invest in the custom "${title}" I just built. Help me plan how to invest in it — a lump sum or a SIP per scheme at these weights.`,
            chatRows,
          ),
        )
      }
      onAddToChat={() =>
        createNewChat(
          basketChatMessage(
            `I have created a custom mutual fund portfolio with the ${plan.toLowerCase()}. Review my custom "${title}" and suggest improvements.`,
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
