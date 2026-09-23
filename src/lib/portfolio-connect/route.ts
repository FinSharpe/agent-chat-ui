import {
  isAaConsentType,
  type AaConsentType,
} from "@/modules/import-data/types/aa";
import type { PortfolioConnect } from "./parse";

/**
 * Where the card's one button goes.
 *
 * - No identity → sign in, carrying this thread back.
 * - Exactly one class this build knows → that class's consent form.
 * - Several classes, none, or one this build cannot resolve (a Consent value a
 *   later server adds) → the class picker, never a dead link.
 */
export type PortfolioConnectTarget =
  | { kind: "sign-in" }
  | { kind: "class"; type: AaConsentType }
  | { kind: "picker" };

export function portfolioConnectTarget(
  connect: PortfolioConnect,
): PortfolioConnectTarget {
  if (connect.reason === "not_signed_in") return { kind: "sign-in" };
  if (connect.assetClasses.length === 1) {
    const [type] = connect.assetClasses;
    if (isAaConsentType(type)) return { kind: "class", type };
  }
  return { kind: "picker" };
}
