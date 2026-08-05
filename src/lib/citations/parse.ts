import type { Citation, CitationBox, CoordOrigin } from "./types";

/**
 * Reading the citation registry off a tool message.
 *
 * Follows the MCP-Apps widget pattern exactly (`getMcpAppPayload`): the
 * Orchestrator attaches client-only structured content to
 * `ToolMessage.additional_kwargs`, and the client lifts it back off. The two
 * keys never collide — no tool is both an MCP-App and a filings search.
 *
 * Everything here fails soft. An un-upgraded backend, a malformed sidecar or a
 * tagless entry must degrade to "no chips", never to a broken transcript.
 */

/** Key under `additional_kwargs` the Orchestrator's registry middleware writes. */
const REGISTRY_KEY = "citations";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseBox(raw: unknown): CitationBox | null {
  if (!raw || typeof raw !== "object") return null;
  const box = raw as Record<string, unknown>;
  const l = asNumber(box.l);
  const t = asNumber(box.t);
  const r = asNumber(box.r);
  const b = asNumber(box.b);
  if (l === null || t === null || r === null || b === null) return null;
  return { l, t, r, b };
}

/**
 * The contract spells the origin with an underscore (`TOP_LEFT`), but the raw
 * Docling values behind the corpus do not (`TOPLEFT`). Normalise rather than
 * match exactly: an origin we fail to recognise would silently flip every
 * rectangle on the page.
 */
function parseOrigin(raw: unknown): CoordOrigin | null {
  if (typeof raw !== "string") return null;
  const token = raw
    .trim()
    .toUpperCase()
    .replace(/[_\s-]/g, "");
  if (token === "TOPLEFT") return "TOP_LEFT";
  if (token === "BOTTOMLEFT") return "BOTTOM_LEFT";
  return null;
}

/**
 * Parse one sidecar entry. Returns null for anything a client could not
 * resolve — a non-object, or an entry with no usable tag.
 */
export function parseCitation(raw: unknown): Citation | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const cite = asString(entry.cite).trim();
  if (!cite) return null;

  const page = asNumber(entry.page);
  return {
    cite,
    chunkId: asString(entry.chunk_id),
    documentId: asString(entry.document_id),
    symbol: asString(entry.symbol),
    compname: asString(entry.compname),
    subcatname: asString(entry.subcatname),
    newsDtIso: asString(entry.news_dt_iso),
    attachmentName: asString(entry.attachment_name),
    quote: asString(entry.quote),
    page: page === null ? null : Math.trunc(page),
    bboxes: Array.isArray(entry.bboxes)
      ? entry.bboxes
          .map(parseBox)
          .filter((box): box is CitationBox => box !== null)
      : [],
    coordOrigin: parseOrigin(entry.coord_origin),
  };
}

/**
 * The citations a tool message carries, or an empty list.
 *
 * Mirrors `getMcpAppPayload` — same carrier, same shape of read.
 */
export function getCitationsPayload(message: object): Citation[] {
  const kwargs = (message as { additional_kwargs?: unknown }).additional_kwargs;
  if (!kwargs || typeof kwargs !== "object") return [];
  const raw = (kwargs as Record<string, unknown>)[REGISTRY_KEY];
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseCitation)
    .filter((citation): citation is Citation => citation !== null);
}
