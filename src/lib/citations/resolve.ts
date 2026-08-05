import { emptyCitationRegistry, type CitationRegistry } from "./registry";
import type { Citation } from "./types";

/**
 * One answer's citation resolution pass: which markers survive, and what number
 * each carries.
 *
 * Recomputed on every render, which is exactly what makes streaming work with
 * no streaming-specific path: the markdown re-parses per frame, so a marker
 * resolves the moment its closing brackets arrive and numbers itself in place.
 */

/**
 * What can sit between a marker's brackets. Shared by every marker pattern
 * below so they cannot drift apart on it.
 */
const TAG_BODY = String.raw`[^\[\]\n]{0,80}`;

/**
 * Anything double-bracketed, with one or two closing brackets. Deliberately
 * looser than the tag format itself (`[[0-9a-f]{10}]]`): the point is to catch
 * every *shape* a marker can take — including one the model mangled into
 * `[[tag]` — so that whatever cannot be resolved is removed rather than printed
 * at the reader. A resolvable marker is rewritten to canonical `[[tag]]` on the
 * way out, so the renderer only ever meets one form.
 */
const MARKER_LIKE = new RegExp(String.raw`\[\[(${TAG_BODY})\]{1,2}`, "g");

/**
 * A marker the streaming edge cut in half — no closing bracket has arrived yet.
 * Only ever matched at end of text, so a well-formed marker earlier in the
 * answer is untouched.
 */
const TRUNCATED_MARKER = new RegExp(String.raw`\s*\[\[${TAG_BODY}$`);

/**
 * Fenced code blocks and inline code spans, which must survive byte for byte.
 * A marker-shaped string inside code is code: `[[1, 2], [3, 4]]` in a Python
 * snippet is a nested list, not a citation the reader would thank us for
 * silently deleting.
 */
const FENCED_CODE = /```[\s\S]*?(?:```|$)/g;
const INLINE_CODE = /`[^`\n]*`/g;

/**
 * The canonical marker the prose renderer matches. Only canonical markers reach
 * it — the resolution pass normalises every survivor — so this is deliberately
 * stricter than {@link MARKER_LIKE}.
 */
export const CITATION_MARKER = new RegExp(
  String.raw`\[\[(${TAG_BODY})\]\]`,
  "g",
);

interface Range {
  start: number;
  end: number;
}

/** The ranges of `text` the citation pass must not touch. */
function codeRanges(text: string): Range[] {
  if (!text.includes("`")) return [];
  const ranges: Range[] = [];
  for (const m of text.matchAll(FENCED_CODE)) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  for (const m of text.matchAll(INLINE_CODE)) {
    const inFence = ranges.some((r) => m.index >= r.start && m.index < r.end);
    if (!inFence) ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  return ranges;
}

function inCode(ranges: Range[], offset: number): boolean {
  return ranges.some((r) => offset >= r.start && offset < r.end);
}

interface Marker {
  tag: string;
  start: number;
  end: number;
}

/** Every marker-shaped run in `text` that is not inside code, with its tag. */
function markersIn(text: string): Marker[] {
  if (!text.includes("[[")) return [];
  const code = codeRanges(text);
  const markers: Marker[] = [];
  for (const m of text.matchAll(MARKER_LIKE)) {
    if (inCode(code, m.index)) continue;
    markers.push({
      tag: m[1] ?? "",
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return markers;
}

/**
 * The tags a turn's answers reference, numbered in the order they first appear.
 *
 * Scoped to the **turn**, not to one message: the Orchestrator often emits
 * several AI messages in a turn (a paragraph, a tool round, more prose), and
 * numbering each independently would put two different "1" chips in one answer.
 * Numbers restart on the next turn.
 */
export type CitationNumbering = ReadonlyMap<string, number>;

export const EMPTY_NUMBERING: CitationNumbering = new Map();

/** Number every resolvable marker across `answers`, read in order. */
export function buildCitationNumbering(
  answers: Iterable<string>,
  registry: CitationRegistry,
): CitationNumbering {
  if (registry.isEmpty) return EMPTY_NUMBERING;
  const numbers = new Map<string, number>();
  for (const answer of answers) {
    for (const { tag } of markersIn(answer)) {
      if (!registry.get(tag)) continue;
      if (!numbers.has(tag)) numbers.set(tag, numbers.size + 1);
    }
  }
  return numbers;
}

export interface CitationIndex {
  /**
   * The answer text as it should be rendered: every surviving marker is a
   * canonical `[[tag]]` that resolves to a chip, and nothing else
   * double-bracketed remains outside code.
   */
  readonly text: string;
  /** The chip number for a tag, or undefined when it resolved to nothing. */
  numberOf(tag: string): number | undefined;
  citationOf(tag: string): Citation | undefined;
  readonly isEmpty: boolean;
}

function noCitations(text: string): CitationIndex {
  return {
    text,
    numberOf: () => undefined,
    citationOf: () => undefined,
    isEmpty: true,
  };
}

/**
 * Resolve `answer` against `registry`: keep the markers that resolve —
 * rewritten to canonical `[[tag]]` form so the renderer meets exactly one shape
 * — and strip the ones that do not.
 *
 * `numbering` is the turn's shared numbering. Omit it and the answer is
 * numbered on its own, which is right only when it *is* the whole turn.
 */
export function resolveCitations(
  answer: string,
  registry: CitationRegistry,
  numbering?: CitationNumbering,
): CitationIndex {
  if (!answer.includes("[[")) return noCitations(answer);
  const numbers = numbering ?? buildCitationNumbering([answer], registry);

  let out = "";
  let last = 0;
  for (const { tag, start, end } of markersIn(answer)) {
    const resolved = !!registry.get(tag) && numbers.has(tag);
    let keepUntil = start;
    // The space before a marker is always dropped, whichever way the marker
    // goes. Stripped: so removal never leaves a double space or a space before
    // punctuation. Kept: so the chip sits tight against the word it follows —
    // it carries its own margin, and the two together read as a double gap.
    if (keepUntil > last && answer[keepUntil - 1] === " ") keepUntil--;
    out += answer.slice(last, keepUntil);
    if (resolved) out += `[[${tag}]]`;
    last = end;
  }
  out += answer.slice(last);

  // The half-written marker at the streaming edge — unless the edge is inside
  // an unterminated code fence, where it is just code arriving.
  const tail = TRUNCATED_MARKER.exec(out);
  if (tail && !inCode(codeRanges(out), tail.index)) {
    out = out.slice(0, tail.index);
  }

  return {
    text: out,
    numberOf: (tag) => numbers.get(tag),
    citationOf: (tag) => registry.get(tag),
    isEmpty: numbers.size === 0,
  };
}

/**
 * Remove every marker from `text`, leaving code alone.
 *
 * For surfaces that render an answer's text outside the citation-aware markdown
 * pipeline — copy-to-clipboard, downloads, plain previews — where a raw marker
 * would leak machinery at the reader.
 */
export function stripCitationMarkers(text: string): string {
  const markers = markersIn(text);
  if (markers.length === 0) return text;
  let out = "";
  let last = 0;
  for (const { start, end } of markers) {
    let keepUntil = start;
    if (keepUntil > last && text[keepUntil - 1] === " ") keepUntil--;
    out += text.slice(last, keepUntil);
    last = end;
  }
  out += text.slice(last);
  return out;
}

/** An index over an answer known to have no citations at all. */
export function emptyCitationIndex(text: string): CitationIndex {
  return noCitations(text);
}

export { emptyCitationRegistry };
