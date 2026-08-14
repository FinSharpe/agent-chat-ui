"use client";

import {
  formatTimestamp,
  vintageDetail,
  vintageSourceLabel,
} from "../../constants/presentation";
import type { ReportDocument } from "../../types/pipelines.types";
import { vintageRows } from "../../utils/report";
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
    <article className="space-y-4">
      <StanceHeader document={document} />

      {document.sections.map((section) => (
        <ReportSectionView
          key={section.step_id}
          section={section}
        />
      ))}

      <section className="border-border-default bg-bg-card rounded-xl border p-6">
        <h3 className="text-text-primary text-sm font-medium">
          What this report was built on
        </h3>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.source}
              className="border-border-subtle flex items-baseline justify-between gap-4 border-b pb-1.5 text-sm"
            >
              <dt className="text-text-secondary">
                {vintageSourceLabel(row.source)}
              </dt>
              <dd className="text-text-primary text-right">
                {vintageDetail(row.source, row.token)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-text-tertiary mt-3 text-xs">
          Published {formatTimestamp(document.published_at)} · run reference{" "}
          {document.run_id}
        </p>
      </section>

      {text && (
        <section className="border-border-default bg-bg-subtle rounded-xl border p-6">
          <h3 className="text-text-secondary text-sm font-medium">
            Disclaimer
          </h3>
          <p className="text-text-tertiary mt-2 text-xs leading-relaxed whitespace-pre-line">
            {text}
          </p>
        </section>
      )}
    </article>
  );
}
