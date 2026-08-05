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
    <div className="mt-3 mb-1">
      <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wide uppercase">
        Sources
      </p>
      <div className="divide-border bg-card divide-y overflow-hidden rounded-lg border">
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
            className="hover:bg-muted/50 flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
          >
            <FileText className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {citationDisplayName(citation)}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {citationMeta(citation, { withPage: false })}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
