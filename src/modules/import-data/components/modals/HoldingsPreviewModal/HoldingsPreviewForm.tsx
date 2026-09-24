"use client";
import { FiDataResponse } from "@/modules/import-data/types/moneyone-raw";
import type { NormalizedFi } from "@/modules/import-data/types/aa";
import { toast } from "sonner";
import {
  DataPanel,
  FooterButton,
  OverlayBody,
} from "@/modules/import-data/components/shared/ui";
import { PageLoaderSwitch } from "@/components/shared/PageLoader";
import { ClassAnalysisView } from "./components/ClassAnalysisView";
import { HoldingsSearch } from "./components/HoldingsSearch";
import { HoldingsTable } from "./components/HoldingsTable";
import { LedgerHeader } from "./components/LedgerSummary";
import { SummaryTiles } from "./components/analysis/SummaryTiles";
import { holdingNoun } from "./utils/holding-value";
import { analysisKind, costBasisOf } from "./utils/class-analysis";
import { HoldingFormData, useHoldingsForm } from "./hooks/useHoldingsForm";
import { useClassAnalysis } from "./hooks/useClassAnalysis";
import {
  HoldingWithQuantity,
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
  /** The consent's normalized block (the FIP-reported cost basis). */
  normalized?: NormalizedFi;
  /** Whether data is currently loading. */
  isLoading: boolean;
  /** Whether the import mutation is in progress. */
  isImporting: boolean;
  /** Account-level current value (fallback when holdings carry no price). */
  currentValue?: string | null;
  /** Called with the edited FI-data payload on submit. */
  onSubmit: (modifiedFiData: FiDataResponse) => void;
  /** Close the modal. */
  onClose: () => void;
};

/**
 * Holdings analysis shared by Equities, ETF and Mutual Funds. Opening it is the
 * request: the analysis starts as soon as the holdings land, laid out in
 * finsharpe-mobile's order (summary tiles, then the analysis sections), with
 * the editable ledger (search to add, edit units, remove) below — an edit
 * re-runs the analysis. Import to Chat closes the page, in the flow rather
 * than pinned; the header's close button leaves. Asset differences live in `config`.
 */
export function HoldingsPreviewForm({
  config,
  defaultValues,
  fiData,
  normalized,
  isLoading,
  isImporting,
  currentValue,
  onSubmit,
  onClose,
}: HoldingsPreviewFormProps) {
  const { consentType, showCurrentValue } = config;

  const {
    control,
    handleSubmit,
    fields,
    handleAddSearchResult,
    handleRemoveHolding,
  } = useHoldingsForm(defaultValues, consentType);

  const fallbackValue =
    showCurrentValue && currentValue ? parseFloat(currentValue) : null;

  const analysis = useClassAnalysis(
    analysisKind(consentType),
    control,
    !isLoading,
  );

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

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <LedgerHeader
        control={control}
        consentType={consentType}
        title={config.title}
        fallbackValue={fallbackValue}
        isLoading={isLoading}
        onClose={onClose}
      />

      {/* Opening Analyse asks for the analysis, and it can take half a
          minute cold: one full-page wait under the header until the holdings
          and their first answer are in, as mobile's class analytics (#153).
          An edit that re-runs it keeps the last answer on screen. */}
      <PageLoaderSwitch loading={isLoading || analysis.isAwaitingFirst}>
        <OverlayBody>
          <SummaryTiles
            control={control}
            consentType={consentType}
            fallbackValue={fallbackValue}
            costBasis={costBasisOf(normalized)}
            snapshot={analysis.analysis?.snapshot}
          />

          {count > 0 && (
            <ClassAnalysisView
              analysis={analysis.analysis}
              isLoading={analysis.isLoading}
              isRefreshing={analysis.isRefreshing}
              isError={analysis.isError}
              errorStatus={analysis.error?.status}
              isEmpty={analysis.isEmpty}
              onRetry={analysis.retry}
            />
          )}

          <DataPanel
            title="Edit before importing"
            addon={`${count} ${holdingNoun(consentType, count)}`}
            bodyClassName="space-y-4"
          >
            <HoldingsSearch
              consentType={consentType}
              onSelectResult={handleAddSearchResult}
            />
            <HoldingsTable
              fields={fields}
              control={control}
              consentType={consentType}
              onRemove={handleRemoveHolding}
            />
          </DataPanel>

          {/* Last in the flow, as mobile's class analytics: the hand-off
              closes the page rather than riding pinned over it. */}
          <FooterButton
            type="submit"
            className="w-full"
            disabled={isLoading || count === 0 || isImporting}
            busy={isImporting}
            busyLabel="Importing…"
          >
            Import to Chat
          </FooterButton>
        </OverlayBody>
      </PageLoaderSwitch>
    </form>
  );
}
