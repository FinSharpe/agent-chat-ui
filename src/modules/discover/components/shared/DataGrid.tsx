"use client";

import React from "react";

/* Two shapes the IPO analysis shows figures in: a grid of labelled multiples,
   and a small numeric table. Both are read-only presentations of the
   backend's own numbers — nothing here computes anything. */

/**
 * One figure as a tile. A missing value is an em dash, muted, never a missing
 * tile: an absent tile reads as a layout fault, where a dash reads as an
 * absent number, which is what it is.
 */
export function StatTile({
  caption,
  value,
  muted = false,
}: {
  caption: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-nested bg-slate-50 px-3.5 py-3">
      <span className="block text-[9px] font-medium tracking-wider text-slate-400 uppercase">
        {caption}
      </span>
      <span
        className={`font-geist mt-1 block text-[17px] font-medium tabular-nums ${muted ? "text-slate-400" : "text-[#0A1F4D]"}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Two-up, never three-across: a third-width cell clips its caption, and
 * "Post-money P/E" is exactly the caption that would clip.
 */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

/**
 * A small figures table. The first column is a label and the rest are
 * figures; the only colour on it marks a loss, the one number a reader must
 * not skim past.
 */
export function NumericTable({
  columns,
  rows,
  negativeRow,
}: {
  columns: string[];
  rows: string[][];
  /** One flag per row: this row carries a loss. */
  negativeRow?: boolean[];
}) {
  return (
    <div className="scrollbar-none rounded-nested overflow-x-auto border border-slate-100">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-50">
            {columns.map((column, i) => (
              <th
                key={column}
                className={`px-3 py-2 text-[9px] font-medium tracking-wider whitespace-nowrap text-slate-400 uppercase ${i === 0 ? "text-left" : "text-right"}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              className="border-t border-slate-100"
            >
              {row.map((value, c) => (
                <td
                  key={c}
                  className={`px-3 py-2 whitespace-nowrap ${
                    c === 0
                      ? "text-left text-[#0A1F4D]"
                      : `text-right tabular-nums ${negativeRow?.[r] ? "text-rose-500" : "text-[#0A1F4D]"}`
                  }`}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
