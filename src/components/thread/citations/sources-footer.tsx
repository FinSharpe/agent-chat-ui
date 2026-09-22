"use client";

import { ChevronRight, FileText } from "lucide-react";

import {
  citationDisplayName,
  citationLabel,
  citationMeta,
  type CitationRegistry,
} from "@/lib/citations";

import { useCitationViewer } from "./provider";

/**
 * The provenance floor: every filing the turn consulted, listed under the
 * answer whether or not the model tagged a single sentence.
 *
 * This is not a fallback for the inline chips — it is the floor beneath them.
 * If the model fails to cite on a given turn, the reader still gets provenance,
 * and a compliance miss costs polish rather than sources.
 *
 * Deduplicated by filing, so three passages from one annual report list once.
 */
export function CitationSourcesFooter({
  registry,
}: {
  registry: CitationRegistry;
}) {
  const viewer = useCitationViewer();
  const documents = registry.documents;
  if (documents.length === 0) return null;

  return (
    <div className="mt-4 mb-1">
      <p className="mb-2 px-1 text-[9px] font-medium tracking-wider text-slate-400 uppercase">
        Sources
      </p>
      <div className="divide-y divide-slate-50 overflow-hidden rounded-nested border border-slate-100">
        {documents.map((citation) => (
          <button
            key={citation.documentId || citation.cite}
            type="button"
            aria-label={citationLabel(citation)}
            // A row stands for the filing, so opening it shows every passage
            // the turn drew from that filing — not the first one dressed up as
            // the whole document.
            onClick={() =>
              viewer?.open(
                registry.passagesOf(citation.documentId).length > 0
                  ? registry.passagesOf(citation.documentId)
                  : [citation],
              )
            }
            className="hover-tint flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-tile bg-[#063BAA]/8 text-[#063BAA]">
              <FileText size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium text-[#0A1F4D]">
                {citationDisplayName(citation)}
              </span>
              <span className="block truncate text-[10px] text-slate-400">
                {citationMeta(citation, { withPage: false })}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
