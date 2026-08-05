export type { Citation, CitationBox, CoordOrigin } from "./types";
export { getCitationsPayload, parseCitation } from "./parse";
export {
  buildCitationRegistry,
  emptyCitationRegistry,
  type CitationRegistry,
} from "./registry";
export {
  buildCitationNumbering,
  CITATION_MARKER,
  emptyCitationIndex,
  EMPTY_NUMBERING,
  resolveCitations,
  stripCitationMarkers,
  type CitationIndex,
  type CitationNumbering,
} from "./resolve";
export {
  citationDisplayName,
  citationLabel,
  citationMeta,
  filingDateLabel,
  filingTypeLabel,
} from "./format";
export { highlightsFor, rectToHighlight, type HighlightRect } from "./geometry";
