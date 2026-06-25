"use client";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { HoldingsPreviewModal } from "../HoldingsPreviewModal/HoldingsPreviewModal";
import { ETF_CONFIG } from "../HoldingsPreviewModal/editable-configs";

/** ETF holdings preview — the generic editable modal bound to the ETF config. */
export function EtfPreviewModal(props: BaseAnalysisModalProps) {
  return (
    <HoldingsPreviewModal
      {...props}
      config={ETF_CONFIG}
    />
  );
}
