"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Loader2, Play, Zap } from "lucide-react";
import { toast } from "sonner";

import FeatureHeader from "@/components/discover/FeatureHeader";
import { PipelineApiError } from "../../api/pipelines-client";
import { creditsLabel, pipelineKindLabel } from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import {
  usePipelineCatalog,
  usePipelineQuote,
  usePurchasePipeline,
} from "../../hooks/usePipelineQueries";
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
  const { data: catalog, isLoading: catalogLoading } = usePipelineCatalog();
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
  const price = data?.price_credits ?? entry?.price_credits ?? 0;
  const balance = data?.balance_credits ?? 0;
  const shortfall = Math.max(0, price - balance);
  const canAfford = !!data && shortfall === 0;
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
    try {
      const receipt = await purchase.mutateAsync({
        pipelineId,
        symbol,
        threadId,
      });
      // Replaced, not pushed: going back from the run should not land on a
      // quote for a report that is already paid for.
      router.replace(
        receipt.run_status === "published"
          ? researchRoutes.report(receipt.run_id)
          : researchRoutes.run(receipt.run_id, label),
      );
    } catch (error) {
      toast.error(
        error instanceof PipelineApiError
          ? error.message
          : "The purchase could not be completed.",
      );
    }
  }

  const subtitle = entry
    ? `${pipelineKindLabel(entry.target_kind)} · ${creditsLabel(entry.price_credits)}`
    : undefined;

  const runLabel = !entry
    ? "Run"
    : wantsSymbol && !symbol
      ? "Choose a stock to run"
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

      <div className={`${SCROLL_BODY} space-y-5`}>
        {catalogLoading && (
          <div className="space-y-3">
            <Placeholder className="h-3 w-32" />
            <Placeholder className="h-2 w-full" />
            <Placeholder className="h-40 w-full" />
          </div>
        )}

        {!catalogLoading && !entry && (
          <p className="text-[11px] text-rose-500">
            This workflow is not in the catalog any more.
          </p>
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

            {quote.error && (
              <p className="text-[11px] text-rose-500">
                {quote.error instanceof PipelineApiError &&
                quote.error.isNotFound
                  ? `We do not recognise the stock “${symbol}”.`
                  : "The quote could not be loaded. Please try again."}
              </p>
            )}

            {data && (
              <StatStrip
                stats={[
                  { label: "Price", value: creditsLabel(price) },
                  { label: "Your Balance", value: creditsLabel(balance) },
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
                shortfall={shortfall}
              />
            )}
          </>
        )}
      </div>

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
