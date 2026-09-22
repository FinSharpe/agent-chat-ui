import type { InvestmentType } from "../types/basket-builder.types";

/**
 * The builder's first step, shared by both flows. Copy is the reference
 * wizard's; the ids are the flow keys the orchestrator switches on.
 */
export const investmentTypeOptions: {
  id: Exclude<InvestmentType, "">;
  name: string;
  description: string;
}[] = [
  { id: "stocks", name: "Stocks", description: "Build an equity portfolio" },
  {
    id: "mutualFunds",
    name: "Mutual Funds",
    description: "Build a fund portfolio",
  },
];

/**
 * Steps in the whole wizard: the type choice, then the four of either flow.
 * Both flows are four steps long, so the count does not change with the
 * choice — "Step 1 of 5" stays true whichever way the reader goes.
 */
export const BASKET_WIZARD_STEPS = 5;
