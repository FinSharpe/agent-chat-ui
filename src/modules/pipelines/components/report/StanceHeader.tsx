"use client";

import { AlertTriangle } from "lucide-react";

import { BANNER_WAVE, SectionBanner } from "@/components/shared/SectionKit";
import { cn } from "@/lib/utils";
import { SECTION_ABSENCE_CHIP } from "../../constants/presentation";
import type { ReportDocument } from "../../types/pipelines.types";
import { summariseSections } from "../../utils/report";
import { Notice } from "../shared/kit";

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

/** A section's jump chip, toned by the badge it earned. */
const BADGE_CHIP: Record<string, string> = {
  positive: "bg-[#97edcc]/30 text-[#0A9E6E]",
  caution:
    "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  neutral: "bg-[#063BAA]/8 text-[#063BAA]",
};

/**
 * The header, and the way into the report: the verdict as the page's banner,
 * the caption that bounds it, then a chip per section to jump to.
 *
 * The heading and the caption are the Pipeline's, not this component's: a
 * market wide report fills this slot with the stocks its run selected rather
 * than with a verdict, and printing "Stance" over three symbols would label a
 * selection as a call on the market. The banner stays one neutral colour for
 * the same reason — the Stance is never a green "buy" or a red "sell".
 *
 * The jump chips are built from `document.sections`, never from
 * `Stance.badges`: that list is positional and silently omits the Sections that
 * produced nothing, so zipping it against the section list mislabels every
 * badge after the first gap.
 */
export function StanceHeader({ document }: { document: ReportDocument }) {
  const sections = summariseSections(document);
  const stance = document.stance;

  return (
    <header className="space-y-3">
      <SectionBanner
        eyebrow={stance?.heading || LEGACY_HEADING}
        title={stance?.label || "No stance"}
        tone="blue"
        height={200}
        image={BANNER_WAVE.royal}
        imageScrim
      />
      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {stance?.caption || LEGACY_CAPTION}
      </p>

      {document.degraded && (
        <Notice
          tone="amber"
          icon={<AlertTriangle size={13} />}
        >
          This report is incomplete: at least one section could not be produced.
          Every missing section is marked in place below.
        </Notice>
      )}

      <nav aria-label="Sections">
        <ul className="flex flex-wrap gap-1.5">
          {sections.map((section) => {
            const isAbsent = section.status !== "succeeded";
            return (
              <li key={section.stepId}>
                <a
                  href={`#${section.anchorId}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] transition-opacity hover:opacity-80",
                    isAbsent
                      ? "border border-dashed border-slate-200 text-slate-400"
                      : (BADGE_CHIP[section.badge?.value ?? ""] ??
                          BADGE_CHIP.neutral),
                  )}
                >
                  <span className="font-medium">{section.title}</span>
                  <span className="opacity-75">
                    {isAbsent
                      ? (SECTION_ABSENCE_CHIP[section.status] ?? "unavailable")
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
