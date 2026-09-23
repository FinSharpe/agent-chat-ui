"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DataPanel,
  formatPct,
} from "@/modules/import-data/components/shared/ui";
import { riskTone, scoreTone, shortCategory } from "./analysis-utils";

type Row = { [key: string]: unknown };

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

const COLLAPSED = 4;

/**
 * Per-scheme table from the MF analytics holdings, in the reference "Fund
 * Details" style: fund + category, 1Y return, performance and risk scores,
 * collapsed to four rows behind "Show all N funds".
 */
export function FundDetailsCard({ holdings }: { holdings: Row[] | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const rows = (holdings ?? []).filter(
    (h) => typeof h.Scheme_Name === "string",
  );
  if (rows.length === 0) return null;
  const visible = expanded ? rows : rows.slice(0, COLLAPSED);

  return (
    <DataPanel
      title="Fund Details"
      addon={`${rows.length} fund${rows.length === 1 ? "" : "s"}`}
      bodyClassName="space-y-4"
    >
      <table className="w-full table-fixed border-collapse text-left text-[11px]">
        <thead>
          <tr className="border-b border-slate-50 font-medium text-slate-400 uppercase dark:border-slate-800">
            <th className="pb-2 font-medium">Fund</th>
            <th className="w-14 pb-2 text-right font-medium">1Y</th>
            <th className="w-12 pb-2 text-right font-medium">Perf</th>
            <th className="w-12 pb-2 text-right font-medium">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/30">
          {visible.map((h, i) => {
            const y = num(h.Y_per);
            const perf = num(h.PerformanceScore);
            const risk = num(h.RiskScore);
            return (
              <tr key={String(h.ISIN ?? i)}>
                <td className="py-2.5 pr-2">
                  <span
                    className="text-forest-deep block truncate font-medium dark:text-white"
                    title={String(h.Scheme_Name)}
                  >
                    {String(h.Scheme_Name)}
                  </span>
                  {typeof h.Sebi_Category === "string" && (
                    <span className="block truncate text-[9px] text-slate-400">
                      {shortCategory(h.Sebi_Category)}
                    </span>
                  )}
                </td>
                <td
                  className={`py-2.5 text-right font-medium tabular-nums ${y === null ? "text-slate-400" : y >= 0 ? "text-[#0A9E6E]" : "text-rose-500"}`}
                >
                  {formatPct(y)}
                </td>
                <td
                  className={`py-2.5 text-right font-medium tabular-nums ${scoreTone(perf).text}`}
                >
                  {perf === null ? "—" : Math.round(perf)}
                </td>
                <td
                  className={`py-2.5 text-right font-medium tabular-nums ${riskTone(risk).text}`}
                >
                  {risk === null ? "—" : Math.round(risk)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > COLLAPSED && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1 text-[10px] font-medium text-[#063BAA] hover:underline dark:text-[#8FB4FF]"
        >
          {expanded ? (
            <>
              <span>Hide details</span>
              <ChevronUp size={11} />
            </>
          ) : (
            <>
              <span>Show all {rows.length} funds</span>
              <ChevronDown size={11} />
            </>
          )}
        </button>
      )}
    </DataPanel>
  );
}
