import type { CitationBox, CoordOrigin } from "./types";

/**
 * Turning a stored rectangle into a box over the rendered page.
 *
 * The corpus stores rectangles **normalised to 0..1** against the page, so the
 * conversion is a multiplication against the rendered page box — there is no
 * page-geometry lookup and no unit conversion. (The retired viewer assumed
 * absolute points, which is wrong here in every case.)
 *
 * `coord_origin` says which corner `t` and `b` are measured from. Under
 * `BOTTOM_LEFT` the values grow upwards, so the *larger* of the two is the top
 * edge; under `TOP_LEFT` they grow downwards and the smaller one is. Rather
 * than trust which field holds which edge, both are derived from min/max, so a
 * rectangle stored with its sides the other way round still renders over the
 * passage instead of collapsing to nothing.
 */

export interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Place one normalised rectangle over a page rendered at `width` × `height`
 * device-independent pixels. Returns null for a rectangle with no area, which
 * would draw as an invisible sliver rather than a highlight.
 */
export function rectToHighlight(
  box: CitationBox,
  origin: CoordOrigin | null,
  width: number,
  height: number,
): HighlightRect | null {
  const left = clamp01(Math.min(box.l, box.r));
  const right = clamp01(Math.max(box.l, box.r));

  const lo = clamp01(Math.min(box.t, box.b));
  const hi = clamp01(Math.max(box.t, box.b));
  // BOTTOM_LEFT measures up from the page foot, so flip it into screen space.
  const top = origin === "BOTTOM_LEFT" ? 1 - hi : lo;
  const bottom = origin === "BOTTOM_LEFT" ? 1 - lo : hi;

  if (right - left <= 0 || bottom - top <= 0) return null;

  return {
    left: left * width,
    top: top * height,
    width: (right - left) * width,
    height: (bottom - top) * height,
  };
}

/**
 * Every rectangle of one passage, placed over the rendered page.
 *
 * A passage carries a **list** of rectangles, not a single box: a claim drawn
 * from a table and its caption is marked in both places.
 */
export function highlightsFor(
  boxes: CitationBox[],
  origin: CoordOrigin | null,
  width: number,
  height: number,
): HighlightRect[] {
  return boxes
    .map((box) => rectToHighlight(box, origin, width, height))
    .filter((rect): rect is HighlightRect => rect !== null);
}
