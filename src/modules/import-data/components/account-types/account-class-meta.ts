import {
  CandlestickChart,
  Landmark,
  PieChart,
  Repeat,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { AaConsentType } from "../../types/aa";

/**
 * Icon and tile tone per asset class, pinned so a class wears the same colour
 * in the row, the manage sheet and the connect dialog. Matches finsharpe-mobile
 * `connect_flow_screen.dart` (`assetClassIcon` / `assetClassTone`); lucide 0.476
 * has no `CalendarSync`, so SIPs use the closest glyph, `Repeat`.
 */
export type ClassTone = "blue" | "mint" | "navy";

export const CLASS_TONE_CLASS: Record<ClassTone, string> = {
  blue: "bg-[#063BAA]/8 text-[#063BAA] dark:bg-[#22335C] dark:text-[#8FB4FF]",
  mint: "bg-[#97edcc]/30 text-[#0A9E6E] dark:bg-[#1B3A2E] dark:text-[#6EE7B7]",
  navy: "bg-[#0A1F4D]/8 text-forest-deep dark:bg-white/10 dark:text-white",
};

export const CLASS_META: Record<
  AaConsentType,
  { icon: LucideIcon; tone: ClassTone }
> = {
  EQUITIES: { icon: TrendingUp, tone: "blue" },
  MUTUAL_FUNDS: { icon: PieChart, tone: "mint" },
  ETF: { icon: CandlestickChart, tone: "navy" },
  BANK_ACCOUNTS: { icon: Landmark, tone: "blue" },
  SIP: { icon: Repeat, tone: "mint" },
};
