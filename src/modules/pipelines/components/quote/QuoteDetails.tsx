"use client";

import { AlertTriangle, Clock, Info, Zap } from "lucide-react";

// By file path, not "@/modules/credits": the barrel carries the Credits page.
import { quoteShortfallSentence } from "@/modules/credits/constants/copy";
import { formatCredits } from "@/modules/credits/utils/format";
import {
  vintageDetail,
  vintageSourceLabel,
} from "../../constants/presentation";
import type { QuoteResponse } from "../../types/pipelines.types";
import {
  PRICE_CHANGED_NOTICE,
  PURCHASES_UNAVAILABLE_NOTICE,
  type PurchaseRefusal,
} from "../../utils/purchase-refusal";
import { Label, Notice } from "../shared/kit";

/**
 * What the quote says beyond the price: the notices a buyer must meet before
 * paying, then the data vintages the report will be pinned to.
 *
 * Affordability is the server's (`can_afford`, `shortfall_minor`), never
 * re-derived from the integers here. A purchase the server refused is said
 * here too, above the rest, in place of a toast (#280): a changed price, or
 * purchases briefly off. A short Balance needs no line of its own — the quote
 * is re-drawn from the refusal, and says it the way any short quote does,
 * aloud as well through the polite live region below.
 */
export function QuoteDetails({
  quote,
  subject,
  refusal = null,
}: {
  quote: QuoteResponse;
  /** What the copy calls the thing being quoted — written once, because the
   *  same word appears in both arms of the coverage notice. */
  subject: "stock" | "market";
  /** The last purchase's refusal on this quote, if it was refused. */
  refusal?: PurchaseRefusal["kind"] | null;
}) {
  const gaps = quote.coverage_gaps?.length ?? 0;
  const vintages = Object.entries(quote.vintage_map ?? {});
  const shortfall = quote.can_afford ? 0 : quote.shortfall_minor;
  const refusalLine =
    refusal === "price_changed"
      ? PRICE_CHANGED_NOTICE
      : refusal === "unavailable"
        ? PURCHASES_UNAVAILABLE_NOTICE
        : null;
  // A 402 re-draws this quote short while focus stays on the Run button,
  // which turns disabled: silent for a screen reader, where the toast it
  // replaced was announced (WCAG 4.1.3). The region is on the page, empty,
  // from before any purchase, so filling it is a change assistive tech
  // announces; a region inserted along with its text often is not.
  const announcement =
    refusal === "short_balance" && shortfall > 0
      ? quoteShortfallSentence(formatCredits(shortfall))
      : "";

  return (
    <div className="space-y-5">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="quote-announcer"
      >
        {announcement}
      </p>
      {(refusalLine ||
        quote.instant_reuse ||
        subject === "market" ||
        gaps > 0 ||
        shortfall > 0) && (
        <div className="space-y-2.5">
          {refusalLine && (
            <div
              role="status"
              data-testid="purchase-refusal"
            >
              <Notice
                tone="amber"
                icon={
                  refusal === "unavailable" ? (
                    <Clock size={13} />
                  ) : (
                    <AlertTriangle size={13} />
                  )
                }
              >
                {refusalLine}
              </Notice>
            </div>
          )}
          {quote.instant_reuse && (
            <Notice
              tone="mint"
              icon={<Zap size={13} />}
            >
              This exact report already exists on today&apos;s data. You will
              get it immediately — nothing has to run.
            </Notice>
          )}
          {gaps > 0 && (
            <Notice
              tone="amber"
              icon={<AlertTriangle size={13} />}
            >
              {gaps === 1
                ? `One section will not run for this ${subject}`
                : `${gaps} sections will not run for this ${subject}`}
              . The price is the same, and the report keeps a visible
              placeholder for each, so nothing goes quietly missing.
            </Notice>
          )}
          {subject === "market" && (
            // The honest reason for the price belongs on this side of the
            // payment boundary. A market Run is content-keyed, so every
            // Purchase inside one Data Vintage window resolves onto the same
            // frozen Report — which makes the second copy instant, and
            // equally common. Deliberately no count of the names (#114): how
            // many stocks a Report names is a ceiling, not a promise.
            <Notice icon={<Info size={13} />}>
              This report is not exclusive. Everyone who buys it on this data
              receives the same document, naming the same stocks.
            </Notice>
          )}
          {shortfall > 0 && (
            // ADR-0013: credits are an entitlement, not a sale. A short
            // balance states the shortfall and offers no action here — the
            // sentence names the Credits screen, where the Credit Request
            // lives (#231 frame 8), and links nowhere.
            <div data-testid="quote-shortfall">
              <Notice
                tone="rose"
                icon={<AlertTriangle size={13} />}
              >
                {quoteShortfallSentence(formatCredits(shortfall))}
              </Notice>
            </div>
          )}
        </div>
      )}

      {vintages.length > 0 && (
        <section>
          <Label>Data this report will be built on</Label>
          <dl className="mt-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {vintages.map(([source, token]) => (
              <div
                key={source}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                  {vintageSourceLabel(source)}
                </dt>
                <dd className="text-right text-[11px] font-medium text-[#0A1F4D] tabular-nums dark:text-white">
                  {vintageDetail(source, String(token))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
            The report is pinned to exactly these vintages and never re-reads a
            source afterwards.
          </p>
        </section>
      )}
    </div>
  );
}
