"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Loader2, Play, Zap } from "lucide-react";
import { toast } from "sonner";

import FeatureHeader from "@/components/discover/FeatureHeader";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import SectionErrorState from "@/components/shared/SectionErrorState";
// By file path, not "@/modules/credits": the barrel carries the Credits page.
import { balanceLabel, priceLabel } from "@/modules/credits/utils/format";
import { PipelineApiError } from "../../api/pipelines-client";
import { pipelineKindLabel } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import {
  usePipelineCatalog,
  usePipelineQuote,
  usePurchasePipeline,
} from "../../hooks/usePipelineQueries";
import { quoteErrorCopy, workflowErrorCopy } from "../../utils/errors";
import { purchaseRefusalOf } from "../../utils/purchase-refusal";
import {
  isMarketTarget,
  needsSymbol,
  stepsAreOrdered,
  targetLabel,
  targetSymbol,
} from "../../utils/target";
import {
  ActionBar,
  PRIMARY_BUTTON,
  Placeholder,
  SCROLL_BODY,
  StatStrip,
} from "../shared/kit";
import { PipelineSteps, type StepRow } from "../shared/PipelineSteps";
import { ProgressBlock } from "../shared/ProgressBlock";
import { QuoteDetails } from "./QuoteDetails";
import { TargetField } from "./TargetField";

/**
 * The screen before the payment boundary, drawn as the reference run view
 * before its Run button is pressed: every Step listed and waiting, the bar at
 * 0/N, the run button in the sticky bar.
 *
 * Everything that could surprise someone after they pay is said here: the
 * price, their balance, the sections that will not run for this stock (marked
 * on their own rows), how old each source is, and — for a market Pipeline —
 * that the report is not exclusive. The quote is fetched fresh every time: a
 * stale balance or vintage on the screen that takes the money would be a lie
 * with a button under it.
 *
 * A market Pipeline arrives with no symbol and quotes anyway; what the screen
 * shows keys off the *resolved* target the quote came back with, since the
 * server decided what this Run is about.
 *
 * Money is in hundredths on the wire (#251): the price prints whole, the
 * Balance to two decimals and in rose when it does not cover the price, and
 * affordability is the server's `can_afford` / `shortfall_minor`. The purchase
 * repeats the quoted price, and each structured refusal re-draws this screen
 * rather than raising a toast (#280) — see `utils/purchase-refusal.ts`.
 */
export function QuoteScreen({
  pipelineId,
  symbol,
  threadId,
}: {
  pipelineId: string;
  symbol: string | null;
  threadId?: string | null;
}) {
  const router = useRouter();
  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
    isFetching: catalogFetching,
    refetch: refetchCatalog,
  } = usePipelineCatalog();
  const purchase = usePurchasePipeline();

  const entry = catalog?.find((item) => item.id === pipelineId);
  const wantsSymbol = needsSymbol(entry);
  const ordered = stepsAreOrdered(entry);
  const quote = usePipelineQuote(pipelineId, symbol, {
    // Held until the catalog says which kind this is, so a stock Pipeline is
    // never quoted without its stock.
    enabled: !!entry && (!wantsSymbol || !!symbol),
  });

  const data = quote.data;
  // The quote's price once it is in — after a 409 it is the new one, while
  // the catalog may still hold the old — and the catalog's until then.
  const priceMinor = data?.price_minor ?? entry?.price_minor;
  const canAfford = !!data && data.can_afford;
  // The last purchase's refusal, only while it is about the quote on screen:
  // picking another stock keeps this screen mounted, and a refusal for the
  // old one must not be said about the new one.
  const refused =
    purchase.variables?.pipelineId === pipelineId &&
    purchase.variables?.symbol === symbol
      ? purchaseRefusalOf(purchase.error)
      : null;
  // Server truth, not the route: the quote came back with the target the Run
  // will actually use, and a market one carries no symbol at all.
  const label = targetLabel(data?.target);
  const isMarket = isMarketTarget(data?.target);

  const steps: StepRow[] = useMemo(() => {
    const gaps = new Map(
      (data?.coverage_gaps ?? []).map((gap) => [gap.step_id, gap.reason]),
    );
    return (entry?.steps ?? []).map((step) =>
      gaps.has(step.id)
        ? {
            id: step.id,
            name: step.name,
            status: "coverage_gap",
            line: gaps.get(step.id),
          }
        : { id: step.id, name: step.name, status: "pending" },
    );
  }, [entry, data]);

  const close = () => router.push(researchRoutes.catalog);

  async function onPurchase() {
    if (!data) return;
    try {
      const receipt = await purchase.purchaseOnce({
        pipelineId,
        symbol,
        threadId,
        priceMinor: data.price_minor,
      });
      if (!receipt) return; // a second click; the first one navigates
      // Replaced, not pushed: going back from the run should not land on a
      // quote for a report that is already paid for.
      router.replace(
        receipt.run_status === "published"
          ? researchRoutes.report(receipt.run_id)
          : researchRoutes.run(receipt.run_id, label),
      );
    } catch (error) {
      // A structured refusal is drawn on the screen: the quote re-drawn
      // short or at its new price, or the unavailable line. Only what the
      // server did not explain is a toast.
      if (purchaseRefusalOf(error)) return;
      toast.error(
        error instanceof PipelineApiError
          ? error.message
          : "The purchase could not be completed.",
      );
    }
  }

  const subtitle =
    entry && priceMinor !== undefined
      ? `${pipelineKindLabel(entry.target_kind)} · ${priceLabel(priceMinor)}`
      : undefined;

  const workflowCopy = workflowErrorCopy(catalogError ?? undefined);
  const quoteCopy = quoteErrorCopy(quote.error, symbol);

  const runLabel = !entry
    ? "Run"
    : wantsSymbol && !symbol
      ? "Choose a stock to run"
      : // The button is disabled either way; saying why beats a dead "Run".
        quote.isError
        ? quoteCopy.retryable
          ? "Can't reach the server"
          : "Can't run this yet"
        : data?.instant_reuse
          ? "Get the report"
          : `Run ${entry.name}`;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title={entry?.name ?? "Agent workflow"}
        subtitle={subtitle}
        onBack={close}
      />

      {/* The catalog names the workflow and its steps: until it is in, a
          full-page wait under the header (#153). The quote below arrives
          inside a page that is already drawn and keeps its placeholder. */}
      <PageLoaderSwitch loading={catalogLoading}>
        <div className={`${SCROLL_BODY} space-y-5`}>
          {/* A catalog that failed to load has not told us this workflow is
            gone — only a catalog that came back without it has. */}
          {!entry && (
            <SectionErrorState
              title={workflowCopy.title}
              description={workflowCopy.description}
              onRetry={
                workflowCopy.retryable ? () => refetchCatalog() : undefined
              }
              retrying={catalogFetching}
            />
          )}

          {entry && (
            <>
              {wantsSymbol && (
                <TargetField
                  symbol={symbol}
                  resolvedSymbol={targetSymbol(data?.target) || undefined}
                  onSelect={(next) =>
                    router.replace(
                      researchRoutes.quote(pipelineId, next, threadId),
                    )
                  }
                  onClear={() =>
                    router.replace(
                      researchRoutes.quote(pipelineId, null, threadId),
                    )
                  }
                />
              )}

              {quote.isLoading && <Placeholder className="h-[62px] w-full" />}

              {/* No price, no balance, no purchase — say which of those is the
                server refusing and which is a connection we couldn't make. */}
              {quote.isError && (
                <SectionErrorState
                  className="py-6"
                  title={quoteCopy.title}
                  description={quoteCopy.description}
                  onRetry={
                    quoteCopy.retryable ? () => quote.refetch() : undefined
                  }
                  retrying={quote.isFetching}
                />
              )}

              {data && (
                <StatStrip
                  stats={[
                    { label: "Price", value: priceLabel(data.price_minor) },
                    {
                      label: "Your Balance",
                      // As it is, below zero included — never floored.
                      value: balanceLabel(data.balance_minor),
                      // Rose whenever it does not cover the price, as #231
                      // frame 8 draws it: 3.40 against 10 as well as −13.10.
                      negative: !data.can_afford,
                    },
                    // A stock report's subject is already on the field above,
                    // so its slot says how much of the report will run instead.
                    isMarket
                      ? { label: "Covers", value: label || "—" }
                      : {
                          label: "Sections",
                          value: data.coverage_gaps?.length
                            ? `${steps.length - data.coverage_gaps.length} of ${steps.length}`
                            : `${steps.length}`,
                        },
                  ]}
                />
              )}

              <ProgressBlock
                done={0}
                total={steps.length}
                note={
                  ordered
                    ? "Each step narrows the one before it, so they run in order."
                    : "The sections are researched in parallel and finish out of order."
                }
              />

              <PipelineSteps
                steps={steps}
                ordered={ordered}
              />

              {data && (
                <QuoteDetails
                  quote={data}
                  subject={isMarket ? "market" : "stock"}
                  refusal={refused?.kind ?? null}
                />
              )}
            </>
          )}
        </div>
      </PageLoaderSwitch>

      <ActionBar>
        <button
          type="button"
          onClick={onPurchase}
          disabled={!canAfford || purchase.isPurchasing}
          className={PRIMARY_BUTTON}
        >
          {purchase.isPurchasing ? (
            <>
              <Loader2
                size={15}
                className="animate-spin"
              />
              Starting…
            </>
          ) : (
            <>
              {data?.instant_reuse ? (
                <Zap size={14} />
              ) : (
                <Play
                  size={14}
                  fill="currentColor"
                />
              )}
              {runLabel}
            </>
          )}
        </button>
      </ActionBar>
    </div>
  );
}
