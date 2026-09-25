/**
 * Credits on screen. The wire speaks hundredths (`*_minor`, 100 credits =
 * 10,000); the screen speaks credits.
 *
 * - A Balance, or anything derived from one, is two decimals always: "12.40",
 *   "−13.10". A negative Balance is shown as it is — never floored at zero,
 *   which would hide the overshoot (#223 §2).
 * - A price is whole ("10 credits"): the manifests price in whole credits.
 * - A History amount is signed: "−0.42", "+20.00".
 *
 * The minus is U+2212, as the previews draw it, so a negative figure never
 * reads as a hyphenated word or wraps at its sign.
 */

export const MINUS = "−";

function absoluteTwoDecimals(minor: number): string {
  const abs = Math.abs(Math.trunc(minor));
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${whole}.${String(cents).padStart(2, "0")}`;
}

/** A Balance-derived figure: "12.40", "0.00", "−13.10". */
export function formatCredits(minor: number): string {
  const figure = absoluteTwoDecimals(minor);
  return Math.trunc(minor) < 0 ? `${MINUS}${figure}` : figure;
}

/** A History amount: "+20.00", "−0.42"; nothing moved reads "0.00". */
export function formatSignedCredits(minor: number): string {
  const whole = Math.trunc(minor);
  if (whole === 0) return absoluteTwoDecimals(0);
  return `${whole < 0 ? MINUS : "+"}${absoluteTwoDecimals(whole)}`;
}

/**
 * A price: whole credits ("10"), or two decimals on the day a price ever
 * carries hundredths — a price is never rounded into a different number.
 */
export function formatPriceCredits(minor: number): string {
  const whole = Math.trunc(minor);
  return whole % 100 === 0
    ? formatCredits(whole).replace(/\.00$/, "")
    : formatCredits(whole);
}

/** "10 credits", "1 credit": the price as the quote and the catalog say it. */
export function priceLabel(minor: number): string {
  const figure = formatPriceCredits(minor);
  return `${figure} ${figure === "1" ? "credit" : "credits"}`;
}

/** "3.40 credits": a Balance with its word. Always plural, as the label is. */
export function balanceLabel(minor: number): string {
  return `${formatCredits(minor)} credits`;
}
