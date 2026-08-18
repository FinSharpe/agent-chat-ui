"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AlertTriangle, Coins, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PipelineApiError } from "../../api/pipelines-client";
import {
  creditsLabel,
  vintageDetail,
  vintageSourceLabel,
} from "../../constants/presentation";
import { researchRoutes } from "../../constants/routes";
import {
  usePipelineCatalog,
  usePipelineQuote,
  usePurchasePipeline,
} from "../../hooks/usePipelineQueries";
import { isMarketTarget, needsSymbol, targetLabel } from "../../utils/target";
import { ResearchShell } from "../shared/ResearchShell";
import { StockPicker } from "../catalog/StockPicker";

/**
 * The screen before the payment boundary.
 *
 * Everything that could surprise someone after they pay is said here: the
 * price, their balance, the sections that will not run for this stock, how old
 * each source is, and — for a market Pipeline — that the report is not
 * exclusive. The quote is fetched fresh every time: a stale balance or a stale
 * vintage on the screen that takes the money would be a lie with a button
 * under it.
 *
 * A market Pipeline arrives here with no symbol and quotes anyway; what the
 * screen shows keys off the *resolved* target the quote came back with, since
 * the server is the one that decided what this Run is about.
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
  const quote = usePipelineQuote(pipelineId, symbol, {
    enabled: !wantsSymbol || !!symbol,
  });
  const stepNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const step of entry?.steps ?? []) names.set(step.id, step.name);
    return names;
  }, [entry]);

  // Which branch this is depends on the catalog's declaration, so hold the
  // page rather than flashing a stock picker at a Pipeline that has no stock.
  if (catalogLoading) {
    return (
      <ResearchShell
        title="Research report"
        backHref={researchRoutes.catalog}
        backLabel="Research Reports"
      >
        <Skeleton className="h-64 w-full rounded-xl" />
      </ResearchShell>
    );
  }

  if (wantsSymbol && !symbol) {
    return (
      <ResearchShell
        title={entry?.name ?? "Research report"}
        subtitle="Choose the stock this report is about."
        backHref={researchRoutes.catalog}
        backLabel="Research Reports"
      >
        <div className="border-border-default bg-bg-card rounded-xl border p-5">
          <StockPicker
            autoFocus
            onSelect={(next) =>
              router.replace(researchRoutes.quote(pipelineId, next))
            }
          />
        </div>
      </ResearchShell>
    );
  }

  const data = quote.data;
  const price = data?.price_credits ?? entry?.price_credits ?? 0;
  const balance = data?.balance_credits ?? 0;
  const shortfall = Math.max(0, price - balance);
  const canAfford = !!data && shortfall === 0;
  // Server truth, not the route: the quote came back with the target the Run
  // will actually use, and a market one carries no symbol at all.
  const label = targetLabel(data?.target);
  const isMarket = isMarketTarget(data?.target);

  async function onPurchase() {
    try {
      const receipt = await purchase.mutateAsync({
        pipelineId,
        symbol,
        threadId,
      });
      router.push(
        receipt.run_status === "published"
          ? researchRoutes.report(receipt.run_id)
          : researchRoutes.run(receipt.run_id, label),
      );
    } catch (error) {
      const message =
        error instanceof PipelineApiError
          ? error.message
          : "The purchase could not be completed.";
      toast.error(message);
    }
  }

  return (
    <ResearchShell
      title={entry?.name ?? "Research report"}
      subtitle={
        isMarket ? (
          <span>{label} — there is no stock to choose</span>
        ) : (
          <span>
            {symbol}
            {data?.target?.symbol && data.target.symbol !== symbol
              ? ` (resolved to ${data.target.symbol})`
              : ""}
          </span>
        )
      }
      backHref={researchRoutes.catalog}
      backLabel="Research Reports"
    >
      {quote.isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

      {quote.error && (
        <div className="border-error-border bg-error-bg text-error-fg rounded-lg border px-4 py-3 text-sm">
          {quote.error instanceof PipelineApiError && quote.error.isNotFound
            ? `We do not recognise the stock “${symbol}”.`
            : "The quote could not be loaded. Please try again."}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {data.instant_reuse && (
            <div className="border-info-border bg-info-bg text-info-foreground flex items-start gap-3 rounded-lg border px-4 py-3 text-sm">
              <Zap className="mt-0.5 size-4 shrink-0" />
              <p>
                This exact report already exists on today&apos;s data. You will
                get it immediately — nothing has to run.
              </p>
            </div>
          )}

          {(data.coverage_gaps?.length ?? 0) > 0 && (
            <div className="border-warning-border bg-warning-bg text-warning-fg rounded-lg border px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="size-4" />
                {data.coverage_gaps!.length === 1
                  ? `One section will not run for this ${isMarket ? "market" : "stock"}`
                  : `${data.coverage_gaps!.length} sections will not run for this ${isMarket ? "market" : "stock"}`}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {data.coverage_gaps!.map((gap) => (
                  <li key={gap.step_id}>
                    <span className="font-medium">
                      {stepNames.get(gap.step_id) ?? gap.step_id}
                    </span>{" "}
                    — {gap.reason}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                The price is the same. The report keeps a visible placeholder
                for each, so nothing goes quietly missing.
              </p>
            </div>
          )}

          <section className="border-border-default bg-bg-card rounded-xl border p-5">
            <h2 className="text-text-primary text-sm font-medium">
              Data this report will be built on
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {Object.entries(data.vintage_map ?? {}).map(([source, token]) => (
                <div
                  key={source}
                  className="border-border-subtle flex items-baseline justify-between gap-4 border-b pb-1.5 text-sm"
                >
                  <dt className="text-text-secondary">
                    {vintageSourceLabel(source)}
                  </dt>
                  <dd className="text-text-primary text-right">
                    {vintageDetail(source, String(token))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-text-tertiary mt-3 text-xs">
              The report is pinned to exactly these vintages and never re-reads
              a source afterwards.
            </p>
          </section>

          <section className="border-border-default bg-bg-card rounded-xl border p-5">
            {isMarket && (
              // The honest reason for the price belongs on this side of the
              // payment boundary, and above it. A market Run is content-keyed,
              // so every Purchase inside one Data Vintage window resolves onto
              // the same frozen Report — which is what makes the second
              // buyer's copy instant, and equally what makes it common.
              <p className="border-border-default bg-bg-subtle text-text-secondary mb-4 rounded-md border px-3 py-2 text-sm">
                This report is not exclusive. Everyone who buys it on this data
                receives the same document, naming the same stocks.
              </p>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-text-primary flex items-center gap-2 text-lg font-semibold">
                  <Coins className="text-accent-amber size-5" />
                  {creditsLabel(price)}
                </p>
                <p className="text-text-secondary mt-1 text-sm">
                  Your balance: {creditsLabel(balance)}
                </p>
              </div>

              <Button
                onClick={onPurchase}
                disabled={!canAfford || purchase.isPurchasing}
                size="lg"
              >
                {purchase.isPurchasing && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {data.instant_reuse ? "Get the report" : "Start the report"}
              </Button>
            </div>

            {!canAfford && (
              // ADR-0013: credits are an entitlement, not a sale. A short
              // balance states the shortfall and offers nothing — there is no
              // top-up path anywhere in the product, and inventing a link to
              // one here would be the in-app sale that decision forbids.
              <p className="border-border-default bg-bg-subtle text-text-secondary mt-4 rounded-md border px-3 py-2 text-sm">
                You need {creditsLabel(shortfall)} more to commission this
                report.
              </p>
            )}
          </section>
        </div>
      )}
    </ResearchShell>
  );
}
