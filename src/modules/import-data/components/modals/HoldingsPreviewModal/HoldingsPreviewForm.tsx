"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FiDataResponse } from "@/lib/moneyone/moneyone.types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type Control, useWatch } from "react-hook-form";
import {
  WorkspaceHeader,
  WorkspaceSplit,
  WorkspaceColumn,
  WorkspaceFooter,
  TableSkeleton,
  formatCount,
  formatINR,
  type WorkspaceMetric,
} from "@/modules/import-data/components/shared/ui";
import { HoldingsSearch } from "./components/HoldingsSearch";
import { HoldingsTable } from "./components/HoldingsTable";
import { HoldingFormData, useHoldingsForm } from "./hooks/useHoldingsForm";
import {
  HoldingWithQuantity,
  getAssetTypeName,
  transformFormDataToHoldings,
} from "./utils/holdings-transformer";
import type { EditableHoldingsConfig } from "./editable-configs";

type HoldingsPreviewFormProps = {
  /** Per-asset configuration (labels, analytics panel). */
  config: EditableHoldingsConfig;
  /** Initial form values (holdings with quantity). */
  defaultValues: HoldingWithQuantity[];
  /** Raw FI data for creating the modified payload. */
  fiData: FiDataResponse | undefined;
  /** Whether data is currently loading. */
  isLoading: boolean;
  /** Whether the import mutation is in progress. */
  isImporting: boolean;
  /** Total current value (shown when config.showCurrentValue). */
  currentValue?: string | null;
  /** Called with the edited FI-data payload on submit. */
  onSubmit: (modifiedFiData: FiDataResponse) => void;
  /** Close the modal. */
  onClose: () => void;
};

/**
 * Live sum of holding quantities. Isolated into its own subscriber so the
 * heavy analysis canvas doesn't re-render on every quantity keystroke.
 */
function LiveUnits({ control }: { control: Control<HoldingFormData> }) {
  const holdings = useWatch({ control, name: "holdings" }) as
    | HoldingWithQuantity[]
    | undefined;
  const total = (holdings ?? []).reduce(
    (sum, h) => sum + (Number(h?.quantity) || 0),
    0,
  );
  return <>{formatCount(total)}</>;
}

/**
 * Editable-holdings workspace shared by Equities, ETF, and Mutual Funds. The
 * left "ledger" curates holdings; the right "canvas" runs and renders analysis.
 * Differences between asset types live entirely in `config`.
 */
export function HoldingsPreviewForm({
  config,
  defaultValues,
  fiData,
  isLoading,
  isImporting,
  currentValue,
  onSubmit,
  onClose,
}: HoldingsPreviewFormProps) {
  const { consentType, showCurrentValue, AnalyticsPanel } = config;
  const assetType = getAssetTypeName(consentType);

  const {
    control,
    handleSubmit,
    fields,
    handleAddSearchResult,
    handleRemoveHolding,
    getValues,
  } = useHoldingsForm(defaultValues, consentType);

  const handleFormSubmit = (data: HoldingFormData) => {
    if (!fiData) {
      toast.error("Holdings data is not available. Please try again.");
      return;
    }

    const convertedHoldings = transformFormDataToHoldings(
      data.holdings,
      consentType,
    );

    const firstAccountWithInvestment = fiData.find(
      (account) => account.Summary?.Investment,
    );

    if (!firstAccountWithInvestment?.Summary?.Investment) {
      toast.error("No valid investment account found in holdings data.");
      return;
    }

    const modifiedFiData: FiDataResponse = [
      {
        ...firstAccountWithInvestment,
        Summary: {
          ...firstAccountWithInvestment.Summary,
          Investment: {
            ...firstAccountWithInvestment.Summary.Investment,
            Holdings: {
              ...firstAccountWithInvestment.Summary.Investment.Holdings,
              Holding: convertedHoldings,
            },
          },
        },
      },
    ];

    onSubmit(modifiedFiData);
  };

  const count = fields.length;

  const metrics: WorkspaceMetric[] = [
    { label: "Holdings", value: count },
    { label: "Total units", value: <LiveUnits control={control} /> },
  ];
  if (showCurrentValue && currentValue) {
    metrics.push({ label: "Est. value", value: formatINR(currentValue) });
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <WorkspaceHeader
        icon={config.icon}
        eyebrow={config.eyebrow}
        title={config.title}
        metrics={metrics}
        srDescription={config.description}
      />

      <WorkspaceSplit
        ledger={
          <WorkspaceColumn
            label="Holdings Ledger"
            addon={
              <span className="text-text-muted text-xs">
                edit · add · remove
              </span>
            }
          >
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-11 w-full rounded-xl" />
                <TableSkeleton rows={7} />
              </div>
            ) : (
              <>
                <HoldingsSearch
                  consentType={consentType}
                  onSelectResult={handleAddSearchResult}
                />
                <div className="mt-3 flex min-h-0 flex-1 flex-col">
                  <HoldingsTable
                    fields={fields}
                    control={control}
                    consentType={consentType}
                    onRemove={handleRemoveHolding}
                  />
                  <div className="text-text-tertiary mt-2 flex items-center justify-between px-1 text-xs">
                    <span>
                      {formatCount(count)} holding{count === 1 ? "" : "s"}
                    </span>
                    <span className="tabular-nums">
                      <LiveUnits control={control} /> units
                    </span>
                  </div>
                </div>
              </>
            )}
          </WorkspaceColumn>
        }
        canvas={
          <WorkspaceColumn
            label="Portfolio Analysis"
            className="@container/canvas"
          >
            {isLoading ? (
              <div className="border-border bg-card/40 flex h-full min-h-0 items-center justify-center rounded-xl border border-dashed">
                <p className="text-text-muted text-sm">Loading holdings…</p>
              </div>
            ) : (
              <AnalyticsPanel
                holdingsCount={count}
                getHoldings={() => getValues("holdings")}
              />
            )}
          </WorkspaceColumn>
        }
      />

      <WorkspaceFooter
        start={
          !isLoading && count > 0
            ? `${formatCount(count)} ${assetType.toLowerCase()} holding${count === 1 ? "" : "s"} selected for import`
            : null
        }
      >
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || count === 0 || isImporting}
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding to Chat…
            </>
          ) : (
            "Add to Chat & Analyze"
          )}
        </Button>
      </WorkspaceFooter>
    </form>
  );
}
