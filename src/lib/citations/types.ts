/**
 * The filings-citation wire shape (FinSharpe/finsharpe-agents#66).
 *
 * When the Orchestrator answers from company filings, the Filings MCP tags each
 * retrieved passage with a short opaque `cite` token and returns everything
 * needed to *resolve* that token — document, page, rectangles, verbatim quote —
 * on a parallel `citations` sidecar. The Orchestrator's registry middleware
 * lifts that sidecar onto the filings tool message's `additional_kwargs`, a
 * channel the model cannot read and that costs no model tokens. The answer text
 * then carries `[[cite]]` markers the client resolves against it.
 */

/**
 * A normalised (0..1) rectangle over a filing page, as stored in the corpus.
 * The viewer multiplies it against the rendered page box — there is no page
 * geometry lookup and no unit conversion.
 */
export interface CitationBox {
  l: number;
  t: number;
  r: number;
  b: number;
}

/** Which corner `t`/`b` are measured from. Note the underscore. */
export type CoordOrigin = "TOP_LEFT" | "BOTTOM_LEFT";

/**
 * One citable filing passage.
 *
 * `page`, `bboxes` and `coordOrigin` are each independently optional by
 * contract: a passage with a page but no rectangles still opens the right page,
 * and one with neither still identifies its document. Only `cite` is
 * load-bearing — it is the only thing the answer text carries, so an entry
 * without it can never be looked up and is dropped at parse time.
 */
export interface Citation {
  /** The opaque tag the answer text references as `[[cite]]`. */
  cite: string;
  chunkId: string;
  /**
   * Identifies the filing. The sources footer deduplicates on this — three
   * passages from one annual report are one source, not three.
   */
  documentId: string;
  symbol: string;
  compname: string;
  /** `concall` | `investor-presentation` | `annual-report` — a raw upstream value. */
  subcatname: string;
  newsDtIso: string;
  /** The upstream attachment id the PDF route takes verbatim. */
  attachmentName: string;
  /**
   * The verbatim chunk text the answer drew on. Shown immediately on click with
   * no network call — which is what makes a chip worth clicking before the
   * document has loaded at all.
   */
  quote: string;
  page: number | null;
  bboxes: CitationBox[];
  coordOrigin: CoordOrigin | null;
}
