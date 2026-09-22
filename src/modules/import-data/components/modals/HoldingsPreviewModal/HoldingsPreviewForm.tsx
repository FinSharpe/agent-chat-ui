"use client";
import { FiDataResponse } from "@/lib/moneyone/moneyone.types";
import { toast } from "sonner";
import {
  DataPanel,
  FooterButton,
  OverlayBody,
  OverlayFooter,
  StatTileGridSkeleton,
  TableSkeleton,
  ChartSkeleton,
} from "@/modules/import-data/components/shared/ui";
import { HoldingsSearch } from "./components/HoldingsSearch";
import { HoldingsTable } from "./components/HoldingsTable";
import { LedgerHeader, LedgerStats } from "./components/LedgerSummary";
import { holdingNoun } from "./utils/holding-value";
import { HoldingFormData, useHoldingsForm } from "./hooks/useHoldingsForm";
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
 * Editable-holdings analysis modal shared by Equities, ETF and Mutual Funds,
 * laid out like the reference analysis popups: live stat tiles, the portfolio
 * analysis cards, then the editable holdings table (search to add, edit units,
 * remove), with Cancel / Import to Chat pinned below. Asset differences live in
 * `config`.
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

  const {
    control,
    handleSubmit,
    fields,
    handleAddSearchResult,
    handleRemoveHolding,
    getValues,
  } = useHoldingsForm(defaultValues, consentType);

  const fallbackValue =
    showCurrentValue && currentValue ? parseFloat(currentValue) : null;

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

      <OverlayBody>
        {isLoading ? (
          <>
            <StatTileGridSkeleton />
            <ChartSkeleton />
            <TableSkeleton
              rows={5}
              label={`Loading ${config.assetLabel}`}
            />
          </>
        ) : (
          <>
            <LedgerStats
              control={control}
              consentType={consentType}
              fallbackValue={fallbackValue}
            />

            <AnalyticsPanel
              holdingsCount={count}
              getHoldings={() => getValues("holdings")}
            />

            <DataPanel
              title="Holdings"
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
          </>
        )}
      </OverlayBody>

      <OverlayFooter>
        <FooterButton
          variant="secondary"
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </FooterButton>
        <FooterButton
          type="submit"
          disabled={isLoading || count === 0 || isImporting}
          busy={isImporting}
          busyLabel="Importing…"
        >
          Import to Chat
        </FooterButton>
      </OverlayFooter>
    </form>
  );
}
