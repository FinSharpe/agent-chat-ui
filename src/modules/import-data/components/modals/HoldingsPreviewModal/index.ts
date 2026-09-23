/**
 * HoldingsPreviewModal - Refactored modular structure
 *
 * Public API exports for the holdings preview modal component.
 * All implementation details are encapsulated within this module.
 */

export { HoldingsPreviewModal } from "./HoldingsPreviewModal";

// Export utilities for use in other modules (e.g., useImportHoldingsMutation)
export { extractHoldingsFromFiData } from "./utils/holdings-transformer";
