import { getCitationsPayload } from "./parse";
import type { Citation } from "./types";

/**
 * Every passage a turn's filings calls retrieved, keyed by tag.
 *
 * Merged across *all* filings calls in the turn, because the model may search
 * several times before answering and a marker can reference any of them. The
 * first entry for a tag wins, so a repeated search never rewrites a passage the
 * answer already referenced.
 *
 * Built even when the model cited nothing: the sources footer is the floor, the
 * inline chips are the ceiling.
 */
export interface CitationRegistry {
  /** Look a marker's tag up. */
  get(tag: string): Citation | undefined;
  /** One entry per filing, first-seen order — what the sources footer lists. */
  readonly documents: Citation[];
  /** Every passage the turn retrieved from one filing, in first-seen order. */
  passagesOf(documentId: string): Citation[];
  readonly isEmpty: boolean;
}

const EMPTY: CitationRegistry = {
  get: () => undefined,
  documents: [],
  passagesOf: () => [],
  isEmpty: true,
};

export function emptyCitationRegistry(): CitationRegistry {
  return EMPTY;
}

/** Build a registry from the citations carried by every message in a turn. */
export function buildCitationRegistry(
  turn: Iterable<object>,
): CitationRegistry {
  const byTag = new Map<string, Citation>();
  const documents: Citation[] = [];
  const seenDocuments = new Set<string>();

  for (const message of turn) {
    for (const citation of getCitationsPayload(message)) {
      if (byTag.has(citation.cite)) continue;
      byTag.set(citation.cite, citation);
      // Deduplicate the footer by filing, not by passage, and keep the order
      // the turn met them in.
      if (!seenDocuments.has(citation.documentId)) {
        seenDocuments.add(citation.documentId);
        documents.push(citation);
      }
    }
  }

  if (byTag.size === 0) return EMPTY;

  return {
    get: (tag) => byTag.get(tag),
    documents,
    // A footer row stands for the *document*, so opening it shows all of the
    // passages the answer was built from — not the first one dressed up as if
    // it represented the filing.
    passagesOf: (documentId) =>
      [...byTag.values()].filter((c) => c.documentId === documentId),
    isEmpty: false,
  };
}
