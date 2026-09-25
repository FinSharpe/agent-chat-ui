import { ConsentType } from "@/modules/import-data/types/consent-type";
import type { NormalizedFi } from "@/modules/import-data/types/aa";
import { isInvestments } from "@/modules/import-data/types/aa";
import type {
  AnalysedHolding,
  AnalysisKind,
  ClassAnalysis,
  CostBasis,
  Distribution,
  MissingHolding,
  Snapshot,
} from "@/modules/import-data/types/holdings-analysis";
import type { EquityHoldingWithQuantity } from "@/modules/import-data/types/equities";
import type { MutualFundHoldingWithQuantity } from "@/modules/import-data/types/mutual-funds";
import { transformEquitiesToPortfolioItems } from "../../EquitiesPreviewModal/utils/equities-to-portfolio-items";
import { transformMutualFundsToPortfolioItems } from "../../MutualFundsPreviewModal/utils/mutual-funds-to-portfolio-items";
import type { HoldingWithQuantity } from "./holdings-transformer";

type Json = Record<string, unknown>;

export function analysisKind(consentType: ConsentType): AnalysisKind {
  if (consentType === ConsentType.EQUITIES) return "equities";
  if (consentType === ConsentType.ETF) return "etf";
  return "mutualFunds";
}

/** All a request reads off a holding; the ledger's rows carry more. */
export type AnalysisItem = Pick<HoldingWithQuantity, "isin" | "quantity">;

/**
 * The endpoint and body for one class's analysis. No `duration`: it only ever
 * shaped the returns window, which this view does not draw (finsharpe-agents#92).
 * ETFs have their own endpoint — the MF screener holds no ETF rows, so the MF
 * endpoint answers an ETF book with empty scores, categories and cost.
 */
export function analysisRequest(
  kind: AnalysisKind,
  holdings: AnalysisItem[],
): { url: string; body: Json; itemCount: number } {
  if (kind === "equities") {
    const items = transformEquitiesToPortfolioItems(
      holdings as unknown as EquityHoldingWithQuantity[],
    );
    return {
      url: "/api/utilities/portfolios/analyze",
      body: { items, input_unit: "quantity" },
      itemCount: items.length,
    };
  }
  const items = transformMutualFundsToPortfolioItems(
    holdings as unknown as MutualFundHoldingWithQuantity[],
  );
  if (kind === "etf") {
    return {
      url: "/api/utilities/etf-portfolios/analytics",
      body: {
        items: items.map((i) => ({ isin: i.symbol, quantity: i.quantity })),
        input_unit: "quantity",
      },
      itemCount: items.length,
    };
  }
  return {
    url: "/api/utilities/mf-portfolios/analytics",
    body: { items, input_unit: "quantity" },
    itemCount: items.length,
  };
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const list = (v: unknown): Json[] =>
  Array.isArray(v)
    ? (v.filter((x) => x && typeof x === "object") as Json[])
    : [];
const obj = <T>(v: unknown): T | null =>
  v && typeof v === "object" ? (v as T) : null;

const dist = (v: unknown): Distribution[] =>
  list(v)
    .map((d) => ({ name: str(d.name) ?? "—", value: num(d.value) ?? 0 }))
    .filter((d) => d.value !== 0);

const gauge = (v: unknown) => num(list(v)[0]?.value);

function missing(v: unknown): MissingHolding[] {
  return list(v).map((m) => ({
    id: str(m.Ticker) ?? str(m.ISIN) ?? str(m.symbol) ?? "",
    name: str(m.scheme_name),
    reason: str(m.reason) ?? "",
  }));
}

function holdings(kind: AnalysisKind, v: unknown): AnalysedHolding[] {
  return list(v).flatMap((h) => {
    const id =
      kind === "equities"
        ? str(h.Ticker)
        : kind === "etf"
          ? str(h.isin)
          : str(h.ISIN);
    if (!id) return [];
    const name =
      kind === "equities"
        ? str(h.Company_Name)
        : kind === "etf"
          ? str(h.scheme_name)
          : str(h.Scheme_Name);
    return [
      {
        id,
        name: name ?? id,
        weight: num(kind === "etf" ? h.weight_pct : h.weight) ?? 0,
        score:
          kind === "equities"
            ? num(h.FinSharpe_Overall_Score)
            : kind === "mutualFunds"
              ? num(h.PerformanceScore)
              : null,
      },
    ];
  });
}

/** Parse any of the three endpoints into the one shape the view renders. */
export function toClassAnalysis(kind: AnalysisKind, json: Json): ClassAnalysis {
  const snapshot = obj<Snapshot>(json.snapshot) ?? {};
  const base: ClassAnalysis = {
    kind,
    snapshot,
    holdings: holdings(kind, json.holdings),
    missing: missing(json.missing_holdings),
    primaryScore: null,
    riskScore: null,
    industry: [],
    size: [],
    categories: [],
    cost: obj(json.cost_analysis),
    etf: null,
  };
  if (kind === "equities") {
    return {
      ...base,
      cost: null,
      primaryScore: gauge(json.overall_score_chart_data),
      riskScore: gauge(json.risk_score_chart_data),
      industry: dist(json.industry_distribution),
      size: dist(json.size_distribution),
    };
  }
  if (kind === "mutualFunds") {
    return {
      ...base,
      primaryScore: gauge(json.performance_score_chart_data),
      riskScore: gauge(json.risk_score_chart_data),
      categories: dist(json.category_wise_allocations),
    };
  }
  const coverage = obj<{ holdings_analysed?: number }>(json.coverage);
  return {
    ...base,
    etf: {
      typeBreakdown: obj(json.type_breakdown),
      lookThrough: obj(json.look_through),
      trackRecord: obj(json.track_record),
      bookValue: num(json.book_value),
      nothingAnalysed:
        base.missing.length > 0 &&
        base.holdings.length === 0 &&
        (coverage?.holdings_analysed ?? 0) === 0,
    },
  };
}

/**
 * Cost basis from the consent's normalized block: the cost the FIP reported
 * and the value of exactly the accounts it reported it for. Null when no
 * account reported one — not every FIP does.
 */
export function costBasisOf(
  normalized: NormalizedFi | undefined,
): CostBasis | null {
  if (!normalized || !isInvestments(normalized)) return null;
  const cost = normalized.costValue;
  const covered = normalized.costBasisValue;
  if (cost == null || covered == null || cost <= 0) return null;
  const whole = normalized.currentValue ?? covered;
  return {
    cost,
    coveredValue: covered,
    coveragePct: whole <= 0 ? 100 : Math.min(100, (covered / whole) * 100),
  };
}
