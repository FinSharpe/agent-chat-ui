"use client";

import { citationLabel, type Citation } from "@/lib/citations";

import { useCitationViewer } from "./provider";

/**
 * The numbered inline chip that follows a filings-derived claim.
 *
 * Sized for the line it sits in: a chip tall enough to be a comfortable
 * standalone target would set the line height of every paragraph it appears in.
 * The visible pill is padded out to a usable hit box instead, and every
 * document a chip points at is also reachable from a full-size row in the
 * sources footer below.
 *
 * The resolution pass drops the space before a marker, so the chip's own margin
 * is the whole gap rather than an addition to it.
 */
export function CitationChip({
  number,
  citation,
}: {
  number: number;
  citation: Citation;
}) {
  const viewer = useCitationViewer();

  return (
    <button
      type="button"
      onClick={() => viewer?.open([citation], number)}
      aria-label={citationLabel(citation, number)}
      title={citationLabel(citation, number)}
      className="mx-0.5 inline-flex h-[17px] min-w-[17px] translate-y-[-1px] items-center justify-center rounded-full bg-blue-50 px-1.5 align-middle text-[10.5px] leading-none font-semibold text-blue-700 tabular-nums transition-colors hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
    >
      {number}
    </button>
  );
}
