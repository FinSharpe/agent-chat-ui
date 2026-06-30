# Import-Page Nudges — Frontend Plan

Status: planning · 2026-06-30

Port the four **nudge** accordions (News, Technical, Fundamental, FinSharpe Score)
from the Figma export (`Finance AI Assistant UI/src/app/components/ImportDataPage.tsx`)
into the real `modules/import-data` page, wired to the finsharpe-agents nudge REST
endpoints. Backend contract: `finsharpe-agents/docs/plans/2026-06-30-import-nudges-backend.md`.

## Placement

A new `<PortfolioNudges />` section on `ImportDataPage`, **above the "Connect
Accounts" grid** (after the intro/security `CollapsibleInstructions`). Conditional:
- Section renders only when ≥1 equity or MF holding exists.
- News / Technical / Fundamental accordions show only with ≥1 **equity** holding.
- FinSharpe Score shows with ≥1 equity **or** MF holding.
- No holdings → section not rendered (no empty placeholder).

## Holdings source — `usePortfolioHoldings()`

New hook in `modules/import-data`. Reuses existing machinery:
- `getUserConsent(EQUITIES)` / `getUserConsent(MUTUAL_FUNDS)` from
  `lib/moneyone/moneyone.storage` (localStorage).
- `useFiData(consentID)` → `extractHoldingsFromFiData`.
- **Aggregate by ISIN** across accounts/folios (sum value); compute value:
  equity `units × lastTradedPrice`, MF `closingUnits × nav`.
- Returns `{ isin, name, value, type: "equity" | "mf" }[]`.

This list drives the conditional render **and** every nudge request. A stable
**holdings signature** (sorted ISINs+values hash) is the per-accordion query key.

## Request contract

Holdings are keyed by **ISIN** (frontend has no NSE symbol; backend resolves
ISIN→Ticker→fincode). `value` is absolute ₹. See backend plan. The frontend sends
*all* holdings of the relevant type(s); the backend does top-10-by-value selection.

## Data fetching

- **New orval group `nudge-apis`**: `openapi-nudges.json` + an `orval.config.ts`
  entry (`baseUrl: /api/utilities`, `client: react-query`).
- The nudge endpoints are POSTs but are **reads** → configure orval to emit
  `useQuery` per operation: `override.operations[<opId>].query.useQuery = true`
  (opIds known after first generation). This is the repo's first POST-as-query.
- **Lazy**: `enabled: isOpen && holdings.length > 0`. One query per accordion;
  only the opened accordion fetches.
- **queryKey**: `[nudgeType, holdingsSignature]` → holdings change ⇒ refetch.
- **Refresh ↻**: must send `refresh: true` (plain `invalidateQueries` would refetch
  with `refresh:false` and only re-read the backend cache). Implement via a
  queryKey refresh-nonce, or a small refresh mutation that `setQueryData` seeds.
  Per-accordion (matches the design's per-card ↻).

## Components

Reuse the real app's `components/ui`: `accordion`, `skeleton`, `badge`, `card`.

- `PortfolioNudges` — container; calls `usePortfolioHoldings()`, renders the four
  accordions with the conditional rules above.
- One accordion component per nudge (trigger = icon tile + title + subtitle + ↻ +
  chevron; matches Figma styling).
- **Card renderers** (discriminated union on `type`):
  - News → article list: real headline + link + deterministic sentiment badge.
  - Technical / Fundamental / FinSharpe Score → per-holding card: rule-based verdict
    `<Badge>` (tone from `badge.tone`) + the LLM **nudge line** + deterministic
    `data` fields. `coverage: not_covered` → muted "not covered" card.
- **Skeleton** while the query is pending; up to 10 cards per accordion (scroll if
  tall).

## Out of scope (this phase)

- Backend implementation (separate plan).
- MF coverage for News / Technical / Fundamental.
- Porting the Figma "FinSharpe Insights" tax/rebalance advice cards (replaced by
  FinSharpe Score).
