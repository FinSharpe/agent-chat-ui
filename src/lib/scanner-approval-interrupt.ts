/**
 * Type definitions and utilities for scanner approval interrupts
 */

export interface CustomScannerDetails {
  search_query: string;
  page_number: number;
  page_size: number;
  segment: string;
  group_type: string;
  group?: string | null;
  show_only_latest_quarter_data: string;
  fixed_columns?: string | null;
  sort?: string | null;
}

export interface SavedScannerDetails {
  scanner_id: number;
  page_number: number;
  page_size: number;
  show_only_latest_quarter_data: string;
}

export interface CustomScannerApprovalInterrupt {
  action: "approve_custom_scanner";
  message: string;
  scanner_details: CustomScannerDetails;
  instructions: {
    approve: string;
    modify: string;
    relax_criteria?: string;
    edit_query?: string;
  };
}

export interface SavedScannerApprovalInterrupt {
  action: "approve_saved_scanner";
  message: string;
  scanner_details: SavedScannerDetails;
  instructions: {
    approve: string;
    modify: string;
    cancel: string;
    relax_criteria?: string;
  };
}

export type ScannerApprovalInterrupt =
  | CustomScannerApprovalInterrupt
  | SavedScannerApprovalInterrupt;

/**
 * Type guard to check if an interrupt value is a custom scanner approval interrupt
 */
export function isCustomScannerApprovalInterrupt(
  value: unknown,
): value is CustomScannerApprovalInterrupt {
  if (!value || typeof value !== "object") {
    return false;
  }

  const interrupt = value as Record<string, any>;

  return (
    interrupt.action === "approve_custom_scanner" &&
    typeof interrupt.message === "string" &&
    interrupt.scanner_details &&
    typeof interrupt.scanner_details === "object" &&
    typeof interrupt.scanner_details.search_query === "string"
  );
}

/**
 * Type guard to check if an interrupt value is a saved scanner approval interrupt
 */
export function isSavedScannerApprovalInterrupt(
  value: unknown,
): value is SavedScannerApprovalInterrupt {
  if (!value || typeof value !== "object") {
    return false;
  }

  const interrupt = value as Record<string, any>;

  return (
    interrupt.action === "approve_saved_scanner" &&
    typeof interrupt.message === "string" &&
    interrupt.scanner_details &&
    typeof interrupt.scanner_details === "object" &&
    typeof interrupt.scanner_details.scanner_id === "number"
  );
}

/**
 * Type guard to check if an interrupt value is any scanner approval interrupt
 */
export function isScannerApprovalInterrupt(
  value: unknown,
): value is ScannerApprovalInterrupt {
  return (
    isCustomScannerApprovalInterrupt(value) ||
    isSavedScannerApprovalInterrupt(value)
  );
}
