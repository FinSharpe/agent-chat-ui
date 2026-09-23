import { IdeaCategory } from "../types/discover.types";

/**
 * The categories in Explore Investment Ideas that have no backend.
 *
 * They used to hold about 35 hand-written baskets with invented returns, risk
 * bands and stock counts. This is a SEBI-registered adviser's product surface:
 * illustrative performance figures on an investment product are not
 * placeholder copy, so the baskets were **deleted** (T-04), not hidden. What
 * is left is each category's name, so the card can still be drawn — plainly
 * disabled, with no count and no way in.
 *
 * "Created by Advisors" is not here: it is the one real category, and it comes
 * from the strategies API (`useStrategyCatalog`).
 */
export const comingSoonIdeaCategories: IdeaCategory[] = [
  { id: "special", name: "Special Investment Opportunities", strategies: [], disabled: true },
  { id: "news-based", name: "News-Based Investment Baskets", strategies: [], disabled: true },
  { id: "research", name: "Ideas from Research Papers", strategies: [], disabled: true },
  { id: "filings", name: "Ideas from Company Filings", strategies: [], disabled: true },
  { id: "curated", name: "Curated Investment Baskets", strategies: [], disabled: true },
  { id: "themes", name: "Trending Investment Themes", strategies: [], disabled: true },
  { id: "investors", name: "Famous Investor Strategies", strategies: [], disabled: true },
];
