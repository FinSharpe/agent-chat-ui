"use client";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { HoldingsPreviewModal } from "../HoldingsPreviewModal/HoldingsPreviewModal";
import { MUTUAL_FUNDS_CONFIG } from "../HoldingsPreviewModal/editable-configs";

/** Mutual fund holdings preview — the generic editable modal bound to the MF config. */
export function MutualFundsPreviewModal(props: BaseAnalysisModalProps) {
  return (
    <HoldingsPreviewModal
      {...props}
      config={MUTUAL_FUNDS_CONFIG}
    />
  );
}
