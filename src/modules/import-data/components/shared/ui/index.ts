/**
 * Shared UI kit for the Import modals, ported from the reference design's
 * analysis and add-asset popups: the overlay frame (desktop popup / mobile
 * full screen), headers and pill footers, stat tiles, glass-card panels, the
 * small SVG charts, the recharts trend chart, skeletons and INR formatting —
 * so every modal inherits identical spacing, type and colour.
 */

export {
  formatINR,
  formatINRCompact,
  formatINRShort,
  formatPct,
  formatCount,
} from "./format";
export { INTENT_CHIP, INTENT_VALUE, type SurfaceIntent } from "./intent";
export {
  ImportOverlay,
  OverlayHeader,
  FormOverlayHeader,
  OverlayBody,
  OverlayFooter,
  FooterButton,
  CloseButton,
} from "./ImportOverlay";
export { AnalyseButton, ConnectButton } from "./triggers";
export { StatTile, StatGrid } from "./StatTile";
export {
  SectionLabel,
  DataPanel,
  BarePanels,
  EmptyState,
  Notice,
  FlagList,
  Badge,
  TagChip,
  type Flag,
} from "./layout";
export {
  DonutBreakdown,
  ScoreRing,
  MeterRow,
  BarRow,
  type DonutSegment,
} from "./charts";
// TrendChart (recharts) is imported from "./TrendChart" directly, so pulling
// a tile or a panel from this index never drags recharts into a bundle.
export {
  Bone,
  StatTileSkeleton,
  StatTileGridSkeleton,
  TableSkeleton,
  CardListSkeleton,
  ChartSkeleton,
} from "./skeletons";
