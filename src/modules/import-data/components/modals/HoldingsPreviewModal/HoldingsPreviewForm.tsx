"use client";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FiDataResponse } from "@/lib/moneyone/moneyone.types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HoldingsSearch } from "./components/HoldingsSearch";
import { HoldingsSummaryCard } from "./components/HoldingsSummaryCard";
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
 * Generic editable-holdings form shared by Equities, ETF, and Mutual Funds.
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
  const { consentType, assetLabel, showCurrentValue, AnalyticsPanel } = config;
  // Display name comes from the single ASSET_TYPE_MAP source of truth.
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

    // Transform form data back to holdings (filters quantity = 0)
    const convertedHoldings = transformFormDataToHoldings(
      data.holdings,
      consentType,
    );

    // Create a consolidated account carrying all edited holdings
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

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex-1 overflow-hidden flex flex-col"
    >
      <div className="flex-1 overflow-y-auto space-y-4 px-1">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading {assetLabel}...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Search Bar */}
            <HoldingsSearch
              consentType={consentType}
              onSelectResult={handleAddSearchResult}
            />

            {/* Summary Card */}
            <HoldingsSummaryCard
              totalHoldings={fields.length}
              assetType={assetType}
              currentValue={showCurrentValue ? currentValue : undefined}
            />

            {/* Holdings Table */}
            <HoldingsTable
              fields={fields}
              control={control}
              consentType={consentType}
              onRemove={handleRemoveHolding}
            />

            {/* Asset-specific analytics (Analyze button + results) */}
            <AnalyticsPanel
              holdingsCount={fields.length}
              getHoldings={() => getValues("holdings")}
            />
          </>
        )}
      </div>

      <DialogFooter className="flex flex-row justify-between items-center mt-4 gap-2">
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
          disabled={isLoading || fields.length === 0 || isImporting}
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding to Chat...
            </>
          ) : (
            "Add to Chat & Analyze"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
