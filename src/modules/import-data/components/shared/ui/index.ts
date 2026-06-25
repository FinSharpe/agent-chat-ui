/**
 * Shared "Calm Ledger" UI kit for the import-data preview & analytics surfaces.
 * One cohesive design language — tiles, panels, modal frame, skeletons, and
 * INR formatting — so the five surfaces inherit identical spacing, typography,
 * and token treatment instead of each re-inventing them.
 */

export { formatINR, formatINRCompact, formatCount } from "./format";
export { INTENT_CHIP, INTENT_VALUE, type SurfaceIntent } from "./intent";
export { StatTile } from "./StatTile";
export { SectionLabel, DataPanel, EmptyState } from "./layout";
export {
  PreviewHeader,
  PreviewBody,
  PreviewFooter,
  previewDialogContentClass,
} from "./PreviewShell";
export {
  workspaceDialogContentClass,
  MetricStrip,
  WorkspaceHeader,
  WorkspaceSplit,
  WorkspaceColumn,
  WorkspaceSingle,
  WorkspaceFooter,
  WorkspaceCanvasEmpty,
  WorkspaceCanvasLoading,
  type WorkspaceMetric,
} from "./AnalysisWorkspace";
export {
  StatTileSkeleton,
  StatTileGridSkeleton,
  TableSkeleton,
  CardListSkeleton,
} from "./skeletons";
