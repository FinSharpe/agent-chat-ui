"use client";

import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { badgeTone, stanceTone } from "../../constants/presentation";
import type { ReportDocument } from "../../types/pipelines.types";
import { summariseSections } from "../../utils/report";

/**
 * What a jump chip reads where the Section carries no Badge, keyed by status.
 * Each absence says its own thing: a coverage gap is about the stock, an
 * unbuilt section is about the report, and a failure is about the run.
 */
const ABSENT_CHIP_LABEL: Record<string, string> = {
  coverage_gap: "not covered",
  not_wired: "not built",
  failed: "unavailable",
};

/**
 * What a report frozen before the header took its own wording said.
 *
 * Every such document is a Deep Dive, whose header was exactly this sentence,
 * so an older report renders what it was published with rather than a blank
 * line. The section count is dropped rather than guessed: this fallback exists
 * precisely where nothing authored one.
 */
const LEGACY_CAPTION =
  "A summary of the section verdicts below. Not advice, not a price target, " +
  "and not a position size.";

/** What the slot is called on a report that named neither. */
const LEGACY_HEADING = "Stance";

/**
 * The header, and the way into the report.
 *
 * The heading and the caption are the Pipeline's, not this component's. They
 * were hard coded here to the word "Stance" and to a sentence naming eight
 * section verdicts, which is true of the eight-Step flagship and of no other
 * Pipeline: a market wide report fills this slot with the stocks its run
 * selected rather than with a verdict, and printing "Stance" over three
 * symbols would label a selection as a call on the market.
 *
 * The jump chips are built from `document.sections`, never from
 * `Stance.badges`: that list is positional and silently omits the Sections that
 * produced nothing, so zipping it against the section list mislabels every
 * badge after the first gap. Sections is the only source that keeps names,
 * order, and the gap/failed states — which are exactly what a reader needs to
 * decide where to jump.
 */
export function StanceHeader({ document }: { document: ReportDocument }) {
  const sections = summariseSections(document);
  const stance = document.stance;
  const tone = stanceTone(stance?.value);

  return (
    <header className="border-border-default bg-bg-card overflow-hidden rounded-xl border">
      <div className="border-border-subtle from-brand-gradient-from via-brand-gradient-via to-brand-gradient-to border-b bg-gradient-to-r px-6 py-5">
        <p className="text-text-tertiary text-xs tracking-wide uppercase">
          {stance?.heading || LEGACY_HEADING}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className={cn("size-2.5 rounded-full", tone.dot)} />
          <h2 className="text-text-primary text-xl font-semibold">
            {stance?.label || "No stance"}
          </h2>
        </div>
        <p className="text-text-tertiary mt-2 max-w-2xl text-xs">
          {stance?.caption || LEGACY_CAPTION}
        </p>
      </div>

      {document.degraded && (
        <p className="border-warning-border bg-warning-bg text-warning-fg flex items-start gap-2 border-b px-6 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          This report is incomplete: at least one section could not be produced.
          Every missing section is marked in place below.
        </p>
      )}

      <nav
        aria-label="Sections"
        className="px-6 py-4"
      >
        <ul className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const isAbsent = section.status !== "succeeded";
            const badge = badgeTone(section.badge?.value);
            return (
              <li key={section.stepId}>
                <a
                  href={`#${section.anchorId}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                    isAbsent
                      ? "border-border-default text-text-tertiary hover:bg-bg-hover border-dashed"
                      : cn(badge.chip, "hover:opacity-80"),
                  )}
                >
                  <span className="font-medium">{section.title}</span>
                  <span className="opacity-70">
                    {isAbsent
                      ? (ABSENT_CHIP_LABEL[section.status] ?? "unavailable")
                      : (section.badge?.label ?? "—")}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
