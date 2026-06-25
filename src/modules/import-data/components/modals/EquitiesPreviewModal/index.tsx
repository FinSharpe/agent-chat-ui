"use client";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { HoldingsPreviewModal } from "../HoldingsPreviewModal/HoldingsPreviewModal";
import { EQUITIES_CONFIG } from "../HoldingsPreviewModal/editable-configs";

/** Equity holdings preview — the generic editable modal bound to the equity config. */
export function EquitiesPreviewModal(props: BaseAnalysisModalProps) {
  return (
    <HoldingsPreviewModal
      {...props}
      config={EQUITIES_CONFIG}
    />
  );
}
