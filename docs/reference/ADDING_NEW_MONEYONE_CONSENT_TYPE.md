# Adding a New MoneyOne Consent Type — Runbook

A step-by-step guide to wiring a new AA asset type (e.g. NPS, Insurance via AA)
into the Import feature.

> **Read first:** `IMPORT_HOLDINGS_DOCUMENTATION.md` §3 (fork architecture) and §7
> (error handling). This runbook only describes the *delta* to add a type — it
> does **not** re-explain the connect/fetch/storage machinery, which lives there.
>
> **Conventions:** cite `file → symbol`, never line numbers. **Don't paste code
> — copy an existing fork and adapt it.** The reference implementations are:
>
> | Style | Copy from | Notes |
> |-------|-----------|-------|
> | Editable (quantity) | `EquitiesPreviewModal` | Search + editable holdings table |
> | Read-only + analytics | `BankAccountsPreviewModal` | Charts/analytics, no editing |
> | Read-only simple | `SipPreviewModal` | `COLUMNS`-config table |
> | Placeholder template | `EtfPreviewModal` | Minimal fork to clone |

---

## 1. Decide the modal style

One question: **does the user edit holdings (quantities) before importing?**

- **Yes** → editable fork → copy `EquitiesPreviewModal`.
- **No, with analytics/charts** → copy `BankAccountsPreviewModal`.
- **No, simple table** → copy `SipPreviewModal`.

Everything else (the card, connect flow, fetch flow, storage) is already generic
in `MoneyOneHoldingsCard` and the server actions — you do **not** touch those.

---

## 2. File checklist

For a new type `Nps` you create one fork folder under
`modules/import-data/components/modals/NpsPreviewModal/`:

| File | Required? | Copy from |
|------|-----------|-----------|
| `index.tsx` | yes | sibling `index.tsx` |
| `NpsPreviewForm.tsx` | yes | sibling form |
| `hooks/useNpsData.ts` | yes | sibling data hook |
| `hooks/useImportNpsMutation.ts` | yes (if importable) | sibling mutation |
| `utils/nps-transformer.ts` | yes | sibling transformer |

Plus small edits to four shared spots: the enum (§3.1), the quantity map (§3.2),
`ImportDataPage` (§3.7), and env config (§4).

> The shared building blocks (`HoldingsSearch`, `HoldingsTable`,
> `HoldingsSummaryCard`, `useHoldingsForm`) under `HoldingsPreviewModal/` are
> reused as-is — import them, don't fork them.

---

## 3. Steps (contract-first)

### 3.1 Add to the `ConsentType` enum
`lib/moneyone/moneyone.enums.ts` — add `NPS = "NPS"`.

### 3.2 Add the quantity field (if quantity-bearing)
`modals/HoldingsPreviewModal/utils/holdings-constants.ts` — add an entry to
`QUANTITY_FIELD_MAP` mapping the new type to the FI-data field that holds the
unit/quantity (e.g. `units`). Read-only types still need an entry (use the same
convention as `SIP` / `BANK_ACCOUNTS`).

### 3.3 Transformer — `utils/nps-transformer.ts`
**Contract:** `(rawFiData) → row[]`. Copy the sibling transformer and remap to
the **real** FI-data field names for this product. Get the field names from an
actual `getAllFiData` response (the AA JSON nesting differs per product — verify
`Summary.Investment.Holdings.Holding[]` vs the product's actual path). Don't trust
the example shape.

### 3.4 Data hook — `hooks/useNpsData.ts`
**Contract — must return the full shape the modal expects, including the error
fields:**

```
{ holdings, formDefaultValues?, isLoading, fiData,
  isError, errorKind, errorMessage }
```

It wraps `useFiData(consentID)` and runs the transformer. **`isError` /
`errorKind` / `errorMessage` are not optional** — they drive `FiDataErrorState`
(see §3.6 and reference §7). A hook that returns only `{ holdings, isLoading }`
will silently ship a modal with no error UX.

### 3.5 Import mutation — `hooks/useImportNpsMutation.ts`
**Contract:** `rows → markdown table → stream.submit(...)` into the chat thread.
Copy the sibling mutation; only the asset noun and the row→markdown formatter
differ. (Skip this file for a view-only type.)

### 3.6 Preview modal — `index.tsx` + `NpsPreviewForm.tsx`
- Render the table from a **`COLUMNS` config array** (see `SipPreviewModal`'s
  `SIP_COLUMNS`), not a hand-rolled `<table>`.
- **Wrap the content in `shared/FiDataErrorState`**, driven by the
  `isError`/`errorKind`/`errorMessage` from §3.4. This is the standard error UX
  and is the most-commonly-missed step.
- Editable forks additionally use `useHoldingsForm` + `HoldingsSearch` +
  `HoldingsTable` from `HoldingsPreviewModal/` (see `EquitiesPreviewForm`).

### 3.7 Wire the fork into the page
`modules/import-data/components/ImportDataPage.tsx` — add a
`<MoneyOneHoldingsCard consentType={ConsentType.NPS} icon={…} title={…}
description={…} AnalysisModal={NpsPreviewModal} />`. NPS currently renders as a
manual `AccountTypeCard` placeholder — replace that block.

---

## 4. Environment variables

Add to `.env.local` (and **`.env.example`**, keeping them in sync):

- `MONEY_ONE_NPS_CONSENT_FORM` — the product ID from the MoneyOne dashboard
  (required; without it the type won't appear in `consentFormMap`).
- `MONEY_ONE_NPS_FIPS` — comma-separated FIP IDs (note the **`_FIPS`** suffix,
  plural; optional).

> `.env.example` has been out of sync before (it was missing SIP). Add the new
> type's vars when you add the type, and fix any gaps you notice.

---

## 5. Testing checklist

1. **Connect** → AA redirect → return lands on `/import` with the card showing
   "Connected".
2. **Analyse** opens the preview with correctly-mapped rows (verify field names
   against the real FI JSON, §3.3).
3. **Error states** render via `FiDataErrorState`: dead consent → Expired card;
   no-data → recoverable via Refresh (reference §7).
4. **Import** posts a correct markdown table into the chat thread.
5. **Refresh** and **Remove** work from the card.
6. **Resume**: an existing consent for the same mobile is offered in
   `ResumeConsents` instead of creating a duplicate.

---

## 6. Notes

- **No webhook step.** The data-ready webhook has been removed (reference
  Appendix A). Readiness is driven client-side; adding a type does **not** require
  any webhook wiring. If you ever need a server-side readiness signal, follow
  reference Appendix A (including its mandatory HMAC auth).
- **Don't extend the orphaned generic.** `HoldingsPreviewModal.tsx` /
  `useImportHoldingsMutation` / `useHoldingsData` are unrendered and slated for a
  consolidation (reference §3.2). Clone a live fork instead.
