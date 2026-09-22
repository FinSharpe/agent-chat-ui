"use client";

import { AlertTriangle, Info, Zap } from "lucide-react";

import {
  creditsLabel,
  vintageDetail,
  vintageSourceLabel,
} from "../../constants/presentation";
import type { QuoteResponse } from "../../types/pipelines.types";
import { Label, Notice } from "../shared/kit";

/**
 * What the quote says beyond the price: the notices a buyer must meet before
 * paying, then the data vintages the report will be pinned to.
 */
export function QuoteDetails({
  quote,
  subject,
  shortfall,
}: {
  quote: QuoteResponse;
  /** What the copy calls the thing being quoted — written once, because the
   *  same word appears in both arms of the coverage notice. */
  subject: "stock" | "market";
  shortfall: number;
}) {
  const gaps = quote.coverage_gaps?.length ?? 0;
  const vintages = Object.entries(quote.vintage_map ?? {});

  return (
    <div className="space-y-5">
      {(quote.instant_reuse ||
        subject === "market" ||
        gaps > 0 ||
        shortfall > 0) && (
        <div className="space-y-2.5">
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
            // balance states the shortfall and offers nothing — there is no
            // top-up path anywhere in the product.
            <Notice
              tone="rose"
              icon={<AlertTriangle size={13} />}
            >
              You need {creditsLabel(shortfall)} more to commission this report.
            </Notice>
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
