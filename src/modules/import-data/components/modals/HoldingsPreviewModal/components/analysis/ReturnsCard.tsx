"use client";
import { LineChart as LineChartIcon } from "lucide-react";
import {
  DataPanel,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import {
  TrendChart,
  type TrendSeries,
} from "@/modules/import-data/components/shared/ui/TrendChart";
import { monthTicks } from "@/modules/import-data/components/shared/ui/chart-ticks";

/** Loose shape covering both the equity and MF `returns_chart_data` payloads:
 * date-keyed rows of `{ date: ms, <series>: cumulative return % }`. */
type ReturnsChart = {
  data?: Array<Record<string, unknown>>;
  title?: string;
  description?: string;
};

const fmtMonth = (t: unknown) =>
  new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
    new Date(Number(t)),
  );
const fmtFull = (t: unknown) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(Number(t)));

// Reference chart palette: the portfolio in brand blue, the benchmark as a
// dashed grey line, anything else in mint / amber.
const EXTRA = ["#97edcc", "#F59E0B", "#8B5CF6"];

function seriesFor(keys: string[]): TrendSeries[] {
  const primary = keys.find((k) => /portfolio/i.test(k)) ?? keys[0];
  let extra = 0;
  return keys.map((key) => {
    if (key === primary) return { key, color: "#063BAA" };
    if (extra === 0) {
      extra += 1;
      return { key, color: "#94A3B8", dashed: true };
    }
    return { key, color: EXTRA[(extra++ - 1) % EXTRA.length] };
  });
}

/** Cumulative returns of the portfolio against its benchmark, over the run. */
export function ReturnsCard({ data }: { data: ReturnsChart | undefined }) {
  const rows = (data?.data ?? []).filter((r) => r && r.date != null);
  const keys = Object.keys(rows[0] ?? {}).filter((k) => k !== "date");
  if (rows.length < 2 || keys.length === 0) return null;
  const series = seriesFor(keys);
  const last = rows[rows.length - 1];

  return (
    <DataPanel
      title={data?.title || "Cumulative Returns"}
      icon={LineChartIcon}
      bodyClassName="space-y-3"
    >
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
        {series.map((s) => {
          const v = Number(last[s.key]);
          return (
            <span
              key={s.key}
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: s.color }}
              />
              {s.key}
              <span
                className={`font-medium tabular-nums ${v >= 0 ? "text-[#0A9E6E]" : "text-rose-500"}`}
              >
                {formatPct(v)}
              </span>
            </span>
          );
        })}
      </div>
      <TrendChart
        kind="line"
        data={rows}
        xKey="date"
        numericX
        series={series}
        showLegend={false}
        height={150}
        xTicks={monthTicks(Number(rows[0].date), Number(last.date))}
        xTickFormatter={fmtMonth}
        tooltipLabelFormatter={fmtFull}
        valueFormatter={(v) => formatPct(v, { decimals: 2 })}
      />
      {data?.description && (
        <p className="text-[8.5px] text-slate-400">{data.description}</p>
      )}
    </DataPanel>
  );
}
