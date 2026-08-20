"use client";

import { useRouter } from "next/navigation";
import { Coins, FileText, Lock, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { creditsLabel } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import type { CatalogEntry } from "../../types/pipelines.types";
import { needsSymbol, stepsAreOrdered } from "../../utils/target";
import { StepList } from "../shared/StepList";
import { StockPicker } from "./StockPicker";

const HOW_IT_WORKS_INSTRUMENT = [
  "Pick a stock and see the quote — price, your balance, and any section we cannot cover.",
  "The sections are fetched and written in parallel. You can leave the page; the run keeps going.",
  "The finished report lands in Your reports, and in your chat if you started from there.",
];

const HOW_IT_WORKS_MARKET = [
  "Run, and see the quote — price, your balance, and how old each source is.",
  "The steps run in order, each narrowing the last. You can leave the page; the run keeps going.",
  "The finished report lands in Your reports, and in your chat if you started from there.",
];

/**
 * A catalog of one.
 *
 * A grid built for many cards renders a single Pipeline as a lonely tile with
 * six columns of white beside it, which reads as "this section is broken", not
 * as "this is the product". So one Pipeline is presented as the product it is:
 * a full-width panel that spends its space on what the price buys — the Steps,
 * named. The grid comes back the moment there is a second Pipeline to put in it.
 *
 * Choosing a stock is the *only* action on this screen, so it is lifted out of
 * the body and onto its own raised surface in the header. Sitting it in a
 * column beside the prose gave it the same weight as three blocks of
 * explanation, and a bare search field reads as a filter on what surrounds it —
 * the panel then had no obvious thing to do. (Mobile solves the same problem
 * with a full-width gradient CTA that pushes to a picker screen; the web keeps
 * the picker inline, so the surface has to carry the emphasis the button did.)
 */
export function PipelineFeaturePanel({ entry }: { entry: CatalogEntry }) {
  const router = useRouter();
  const wantsSymbol = needsSymbol(entry);
  const ordered = stepsAreOrdered(entry);
  const howItWorks = wantsSymbol
    ? HOW_IT_WORKS_INSTRUMENT
    : HOW_IT_WORKS_MARKET;

  return (
    <section className="border-border-default bg-bg-card rounded-xl border">
      <div className="from-brand-gradient-from via-brand-gradient-via to-brand-gradient-to rounded-t-xl bg-gradient-to-br px-6 pt-5 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-text-primary text-xl font-semibold">
              {entry.name}
            </h2>
            <p className="text-text-secondary mt-1 max-w-2xl text-sm">
              {entry.description}
            </p>
          </div>
          <span className="bg-bg-card text-text-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium">
            <Coins className="text-accent-amber size-4" />
            {creditsLabel(entry.price_credits)}
          </span>
        </div>

        <div className="border-brand-border-via bg-bg-card mt-5 rounded-xl border p-4 shadow-sm sm:p-5">
          <h3 className="text-text-primary text-base font-semibold">
            {wantsSymbol
              ? "Choose a stock to research"
              : "Nothing to choose — this report is about the whole market"}
          </h3>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            {wantsSymbol ? (
              /* Bounded rather than full-bleed: a field the width of the panel
                 reads as a filter over the page, and it sets the width of the
                 results that drop out of it. */
              <div className="md:max-w-md md:flex-1">
                <StockPicker
                  size="lg"
                  onSelect={(symbol) =>
                    router.push(researchRoutes.quote(entry.id, symbol))
                  }
                />
              </div>
            ) : (
              <Button
                size="lg"
                onClick={() => router.push(researchRoutes.quote(entry.id))}
              >
                Run
              </Button>
            )}
            <p className="text-text-tertiary text-xs md:max-w-sm">
              {wantsSymbol
                ? "You will see the price, your balance and anything we cannot cover for this stock before you pay. Nothing is spent until you confirm."
                : "You will see the price, your balance and how old each source is before you pay. Nothing is spent until you confirm."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-2">
        <div>
          <h3 className="text-text-primary text-sm font-medium">
            What the report covers
          </h3>
          <StepList
            steps={entry.steps ?? []}
            ordered={ordered}
            className="mt-3"
          />
        </div>

        <div>
          <h3 className="text-text-primary text-sm font-medium">
            How it works
          </h3>
          <ol className="mt-3 space-y-3">
            {howItWorks.map((step, index) => (
              <li
                key={index}
                className="text-text-secondary flex gap-3 text-sm"
              >
                <span className="bg-bg-subtle text-text-secondary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ul className="border-border-subtle bg-bg-subtle text-text-tertiary grid gap-3 rounded-b-xl border-t px-6 py-4 text-xs sm:grid-cols-3">
        <li className="flex items-start gap-2">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          Every section is grounded on data fetched for this report. A section
          we cannot cover says so rather than going quiet.
        </li>
        <li className="flex items-start gap-2">
          <FileText className="mt-0.5 size-3.5 shrink-0" />
          The report is frozen when it publishes — it reads the same tomorrow as
          it does today, and downloads as a PDF.
        </li>
        <li className="flex items-start gap-2">
          <Share2 className="mt-0.5 size-3.5 shrink-0" />
          You can share it with a link, and revoke that link at any time.
        </li>
      </ul>
    </section>
  );
}
