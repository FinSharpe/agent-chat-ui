# MoneyOne Import — Architecture Reference

How the **Import Data** feature connects a user's financial accounts through the
RBI Account Aggregator (AA) framework via **MoneyOne / FinPro**, fetches their
holdings, and imports them into a chat thread.

> **Conventions in this doc**
> - References are written as `file` or `file → function`, **never line numbers**
>   (they rot). When in doubt, grep the symbol.
> - Code is summarized as **contracts** (inputs → outputs → responsibility). No
>   block is a verbatim copy of source — read the file for the body.
> - Companion doc: **`ADDING_NEW_MONEYONE_CONSENT_TYPE.md`** (the runbook for
>   adding a new asset type). This file is the source of truth for *how the
>   feature works*; the runbook never re-explains the machinery here.

---

## 1. Overview

The feature lives at the dedicated route `src/app/(main)/import/page.tsx`, which
renders `modules/import-data → ImportDataPage`. There is **no `importViewOpen`
URL toggle** — import is its own page.

One pass through the feature:

1. **Connect** — the user authorizes an AA consent for an asset type (mobile +
   PAN), and is redirected to the AA approval page.
2. **Return** — the AA sends the user back to `/moneyone/[slug]`, which resolves
   the real `consentID` and redirects to `/import?consentID=…`.
3. **Fetch** — `/import` detects those params, completes the pending consent in
   `localStorage`, fetches FI data from FinPro, and marks the consent ready.
4. **Use** — each asset card shows Connected/Expired state with Refresh / Remove,
   and an **Analyse** preview modal that reads the fetched holdings.

**Source of truth for "is this consent connected?" is the browser's
`localStorage`** — the server never holds per-user consent state. This is the
single most important fact about the architecture and the reason the data-ready
webhook was removed (see **Appendix A**).

```
Connect ─▶ AA approval ─▶ /moneyone/[slug] ─▶ /import?consentID=… ─▶ FI fetch ─▶ card "Connected" ─▶ Analyse
  (client)     (MoneyOne)     (server route)        (client)         (client)        (client)        (client)
```

Supported asset types (`ConsentType` enum, `lib/moneyone/moneyone.enums.ts`):
`EQUITIES`, `MUTUAL_FUNDS`, `ETF`, `BANK_ACCOUNTS`, `SIP`.

---

## 2. End-to-End Flow

Each step lists the **file → function** that owns it.

### 2.1 Create consent + redirect to the AA

1. `ImportDataPage` renders a `MoneyOneHoldingsCard` per asset type. With no
   ready consent, the card renders `components/moneyone/import-holdings →
   ImportHoldings`, whose **Connect** button runs `useCheckConsentMut`.
2. `useCheckConsentMut` reads `getUserConsent(type)` from `localStorage`. If a
   ready consent exists it short-circuits; otherwise it opens
   `CreateConsentModel`.
3. `CreateConsentModel` collects **mobile (10-digit)** and **PAN (10-char)**. On
   submit it first calls `useListConsentsMut` → `listConsents(mobile, type)`:
   - **Existing consents found** → switch to the **Resume** view
     (`ResumeConsents`, see §2.5).
   - **None** → create a new one via `useCreateConsentAndRedirectMut`.
4. `useCreateConsentAndRedirectMut → createConsentRequestV3` (server action)
   creates the consent **and** returns the AA `webRedirectionUrl` in one call.
   Before redirecting, it writes a **pending** record to
   `localStorage["moneyone:pending-consent:{consentHandle}"]` (so the return
   handler can complete it), then sets `window.location.href = webRedirectionUrl`.

`accountID` sent to MoneyOne is the **browser's `moneyone:userId`** (a generated
UUID) — see `moneyone.storage → getUserId`.

### 2.2 Return from the AA

The AA redirects the browser to a slug route registered with MoneyOne:

```
/moneyone/{consentType}~{accountID}~{threadId?}?ecres=…&resdate=…&fi=…
```

`~` is the delimiter (account/thread IDs may contain `-`). Handled by the
**server component** `src/app/moneyone/[slug]/page.tsx`:

1. Parse and validate the slug's `consentType` + `accountID`.
2. `decryptUrl(searchParams)` (server action) → MoneyOne returns the decrypted
   payload as a discriminated result `{ success, status, data }`.
   - `status === "rejected" | "failed"` → render `ConsentFailedRedirect` (a
     countdown back to `/import`).
   - `status === "error"` → render an inline error.
3. On success, derive `mobileNo = userid.split("@")[0]` and
   `consentHandle = srcref`, then `getConsentList(consentHandle, mobileNo,
   consentType, accountID)` to resolve the real `consentID`.
4. `redirect('/import?consentID=…&consentType=…&mobileNo=…&consentCreationData=…')`.

> The first FI fetch is **not** triggered here — the MoneyOne consent template is
> configured to auto-fetch on first approval (see §8). `requestFiData` is left
> commented in the route on purpose.

### 2.3 FI-data fetch + persist (on `/import`)

`ImportDataPage` always renders `FetchingFiDataModal`, which drives
`useFiData → useFiDataConsentFlow`:

1. Reads `consentID` / `consentType` (+ `mobileNo`, `consentCreationData`) from
   the URL; enabled only when a valid `consentType` is present.
2. Once, before the query: `completePendingConsent(consentID, type, mobileNo,
   consentCreationData)` — promotes the `pending-consent` record to a real
   `moneyone:consent:{consentID}` record (`isDataReady: false`).
3. Query: `getAllFiData(consentID, 3000)` with retry (3 s) until data is present.
4. On success: `updateConsent(consentID, { isDataReady: true, isExpired: false })`,
   strip the consent params from the URL via `history.pushState`, close the modal.
5. `FiDataAnimation` renders the `fetching | success | error` state.

### 2.4 Card display + per-type preview

`MoneyOneHoldingsCard` subscribes via `useConsentQuery(type)` and renders:

- **No consent / not ready** → the `ImportHoldings` Connect button.
- **Connected** (`isDataReady && !isExpired`) → "Connected", **Refresh**
  (`useRefreshFiData`), **Remove** (`ConfirmDialog` → §2.6).
- **Expired** (`isExpired`) → amber state, same Refresh / Remove actions.

The **Analyse** button is the consent-type-specific `AnalysisModal` passed in by
`ImportDataPage` (the preview modal, §3.2), which reads holdings through
`useFiData(consentID)` off the shared cache.

### 2.5 Resume existing consents

`ResumeConsents` (reached from `CreateConsentModel` when `listConsents` returns
hits) lists non-expired, resumable consents and offers, per item
(`components/moneyone/useResumeConsents`):

- **ACTIVE** (`consentID` present) → `useResumeConsentMut`: hydrate into
  `localStorage` **only after** data is confirmed (fast path `getAllFiData`,
  else `requestFiData` + poll), so a failed resume never leaves a half-connected
  card.
- **PENDING** (approval not finished, `consentHandle` only) →
  `useResumePendingMut`: re-write a pending record, regenerate the AA URL via
  `getPendingConsentRedirectUrl` (with PAN + `fipID`), and send the user back to
  the AA to finish **the same** consent (no duplicate).
- **Remove** (ACTIVE only) → `useRevokeListedConsentMut` → `revokeConsent` +
  `deleteConsent`.

### 2.6 Refresh / Revoke / Delete

- **Refresh** (`useRefreshFiData`): `requestFiData` → `removeQueries` (cache is
  `staleTime: Infinity`, so it must be cleared) → poll `getAllFiData` (≤20×3 s) →
  `setQueryData` + `updateConsent({ isDataReady: true })`. A dead consent flips
  the card to **Expired** instead of retrying.
- **Remove** (`MoneyOneHoldingsCard → handleDelete`): `revokeConsent` **first**
  (real AA teardown), then `deleteConsent` locally + `removeQueries`. A revoke
  that reports "already gone" is treated as success.

---

## 3. Component & Fork Architecture

### 3.1 The card state machine

`MoneyOneHoldingsCard` is the one reusable card for every MoneyOne asset type. It
derives three visual states from the `ConsentData` (`isExpired` → `isDataReady`
→ idle) and renders the matching status text, icon, and action set. The
`AnalysisModal` for the type is injected as a prop (`BaseAnalysisModalProps`).

### 3.2 Per-`ConsentType` forks

`ImportDataPage` wires **five** forks, one per asset type, as:

```
<MoneyOneHoldingsCard consentType={…} AnalysisModal={<Type>PreviewModal} … />
```

Each fork (`modules/import-data/components/modals/<Type>PreviewModal/`) is:

| File | Responsibility |
|------|----------------|
| `index.tsx` | The Dialog shell + Analyse trigger; wires the hooks below |
| `<Type>PreviewForm.tsx` | Search / table / summary / submit UI |
| `hooks/use<Type>Data.ts` | `useFiData(consentID)` → extract + shape rows |
| `hooks/useImport<Type>Mutation.ts` | rows → markdown → `stream.submit` to chat |
| `utils/<type>-transformer.ts` | raw FI JSON → table rows |

**Shared building blocks (live — do not delete)** under
`modals/HoldingsPreviewModal/`:

- `components/HoldingsSearch`, `HoldingsTable`, `HoldingsSummaryCard`
- `hooks/useHoldingsForm`
- `utils/holdings-transformer`, `utils/holdings-constants`
  (`QUANTITY_FIELD_MAP` has an entry for **all 5** types).

These are imported by every fork and by `useComprehensiveAnalysisMutation`.

> **Orphaned generic (currently unrendered).**
> `HoldingsPreviewModal/HoldingsPreviewModal.tsx`, `HoldingsPreviewForm.tsx`,
> `hooks/useHoldingsData.ts`, and `hooks/useImportHoldingsMutation.ts` are the
> original *generic* (consent-type-driven) implementation. They are no longer
> rendered — the five forks superseded them. They are the **target of a planned
> consolidation** (collapse the forks back onto one generic shell), so they are
> intentionally kept, not deleted. **Do not "rediscover" them as the live path,
> and do not delete the `HoldingsPreviewModal/` folder** — its `components/` and
> `useHoldingsForm` are the shared blocks above.

### 3.3 Manual (non-MoneyOne) cards

Fixed Deposits, Insurance, Real Estate, Commodities, Other, and NPS are **not**
AA-backed. They render `account-types/AccountTypeCard` with a `forms/*Form`
component whose submit routes to `utils/form-handlers → handleDummyFormSubmit`
(a placeholder that toasts "not yet implemented"). NPS is a `status:
"not-connected"` stub with no form.

---

## 4. localStorage Schema & Consent Lifecycle

Owned by `lib/moneyone/moneyone.storage.ts`.

| Key | Value |
|-----|-------|
| `moneyone:userId` | Generated UUID; doubles as MoneyOne `accountID` |
| `moneyone:consent:{consentID}` | `ConsentData` (the real record) |
| `moneyone:pending-consent:{consentHandle}` | Pre-redirect placeholder, completed on return |
| `moneyone:user:{userId}:consents` | **Legacy** index of consentIDs (see below) |

`ConsentData` shape: `consentID`, `consentCreationData` (ISO), `consentExpiry`
(ISO), `userId`, `isDataReady`, `type` (`ConsentType`), `name`, `mobileNo`, and
optional `isExpired` (set when FinPro reports the consent dead even though the
local expiry date hasn't passed).

**Reads are self-healing.** `getAllUserConsents` **scans every
`moneyone:consent:*` key directly** rather than trusting the `user:{id}:consents`
index — the index breaks if `moneyone:userId` drifts. The index is still
maintained by `saveConsent`/`deleteConsent` for backwards compatibility but is no
longer load-bearing.

**Same-tab reactivity:** `saveConsent`/`deleteConsent` dispatch a
`window` `CustomEvent("moneyone:consent-updated")`. `useConsentQuery` listens for
both that event and the native cross-tab `storage` event and invalidates the
`["consent", type]` query.

**Lifecycle:** `pending-consent` → `consent` (on return) → `isDataReady: true`
(after fetch) → `isExpired: true` (on dead-consent error) → removed (on
revoke+delete).

---

## 5. Server Actions (API Contracts)

All in `lib/moneyone/moneyone.actions.ts` (`"use server"`). Auth headers
(`moneyOneAuthHeaders`) and `MONEY_ONE_BASE_URL` come from env (§8). Every action
returns either a typed success or `{ error, errorCode? }` — callers branch on
`"error" in result`.

| Action | MoneyOne endpoint | Purpose | Status |
|--------|-------------------|---------|--------|
| `createConsentRequestV3` | `POST /v3/requestconsent` | Create consent + return AA redirect URL | live |
| `getEncryptedUrl` | `POST /webRedirection/getEncryptedUrl` | Build AA redirect URL (redirects) | live |
| `getPendingConsentRedirectUrl` | `POST /webRedirection/getEncryptedUrl` | Regenerate AA URL for a PENDING handle | live |
| `decryptUrl` | `POST /webRedirection/decryptUrl` | Decrypt AA return params | live |
| `getConsentList` | `POST /v2/getconsentslist` | Resolve a consent by `consentHandle` (return handler) | live |
| `listConsents` | `POST /v1/accounts/getconsentslist` | List a mobile's resumable consents | live |
| `getConsentStatus` | `POST /v2/getconsentslist` | Live status by `consentID` | live |
| `getAllFiData` | `POST /getallfidata` | Fetch FI data for a consent | live |
| `requestFiData` | `POST /fi/request` | Trigger a fresh AA fetch | live |
| `revokeConsent` | `POST /revokeconsent` | Revoke on the AA (`alreadyGone` flag) | live |
| `createConsentRequest` | `POST /v2/requestconsent` | v2 consent create | **dead** (no caller) |

Notes worth knowing:

- `decryptUrl` validates the inbound params with `webRedirectionDecryptionApiReqParamsSchema`
  (`ecres`/`resdate`/`fi` are strings) — this is a **shape** check only, not an
  authenticity check (see Appendix B).
- `listConsents` filters results by `productID` **client-side**: the
  `/v1/accounts/getconsentslist` response is not reliably scoped to the requested
  product, so it can return other asset types' consents.
- `getAllFiData` always reads the response body even on non-OK, so it can surface
  the real FinPro `errorCode` (e.g. `InvalidConsentId`) instead of a bare status.

---

## 6. React Query Cache Strategy

- **FI data** is keyed `[FI_DATA_QUERY_KEY, consentID]` (`"fi-data"`), with
  `gcTime: 7 days` and `staleTime: Infinity` (configured in `QueryProvider` via
  `setQueryDefaults`). The same key is shared by `useFiDataConsentFlow` (initial
  fetch) and `useFiData` (preview reads), so a preview never re-hits MoneyOne.
- Because `staleTime` is `Infinity`, **Refresh must `removeQueries` first** —
  otherwise the 7-day cache would serve stale holdings even after a fresh fetch.
- **Consent status** is keyed `["consent", type]` with `staleTime: 1s`,
  invalidated on the storage / `moneyone:consent-updated` events (`useConsentQuery`).

---

## 7. Error Handling

`lib/moneyone/moneyone.utils.ts` classifies every FI failure into one of three
kinds via `classifyFiDataError(errorCode, errorMsg)` (matches FinPro codes first,
then a message heuristic):

| Kind | Meaning | Recovery |
|------|---------|----------|
| `consent-dead` | Consent expired/revoked/invalid on MoneyOne | Delete + re-consent. Flips card to **Expired**; stops Refresh polling |
| `data-missing` | Consent valid but FinPro holds no data | Re-fetch via `requestFiData` (Refresh) |
| `transient` | Network/server hiccup | Retry |

FinPro codes (`FP00xx`) are catalogued as two sets in `moneyone.utils.ts`:

- **`CONSENT_DEAD_CODES`** — `InvalidConsentId` (FP0034), `InvalidRequest`
  (FP0058), `ConsentExpired`, `ConsentRevoked`, `ConsentNotActive`,
  `ConsentNotFound`, `ConsentRejected`, `NoConsent`.
- **`DATA_MISSING_CODES`** — `NoDataAvailable` (FP0060), `DataIsDeleted`
  (FP0061), `NoDataFound` (FP0063).

`isConsentInvalidError` is the convenience predicate (`=== "consent-dead"`) used
to flip the Expired state and halt polling. Preview modals render failures
through `modules/import-data/components/shared/FiDataErrorState`, driven by
`isError` / `errorKind` / `errorMessage` returned from each fork's data hook.

---

## 8. Configuration

All MoneyOne config is environment-driven; secrets are **server-only**
(`lib/moneyone/moneyone.headers.ts` — see Appendix B).

| Variable | Purpose |
|----------|---------|
| `MONEY_ONE_BASE_URL` | FinPro API base |
| `MONEY_ONE_CLIENT_ID` / `MONEY_ONE_CLIENT_SECRET` | Auth headers |
| `MONEY_ONE_ORG_ID` / `MONEY_ONE_APP_IDENTIFIER` | Auth headers |
| `MONEY_ONE_<TYPE>_CONSENT_FORM` | Product ID per asset type (`consentFormMap`) |
| `MONEY_ONE_<TYPE>_FIPS` | Comma-separated FIP IDs per type, optional (`consentFipIdsMap`) |

`<TYPE>` ∈ `EQUITIES`, `MUTUAL_FUNDS`, `ETF`, `BANK_ACCOUNTS`, `SIP`. Keep
`.env.example` in sync with all five (it previously omitted SIP).

**MoneyOne dashboard consent-template settings** (referenced in
`[slug]/page.tsx`): Periodicity = **Periodic**, Data Request Mode = **Manual**,
*Do First Time Data Request Automatic* = **true**. This last setting is why the
app does **not** call `requestFiData` on return — the first fetch happens
automatically AA-side.

> **Operational gotcha:** the redirect URL registered with MoneyOne must match
> the deployment's domain exactly, or the AA return will fail before reaching
> `/moneyone/[slug]`.

---

## Appendix A — Reference: the (removed) Data-Ready Webhook

> **Status: removed.** The route
> `src/app/api/webhooks/moneyone/data-ready/route.ts` has been deleted. It was
> **logging/monitoring only** and could not do its apparent job: a server-side
> webhook cannot write the browser `localStorage` that is the source of truth for
> `isDataReady` (§4). Readiness is driven client-side instead — `useFiData` polls
> `getAllFiData` and calls `updateConsent(id, { isDataReady: true })`. This
> appendix exists so the wiring can be faithfully recreated if a server-side
> readiness signal is ever needed.

### A.1 What it was

- **Route:** `POST /api/webhooks/moneyone/data-ready`.
- **Body:** `DataReadyWebHookReqBody` (in `lib/moneyone/moneyone.types.ts`).
  Load-bearing fields: `eventStatus` (acted on `"DATA_READY"`), `productID`,
  `vua`, `consentId`, `accountID` (+ `sessionId`, `firstTimeFetch`,
  `linkRefNumbers`).
- **Mapping:** `productIdToConsentTypeMap`, built **conditionally** from the
  `MONEY_ONE_<TYPE>_CONSENT_FORM` env vars (only the types whose env var was set
  were registered).
- **Parse:** `mobileNo = vua.split("@")[0]` (same parse as `[slug]/page.tsx`);
  unknown `productID` → `console.error`, non-fatal.
- **Responses:** `200 {status:"success"}` happy path; `400` on missing/invalid
  `vua`; `500 {error}` on throw. It only ever logged.

### A.2 MoneyOne-side configuration

- The AA **redirect URL** is registered per the slug pattern
  `/moneyone/{consentType}~{accountID}~{threadId?}` (§2.2).
- The consent-template settings in §8 (Periodic / Manual / first-fetch automatic)
  govern when FinPro fetches and would emit a `DATA_READY` event.

### A.3 If recreating it — decide the scope first

1. **Observability only** (what it was) — fine to log, but it buys little.
2. **Real readiness signal** — requires **moving consent/readiness state
   server-side** (a DB row per authenticated user, encrypted at rest). A webhook
   cannot reach `localStorage`, so without that move it can never flip the card.

### A.4 Mandatory security (the original had none)

The deleted handler had **no authentication and no signature verification** — any
client could `POST` a forged `DATA_READY`. A recreation **must**, before doing
anything stateful:

- Verify an **HMAC signature** header over the **raw** request body against a
  shared secret (e.g. `MONEY_ONE_WEBHOOK_SECRET`), using a constant-time compare;
  return `401` on mismatch.
- Optionally add a bearer/secret header and/or a source-IP allowlist.
- Enforce **idempotency** (dedupe on `consentId` + `sessionId`) and **rate
  limiting**.

This is doubly required for scope (2): a spoofable webhook that *writes* readiness
would let an attacker mark arbitrary consents ready. See **Appendix B**.

---

## Appendix B — Security & Production TODOs

- **Decrypted-redirect trust** (`[slug]/page.tsx` + `decryptUrl`): the AA return
  params are validated for *shape* only. The handler should additionally assert
  the resolved consent's `productID` matches the slug's `consentType` and that
  `accountID` matches, before completing the consent.
- **Secrets:** `moneyone.headers.ts` must stay server-only (`import "server-only"`);
  never log `moneyOneAuthHeaders`.
- **PII in logs:** keep `console.log` of holdings / PAN / mobile / consentIDs
  behind `NODE_ENV === "development"` (or remove). FI data contains PII.
- **localStorage as trust anchor:** consent IDs + mobile live in `localStorage`,
  readable by any XSS and never expiring. Documented accepted risk for the
  single-browser model; revisit if moving consent state server-side.
- **Webhook auth:** if the data-ready webhook is reinstated, Appendix A.4 is
  mandatory.
