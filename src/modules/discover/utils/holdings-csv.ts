import { StrategyAnalyticsResponse } from "@/api/generated/strategy-apis/models";

const CSV_COLUMNS = [
  ["Ticker", "Ticker"],
  ["Company_Name", "Company"],
  ["Industry", "Industry"],
  ["Size", "Size"],
  ["weight", "Weight (%)"],
] as const;

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Saves an advisor strategy's holdings as a CSV file. */
export function downloadHoldingsCsv(strategy: StrategyAnalyticsResponse) {
  const rows = [
    CSV_COLUMNS.map(([, label]) => label).join(","),
    ...strategy.analytics.holdings.map((h) =>
      CSV_COLUMNS.map(([key]) =>
        key === "weight" ? Number(h.weight ?? 0).toFixed(2) : cell(h[key]),
      ).join(","),
    ),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${strategy.display_name || strategy.strategy} holdings.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
