"use client";

/**
 * A Section's rule-authored rows.
 *
 * Not the same thing as `ChartTableView`, which is the reading of a chart the
 * reader can open under it. This is the Section's own content: a
 * cross-sectional Pipeline ranks many subjects, and the Section envelope —
 * headline, badge, paragraph, scalar tiles, charts — has no cell for a row. A
 * chart cannot carry a name, and the paragraph is the one place a determined
 * fact may never go.
 *
 * Every column declares its own unit and alignment, which is why this file
 * consults no dictionary: unlike `metrics`, a Table carries its presentation
 * on the wire, so a new Table from a later Pipeline renders correctly here
 * without a fourth per-key lookup being added first.
 */

import { cn } from "@/lib/utils";
// The digit grouping and the rupee rule only — not the per-key dictionary,
// which a Table never consults. Shared so one document cannot show two number
// formats, and so a price in a cell reads as it does in the tile above it.
import { group, rupees } from "../../constants/metric-dictionary";
import { vintageStampText } from "../../constants/presentation";
import type { TableColumn, TableSpec } from "../../types/pipelines.types";

function decimals(value: number): string {
  return Number.isInteger(value) ? group(value) : value.toFixed(1);
}

/**
 * One cell, rendered from the unit its **column** declares.
 *
 * A string passes through untouched — carrying names, sectors and verdicts is
 * the whole reason a Table exists where a chart could not serve.
 */
function formatCell(value: unknown, unit: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value !== "number" || Number.isNaN(value)) return String(value);

  // Rounds to zero at one decimal, so never print "−0.0%". The PDF clamps the
  // same way; a frozen document has to read the same on every surface.
  const n =
    (unit === "pct" || unit === "pp") && Math.abs(value) < 0.05 ? 0 : value;
  // The sign rides every unit, money included: a Table ranks subjects against
  // each other, so a negative crore figure is a real row and printing it
  // unsigned would read as a positive one.
  const sign = n < 0 ? "−" : "";
  const mag = Math.abs(n);
  switch (unit) {
    case "pct":
      return `${sign}${mag.toFixed(1)}%`;
    case "pp":
      return `${sign}${mag.toFixed(1)}pp`;
    case "cr":
      return `${sign}₹${group(Math.round(mag))} cr`;
    case "inr":
      return `${sign}${rupees(mag)}`;
    case "x":
      return `${sign}${mag.toFixed(1)}×`;
    default:
      return `${sign}${decimals(mag)}`;
  }
}

function alignClass(column: TableColumn): string {
  return column.align === "left" ? "text-left" : "text-right";
}

export function ReportTableView({ table }: { table: TableSpec }) {
  const columns = table.columns ?? [];
  if (!columns.length) return null;
  const rows = table.rows ?? [];

  return (
    <figure className="border-border-default bg-bg-card rounded-lg border p-4">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="text-text-primary text-sm font-medium">{table.title}</h4>
        {/* Optional here, unlike a chart: a Table may be derived from several
            sources at once, in which case no single stamp would be true. */}
        {table.vintage && (
          <span className="text-text-tertiary text-xs">
            {vintageStampText(table.vintage)}
          </span>
        )}
      </figcaption>

      {/* Sideways only. The scroller is the table's own box, so a wide ranking
          scrolls inside the Section instead of widening the page — but the
          rows are not capped and put behind a second vertical scrollbar: this
          is the Section's content, and the PDF and the app both show every
          row. A reader comparing the three must not find a different report. */}
      <div className="border-border-default overflow-x-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="bg-bg-subtle text-text-secondary">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-3 py-2 font-medium whitespace-nowrap",
                    alignClass(column),
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-border-subtle border-t"
              >
                {columns.map((column, columnIndex) => {
                  const text = formatCell(row?.[column.key], column.unit ?? "");
                  // The first column names the row, so it reads as its header.
                  const Cell = columnIndex === 0 ? "th" : "td";
                  return (
                    <Cell
                      key={column.key}
                      scope={columnIndex === 0 ? "row" : undefined}
                      className={cn(
                        "px-3 py-1.5 whitespace-nowrap tabular-nums",
                        columnIndex === 0
                          ? "text-text-secondary font-normal"
                          : "text-text-primary",
                        alignClass(column),
                      )}
                    >
                      {text}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rule-authored, like the rows: what they were selected or ordered by. */}
      {table.note && (
        <p className="text-text-tertiary mt-2 text-xs">{table.note}</p>
      )}
    </figure>
  );
}
