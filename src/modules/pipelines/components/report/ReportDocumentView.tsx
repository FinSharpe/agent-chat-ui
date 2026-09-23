"use client";

import {
  formatTimestamp,
  vintageDetail,
  vintageSourceLabel,
} from "../../constants/presentation";
import type { ReportDocument } from "../../types/pipelines.types";
import { vintageRows } from "../../utils/report";
import { Label } from "../shared/kit";
import { ReportSectionView } from "./ReportSectionView";
import { StanceHeader } from "./StanceHeader";

/**
 * The frozen document, rendered whole.
 *
 * Shared verbatim by the owner's report page and the public share view — a
 * shared report is the *same* document, not a trimmed preview, so there is one
 * renderer and no chance of the two drifting.
 */
export function ReportDocumentView({
  document,
  disclaimer,
}: {
  document: ReportDocument;
  /** The shared view passes the disclaimer explicitly; owners read it off the
   * document. Either way it is the frozen text, never a live one. */
  disclaimer?: string;
}) {
  const rows = vintageRows(document.vintage_map);
  const text = disclaimer ?? document.disclaimer ?? "";

  return (
    <article className="space-y-5">
      <StanceHeader document={document} />

      <div className="space-y-4">
        {document.sections.map((section) => (
          <ReportSectionView
            key={section.step_id}
            section={section}
          />
        ))}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        <section className="pb-5">
          <Label>What this report was built on</Label>
          <dl className="mt-1 grid gap-x-6 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.source}
                className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 dark:border-slate-800/60"
              >
                <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                  {vintageSourceLabel(row.source)}
                </dt>
                <dd className="text-right text-[11px] font-medium text-[#0A1F4D] tabular-nums dark:text-white">
                  {vintageDetail(row.source, row.token)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2.5 text-[10px] text-slate-400">
            Published {formatTimestamp(document.published_at)} · run reference{" "}
            {document.run_id}
          </p>
        </section>

        {text && (
          <section className="py-5">
            <Label>Disclaimer</Label>
            <p className="mt-2 text-[10px] leading-relaxed whitespace-pre-line text-slate-400">
              {text}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}
