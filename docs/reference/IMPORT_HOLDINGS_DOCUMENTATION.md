# Import Holdings via MoneyOne Account Aggregator - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Complete User Flow](#complete-user-flow)
4. [Technical Implementation](#technical-implementation)
5. [Data Models](#data-models)
6. [Storage Strategy](#storage-strategy)
7. [API Integration](#api-integration)
8. [Code References](#code-references)
9. [Configuration](#configuration)
10. [Error Handling](#error-handling)
11. [Security Considerations](#security-considerations)

---

## Overview

The import holdings feature enables users to securely import their financial data (Equities, Mutual Funds, ETFs, and Bank Accounts) from their financial institutions through India's RBI-approved Account Aggregator (AA) framework, powered by MoneyOne.

### Key Features
- **RBI-Approved**: Uses Account Aggregator framework for secure data access
- **Bank-Level Security**: 256-bit encryption and read-only access
- **No Credential Storage**: Never stores user login credentials
- **Interactive Preview**: Review and edit holdings before importing to chat
- **Manual Refresh**: Refresh data on-demand with cache invalidation
- **Persistent Consent**: Stores consent data in browser localStorage with reactive updates
- **AI Analysis**: Import holdings as markdown table for portfolio insights

### Supported Asset Types
- **Equities (EQSUMMARY)**: Stock holdings with ISIN, units, last traded price - *Editable form*
- **Mutual Funds (WM101)**: MF holdings with scheme details, NAV, folio numbers - *Editable form*
- **ETF**: Exchange Traded Fund holdings - *Editable form (Placeholder, pending API response)*
- **Bank Accounts (DEPOSITDETAILS)**: Bank account statements and transactions - *Read-only with analytics*
- **SIP**: Systematic Investment Plan registrations - *Read-only preview (SipPreviewModal)*

---

## Architecture

### Component Hierarchy

```
Thread (Main Chat UI)
├─ FetchingFiDataModal (OAuth callback & data fetching)
├─ ImportDataPage (Import view)
│   └─ MoneyOneHoldingsCard (Reusable for all MoneyOne consent types)
│       ├─ ImportHoldings (Connect button)
│       │   ├─ useCheckConsentMut (check existing consent)
│       │   └─ CreateConsentModel (new consent form)
│       │       └─ useCreateConsentAndRedirectMut
│       ├─ useConsentQuery (real-time consent status)
│       ├─ useRefreshFiData (manual refresh button)
│       └─ AnalysisModal (Passed as prop - varies by consent type)
│           │
│           ├─ EquitiesPreviewModal (Editable form)
│           │   ├─ useEquitiesData
│           │   └─ useImportEquitiesMutation
│           │
│           ├─ MutualFundsPreviewModal (Editable form)
│           │   ├─ useMutualFundsData
│           │   └─ useImportMutualFundsMutation
│           │
│           ├─ EtfPreviewModal (Editable form - Placeholder)
│           │   ├─ useEtfData
│           │   └─ useImportEtfMutation
│           │
│           └─ BankAccountsPreviewModal (Read-only with analytics)
│               ├─ useBankAccountsData
│               ├─ useImportBankAccountsMutation
│               └─ Analytics Components (charts, transaction list)
└─ ThreadHistory
    └─ Import Button (opens ImportDataPage)
```

### State Management Flow

```
URL Query State (nuqs)
├─ importViewOpen: boolean (toggles import view)
├─ threadId: string | null (current thread)
├─ consentID: string (temporary after OAuth redirect)
├─ consentType: ConsentType (temporary after OAuth)
├─ mobileNo: string (temporary after OAuth)
└─ consentCreationData: string (temporary after OAuth)

localStorage (moneyone.storage.ts)
├─ moneyone:userId (browser-unique user ID)
├─ moneyone:consent:{consentID} (consent data)
├─ moneyone:user:{userId}:consents (user's consent index)
└─ moneyone:pending-consent:{consentHandle} (temporary during OAuth)

React Query Cache
├─ ["consent", consentType] (consent status, 1s staleTime)
└─ ["fi-data", consentID] (FI data, 7-day gcTime, infinite staleTime)

Custom Events
└─ "moneyone:consent-updated" (localStorage changes broadcast)
```

---

## Complete User Flow

### Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMPORT HOLDINGS COMPLETE FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│     USER     │
│  clicks      │
│  "Import"    │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: INITIATE IMPORT                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  • importViewOpen = true (URL state)                                         │
│  • ImportDataPage renders                                                    │
│  • MoneyOneHoldingsCard checks localStorage                                  │
│  • useConsentQuery → getUserConsent(consentType)                            │
│                                                                              │
│  [localStorage]                                                              │
│  ┌─────────────────────────────────────┐                                    │
│  │ moneyone:userId = abc123            │ ◄── Get or create browser ID       │
│  │ moneyone:consent:{id}? = null       │     (First time: No consent)       │
│  └─────────────────────────────────────┘                                    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │ Consent Exists?                 │
                └────┬─────────────────────┬──────┘
                     │ NO                  │ YES (isDataReady=true)
                     │                     │
                     ▼                     ▼
         ┌───────────────────┐   ┌──────────────────────┐
         │ Show "Connect"    │   │ Show "Connected"     │
         │ Button            │   │ + Refresh button     │
         └─────────┬─────────┘   │ + "Analyse" button   │
                   │             └──────────┬───────────┘
                   │                        │
                   │                        └────────────────┐
                   │                                         │
                   ▼                                         │
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: CONSENT CREATION                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  • User clicks "Connect"                                                     │
│  • useCheckConsentMut checks localStorage (finds nothing)                   │
│  • CreateConsentModal opens                                                  │
│  • User enters: Mobile (10 digits), PAN (10 chars)                          │
│                                                                              │
│  ┌─────────────────────────────────────┐                                    │
│  │  CreateConsentModal                 │                                    │
│  │  ┌──────────────────────────────┐   │                                    │
│  │  │ Mobile: [__________]         │   │                                    │
│  │  │ PAN:    [__________]         │   │                                    │
│  │  │        [Create Consent]      │   │                                    │
│  │  └──────────────────────────────┘   │                                    │
│  └─────────────────────────────────────┘                                    │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: CONSENT REQUEST & REDIRECT (V3 API)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  • useCreateConsentAndRedirectMut.mutate()                                  │
│  • Generate userId from localStorage                                         │
│  • Construct redirect URL: /moneyone/{type}~{userId}~{threadId?}           │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ POST /v3/requestconsent (MoneyOne API)                               │   │
│  │ ────────────────────────────────────────────────────────────────►    │   │
│  │                                                                       │   │
│  │ ◄──────────────────────────────────────────────────────────────────  │   │
│  │ Response: {                                                           │   │
│  │   webRedirectionUrl,                                                 │   │
│  │   consent_handle,                                                    │   │
│  │   status: "PENDING"                                                  │   │
│  │ }                                                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [localStorage] Save pending consent:                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ moneyone:pending-consent:{handle} = {                               │   │
│  │   consentHandle, mobileNo, consentType, userId,                     │   │
│  │   consentCreationData, consentExpiry, name                          │   │
│  │ }                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  • Redirect user to webRedirectionUrl (MoneyOne OAuth)                      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: OAUTH FLOW (External - MoneyOne)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                     MoneyOne OAuth Page                            │     │
│  │                                                                     │     │
│  │  1. User authenticates (Broker/AMC login)                          │     │
│  │  2. User grants consent for data access                            │     │
│  │  3. MoneyOne redirects back with encrypted params                  │     │
│  │                                                                     │     │
│  │     /?ecres=...&fi=...&resdate=...                                 │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: CONSENT VERIFICATION & REDIRECT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  • /moneyone/[slug]/page.tsx (Server-side)                                  │
│  • Parse slug: {consentType}~{accountID}~{threadId?}                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ POST /webRedirection/decryptUrl                                      │   │
│  │ ────────────────────────────────────────────────────────────────►    │   │
│  │ ◄──────────────────────────────────────────────────────────────────  │   │
│  │ Response: { userid, srcref (consentHandle) }                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ POST /v2/getconsentslist                                             │   │
│  │ ────────────────────────────────────────────────────────────────►    │   │
│  │ ◄──────────────────────────────────────────────────────────────────  │   │
│  │ Response: [{ consentID, consentHandle, ... }]                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  • Extract real consentID                                                   │
│  • Redirect to: /?consentID={id}&consentType={type}&mobileNo={no}&...       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 6: FI DATA FETCHING & CONSENT COMPLETION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  • FetchingFiDataModal opens (detects consentID in URL)                     │
│  • useFiDataConsentFlow triggered                                           │
│                                                                             │
│  [React Query] queryKey: ["fi-data", consentID]                             │
│                                                                             │
│  Step 1: Complete pending consent                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ completePendingConsent(consentID, consentType, mobileNo)            │    │
│  │ • Find pending consent in localStorage                              │    │
│  │ • Save full consent with real consentID                             │    │
│  │ • Remove pending consent                                            │    │
│  │ • Dispatch "moneyone:consent-updated" event                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  [localStorage] Updated:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ moneyone:consent:{consentID} = {                                    │    │
│  │   consentID, userId, consentType, mobileNo,                         │    │
│  │   isDataReady: false,  ◄── Not ready yet                            │    │
│  │   consentCreationData, consentExpiry                                │    │
│  │ }                                                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Step 2: Fetch FI data (with retry logic)                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ POST /getallfidata (wait 3s before first fetch)                      │   │
│  │ ────────────────────────────────────────────────────────────────►    │   │
│  │                                                                      │   │
│  │ If error "NoDataFound":                                              │   │
│  │   • React Query retries every 3s (unlimited retries)                 │   │
│  │                                                                      │   │
│  │ ◄──────────────────────────────────────────────────────────────────  │   │
│  │ Response: FiDataResponse (holdings data)                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Step 3: Update consent & cache data                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ [React Query Cache]                                                 │    │
│  │ ["fi-data", consentID] = FiDataResponse                             │    │
│  │ gcTime: 7 days, staleTime: Infinity                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ updateConsent(consentID, { isDataReady: true })                     │    │
│  │ Dispatch "moneyone:consent-updated" event                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  • Remove URL params (consentID, consentType, mobileNo...)                  │
│  • Close modal after 1.5s delay                                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
        ▼                                                 ▼
┌─────────────────────┐                    ┌──────────────────────────────────┐
│ PHASE 7:            │                    │ PHASE 8:                         │
│ HOLDINGS PREVIEW    │                    │ MANUAL REFRESH                   │
│ & IMPORT            │                    │                                  │
├─────────────────────┤                    ├──────────────────────────────────┤
│                     │                    │ • User clicks refresh (🔄)       │
│ User clicks         │                    │                                  │
│ "Analyse"           │                    │ ┌──────────────────────────────┐ │
│                     │                    │ │ POST /fi/request             │ │
│ ┌─────────────────┐ │                    │ │ ──────────────────────────►  │ │
│ │ Preview Modal   │ │                    │ │ ◄────────────────────────────│ │
│ │ Opens           │ │                    │ │ Triggers fresh fetch         │ │
│ │                 │ │                    │ └──────────────────────────────┘ │
│ │ • Fetch from    │ │                    │                                  │
│ │   React Query   │ │                    │ • Clear React Query cache:       │
│ │   cache         │ │                    │   removeQueries(["fi-data"])     │
│ │                 │ │                    │                                  │
│ │ • Transform to  │ │                    │ • Poll getAllFiData() every 3s   │
│ │   editable form │ │                    │   (max 20 retries ≈ 60s)         │
│ │                 │ │                    │                                  │
│ │ • User edits    │ │                    │ • Update cache with fresh data   │
│ │   quantities    │ │                    │                                  │
│ │                 │ │                    │ • Update timestamp:              │
│ │ • Add/remove    │ │                    │   consentCreationData = now()    │
│ │   holdings      │ │                    │                                  │
│ └─────────────────┘ │                    │ • All components auto-update     │
│                     │                    │                                  │
│ User clicks         │                    └──────────────────────────────────┘
│ "Import"            │
│                     │
│ ┌─────────────────┐ │
│ │ Transform to    │ │
│ │ markdown table  │ │
│ │                 │ │
│ │ • Filter qty=0  │ │
│ │ • Format data   │ │
│ │ • Create msg    │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ stream.submit() │ │
│ │                 │ │
│ │ Send to AI for  │ │
│ │ analysis        │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  KEY COMPONENTS & STATE                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [URL State (nuqs)]                                                         │
│  • importViewOpen: boolean                                                  │
│  • threadId: string | null                                                  │
│  • consentID: string (temporary during flow)                                │
│                                                                             │
│  [localStorage]                                                             │
│  • moneyone:userId                          ◄── Browser-unique ID (UUID)    │
│  • moneyone:consent:{consentID}             ◄── Full consent data           │
│  • moneyone:user:{userId}:consents          ◄── Array of consent IDs        │
│  • moneyone:pending-consent:{handle}        ◄── Temporary (during OAuth)    │
│                                                                             │
│  [React Query Cache]                                                        │
│  • ["consent", consentType]                 ◄── 1s staleTime, auto-refetch  │
│  • ["fi-data", consentID]                   ◄── 7-day cache, never stale    │
│                                                                             │
│  [Custom Events]                                                            │
│  • "moneyone:consent-updated"               ◄── Dispatched on localStorage  │
│                                                  changes for reactivity     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Initiate Import

**Location**: Import Data Page → Connect Accounts section

1. User clicks "Import" from ThreadHistory sidebar
2. `importViewOpen` query param set to `true`
3. `ImportDataPage` renders with `MoneyOneHoldingsCard` components
4. `useConsentQuery` hook checks localStorage for existing consents
5. Cards show "Connect" button if no valid consent exists
6. Cards show "Connected" status + refresh button if data ready

**Code**:
- `src/components/thread/history/index.tsx:165-178`
- `src/modules/import-data/components/ImportDataPage.tsx:76-90`
- `src/modules/import-data/components/account-types/MoneyOneHoldingsCard.tsx`

### Phase 2: Consent Creation

**Location**: Connect button → Create Consent Modal

1. User clicks "Connect" on Equity or MF card
2. `ImportHoldings` component executes `useCheckConsentMut`
   - Checks `getUserConsent(consentType)` from localStorage
   - If consent exists with `isDataReady: true`, returns FI data
   - If no consent, returns null to trigger modal
3. `CreateConsentModel` modal opens
4. User enters:
   - Mobile number (10 digits)
   - PAN number (10 alphanumeric chars, auto-uppercase)

**Code**:
- `src/components/moneyone/import-holdings.tsx:16-66`
- `src/components/moneyone/useCheckConsentMut.ts`
- `src/components/moneyone/CreateConsentModel.tsx:21-90`

### Phase 3: Consent Request & Redirect (V3 API)

**Location**: Create Consent Modal → MoneyOne OAuth

**Flow**:
```
useCreateConsentAndRedirectMut.mutate()
  ↓
Generate browser-unique userId via getUserId()
  ↓
Construct redirect URL:
  /moneyone/{consentType}~{userId}~{threadId?}
  ↓
createConsentRequestV3(mobileNo, consentType, userId, pan, redirectUrl)
  → POST /v3/requestconsent (single API call)
  ← { status: "success", data: {
      webRedirectionUrl,
      consent_handle,
      status
    }}
  ↓
Save pending consent to localStorage
  key: moneyone:pending-consent:{consentHandle}
  value: {
    consentHandle,
    mobileNo,
    consentType,
    userId,
    consentCreationData,
    consentExpiry,
    name
  }
  ↓
redirect(webRedirectionUrl) → User taken to MoneyOne OAuth page
```

**Important**: V3 API combines consent creation + encrypted URL generation in one call, replacing the older V2 two-step flow.

**Redirect URL Format**:
```
https://yourdomain.com/moneyone/{consentType}~{userId}~{threadId}
Example: https://app.com/moneyone/EQUITIES~abc123~thread-xyz
```

**Code**: `src/components/moneyone/useCreateConsentAndRedirectMut.ts:13-71`

### Phase 4: OAuth & Return

**Location**: MoneyOne OAuth → Redirect Handler

1. User authenticates at their depository/broker (NSDL, CDSL, AMC, etc.)
2. User grants consent for data access
3. MoneyOne redirects back with encrypted params:
   ```
   ?ecres=...&fi=...&resdate=...
   ```

**Code**: MoneyOne → `src/app/moneyone/[slug]/page.tsx`

### Phase 5: Consent Verification & Redirect

**Location**: Server-Side Redirect Handler Page

**Flow**:
```
Receive encrypted params from MoneyOne
  ↓
Parse slug: {consentType}~{accountID}~{threadId?}
  using ~ delimiter (since IDs may contain dashes)
  ↓
Validate consentType against ConsentType enum
  ↓
decryptUrl(searchParams)
  → POST /webRedirection/decryptUrl
  ← { status: "S", userid, srcref }
  ↓
Extract mobileNo from userid (split on '@')
Extract consentHandle from srcref
  ↓
getConsentList(consentHandle, mobileNo, consentType, accountID)
  → POST /v2/getconsentslist
  ← { status: "success", data: [{ consentID, ... }] }
  ↓
Find consent matching consentHandle
Extract real consentID
  ↓
redirect(/?consentID={id}&consentType={type}&mobileNo={no}&consentCreationData={date}&importViewOpen=true&threadId={tid?})
```

**Code**: `src/app/moneyone/[slug]/page.tsx:16-98`

### Phase 6: FI Data Fetching & Consent Completion

**Location**: Main App with FetchingFiDataModal

**Trigger**: `useFiDataConsentFlow` hook detects `consentID` in URL params

**Flow**:
```
FetchingFiDataModal opens with loading animation
  ↓
React Query starts with queryKey: ["fi-data", consentID]
  ↓
completePendingConsent(consentID, consentType, mobileNo, consentCreationData)
  - Find pending consent in localStorage
  - Save full consent with real consentID
  - Remove pending consent entry
  - Dispatch "moneyone:consent-updated" custom event
  ↓
getAllFiData(consentID, waitTime: 3000ms)
  - Wait 3 seconds before first fetch
  → POST /getallfidata
  ← { status: "success", data: FiDataResponse }
     OR { errorCode: "NoDataFound" }
  ↓
React Query Retry Logic:
  - If error: retry after 3s delay
  - Max retries: unlimited (until success or user closes modal)
  - retryDelay: 3000ms
  ↓
On Success:
  - Cache data in React Query (7-day gcTime, infinite staleTime)
  - updateConsent(consentID, { isDataReady: true })
  - Dispatch "moneyone:consent-updated" event
  - Remove URL params (consentID, consentType, mobileNo, consentCreationData)
  - Close modal after 1.5s delay
```

**React Query Configuration**:
```ts
{
  queryKey: ["fi-data", consentID],
  enabled: !!consentID && !!consentType,
  retry: true,
  retryDelay: 3000,
  gcTime: 7 days,        // Configured via QueryProvider defaults
  staleTime: Infinity,   // Configured via QueryProvider defaults
  refetchOnWindowFocus: false
}
```

**Code**:
- `src/components/moneyone/FetchingFiDataModal.tsx:6-17`
- `src/modules/import-data/hooks/useFiData.ts:26-99`

### Phase 7: Holdings Preview & Import

**Location**: Import Data Page → MoneyOneHoldingsCard

After successful FI data fetch:
- `useConsentQuery` hook auto-updates (listens to "moneyone:consent-updated" events)
- `MoneyOneHoldingsCard` displays:
  - Green checkmark icon
  - "Connected" status
  - Refresh button (🔄) for manual data refresh
  - "Analyse" button (enabled)
  - Last updated timestamp

**User Action: Click "Analyse" button**

Opens `HoldingsPreviewModal` with:

1. **Data Fetching**:
   ```
   useHoldingsData(consentID, consentType, isDataReady)
     ↓
   useFiData(consentID, true) // Fetches from React Query cache
     ↓
   extractHoldingsFromFiData(fiData)
     - Flatten all holdings from all accounts
     ↓
   transformHoldingsToFormData(holdings, consentType)
     - Add `quantity` field based on QUANTITY_FIELD_MAP
     - EQUITIES: quantity = parseFloat(holding.units)
     - MUTUAL_FUNDS: quantity = parseFloat(holding.closingUnits)
   ```

2. **UI Features**:
   - Searchable holdings table with virtualization
   - Edit quantities (set to 0 to exclude)
   - Add new holdings via search (stocks or mutual funds)
   - Portfolio summary card (total holdings, total value)
   - Real-time form validation with react-hook-form

3. **User Action: Click import button**:
   ```
   transformFormDataToHoldings(formHoldings, consentType)
     - Filter out holdings with quantity = 0
     - Convert quantity field back to original field name
     ↓
   Reconstruct modified FiData structure
     ↓
   Close modal & navigate to chat (importViewOpen=false)
     ↓
   useImportHoldingsMutation.mutate({ data: modifiedFiData, consentType })
     ↓
   extractHoldingsFromFiData(data)
     ↓
   transformHoldingsToMarkdownFormat(holdings, consentType)
     - EQUITIES: { "Company Name", "ISIN", "Units" }
     - MUTUAL_FUNDS: { "Description", "ISIN", "Closing Units" }
     ↓
   convertToMarkdownTable(formattedHoldings)
     ↓
   Create human message:
     "I've imported my {assetType} holdings. Here's the data:

     {markdownTable}

     Please analyze my portfolio and provide insights."
     ↓
   stream.submit({ messages: [...toolMessages, newHumanMessage] })
     - Uses existing threadId or creates new thread
     - AI receives holdings data in markdown table format
   ```

**Code**:
- `src/modules/import-data/components/account-types/MoneyOneHoldingsCard.tsx:91-120`
- `src/modules/import-data/components/modals/HoldingsPreviewModal/HoldingsPreviewModal.tsx`
- `src/modules/import-data/hooks/useImportHoldingsMutation.ts:22-90`

### Phase 8: Manual Data Refresh

**User Action: Click refresh button (🔄)**

**Flow**:
```
useRefreshFiData.mutate(consentID)
  ↓
requestFiData(consentID)
  → POST /fi/request (triggers fresh fetch from MoneyOne)
  ← { response: "ok", data: { consentId, sessionId } }
  ↓
Clear React Query cache (critical for 7-day cache):
  queryClient.removeQueries({ queryKey: ["fi-data", consentID] })
  ↓
Poll for new data with retries:
  maxRetries: 20 (≈60 seconds total)
  retryDelay: 3000ms
  ↓
  getAllFiData(consentID)
    - If error: retry after 3s
    - If success: return data
  ↓
On Success:
  - Update React Query cache: queryClient.setQueryData(...)
  - updateConsent(consentID, {
      isDataReady: true,
      consentCreationData: new Date().toISOString()
    })
  - All components using useFiData auto-update reactively
  - Toast success notification
```

**Why Clear Cache?**
- FI data queries use `staleTime: Infinity` (7-day cache)
- Without clearing, new data would never refetch
- `removeQueries` forces fresh fetch even with long cache

**Code**: `src/modules/import-data/hooks/useFiData.ts:146-205`

---

## Technical Implementation

### 1. Import Button Integration

**Location**: `src/components/thread/history/index.tsx:165-178`

```tsx
<Button
  variant="outline"
  className="w-full justify-start gap-2"
  onClick={() => {
    setQuery({
      importViewOpen: true,
      threadId: null,
    });
  }}
>
  <Database className="h-4 w-4" />
  Import
</Button>
```

**Behavior**:
- Opens import view
- Clears active thread
- Maintains other query params

### 2. MoneyOneHoldingsCard Component

**Location**: `src/modules/import-data/components/account-types/MoneyOneHoldingsCard.tsx`

```tsx
export function MoneyOneHoldingsCard({
  consentType,
  icon: Icon,
  title,
  description,
  AnalysisModal, // Consent-type-specific preview modal (BaseAnalysisModalProps)
}: MoneyOneHoldingsCardProps) {
  const { data: consent } = useConsentQuery(consentType);
  const { mutate: refreshData, isPending: isRefreshing } = useRefreshFiData();

  const isDataReady = consent?.isDataReady;
  const lastUpdated = formatLastUpdated(consent?.consentCreationData);

  return (
    <Card>
      {/* Icon with dynamic color */}
      {/* Title & description */}
      {/* Last updated info */}

      <div className="flex items-center justify-between gap-2 mt-auto pt-3">
        {/* Left: Import/Connect button */}
        {isDataReady ? (
          <>
            <span>Connected</span>
            <Button onClick={handleRefresh}>
              <RefreshCw />
            </Button>
          </>
        ) : (
          <ImportHoldings consentType={consentType} />
        )}

        {/* Right: Analyse button — injected per consent type */}
        <AnalysisModal consent={consent} />
      </div>
    </Card>
  );
}
```

> **Note**: The card is now generic over the preview modal. Each consent type
> passes its own `AnalysisModal` (e.g. `EquitiesPreviewModal`,
> `MutualFundsPreviewModal`, `BankAccountsPreviewModal`, `EtfPreviewModal`,
> `SipPreviewModal`) from `ImportDataPage`, rather than the card hardcoding
> `HoldingsPreviewModal`. The modal must accept `BaseAnalysisModalProps`
> (`{ consent: ConsentData | null }`).

```tsx
// Wiring in ImportDataPage.tsx
<MoneyOneHoldingsCard
  consentType={ConsentType.EQUITIES}
  icon={BarChart3}
  title="Equity Holdings"
  description="..."
  AnalysisModal={EquitiesPreviewModal}
/>
```

**Key Features**:
- Real-time consent status via `useConsentQuery`
- Manual refresh via `useRefreshFiData`
- Holdings preview via `HoldingsPreviewModal`
- Last updated timestamp formatting

### 3. Consent Query Hook (Real-time Updates)

**Location**: `src/modules/import-data/hooks/useConsentQuery.ts`

```tsx
export function useConsentQuery(consentType: ConsentType) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["consent", consentType],
    queryFn: () => getUserConsent(consentType),
    staleTime: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    // Listen for storage events (cross-tab changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("moneyone:consent:") || e.key?.startsWith("moneyone:user:")) {
        queryClient.invalidateQueries({ queryKey: ["consent", consentType] });
      }
    };

    // Listen for custom events (same-tab changes)
    const handleCustomStorageChange = ((e: CustomEvent) => {
      if (e.detail?.consentType === consentType) {
        queryClient.invalidateQueries({ queryKey: ["consent", consentType] });
      }
    }) as EventListener;

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("moneyone:consent-updated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("moneyone:consent-updated", handleCustomStorageChange);
    };
  }, [consentType, queryClient]);

  return query;
}
```

**Features**:
- Automatic refetch on mount and window focus
- Listens to both StorageEvent (cross-tab) and CustomEvent (same-tab)
- Invalidates queries when localStorage changes
- 1-second stale time for responsive updates

### 4. HoldingsPreviewModal Architecture

**Location**: `src/modules/import-data/components/modals/HoldingsPreviewModal/`

**Modular Structure**:
```
HoldingsPreviewModal/
├── HoldingsPreviewModal.tsx         # Container (modal state, data fetching)
├── HoldingsPreviewForm.tsx          # Form logic (react-hook-form)
├── components/
│   ├── HoldingsSummaryCard.tsx     # Portfolio summary
│   ├── HoldingsTable.tsx           # Table with virtualization
│   ├── HoldingTableRow.tsx         # Editable row
│   └── HoldingsSearch.tsx          # Add new holdings
├── hooks/
│   ├── useHoldingsData.ts          # Data fetching
│   ├── useHoldingsForm.ts          # Form management
│   └── useHoldingsSearch.ts        # Search functionality
└── utils/
    ├── holdings-constants.ts        # Constants
    └── holdings-transformer.ts      # Data transformations
```

**Key Transformations** (`holdings-transformer.ts`):

```ts
// Extract holdings from FI data
extractHoldingsFromFiData(fiData: FiDataResponse): Holding[]

// Add quantity field for form management
transformHoldingsToFormData(holdings, consentType): HoldingWithQuantity[]

// Convert back to holdings (filters quantity=0)
transformFormDataToHoldings(formHoldings, consentType): Holding[]

// Format for markdown table import
transformHoldingsToMarkdownFormat(holdings, consentType): Record<string, string>[]

// Get display name
getAssetTypeName(consentType): "Equity" | "Mutual Fund"
```

**Quantity Field Mapping** (`holdings-constants.ts`):
```ts
export const QUANTITY_FIELD_MAP = {
  [ConsentType.EQUITIES]: 'units' as const,
  [ConsentType.MUTUAL_FUNDS]: 'closingUnits' as const,
};
```

### 5. Import Holdings Mutation

**Location**: `src/modules/import-data/hooks/useImportHoldingsMutation.ts`

```tsx
export function useImportHoldingsMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async ({ data, consentType }: ImportHoldingsParams) => {
      // Extract & transform holdings
      const holdings = extractHoldingsFromFiData(data);
      const formattedHoldings = transformHoldingsToMarkdownFormat(holdings, consentType);
      const markdownTable = convertToMarkdownTable(formattedHoldings);

      // Create message
      const assetType = getAssetTypeName(consentType);
      const messageText = `I've imported my ${assetType} holdings...`;

      // Submit to stream
      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text: messageText }],
      };

      stream.submit(
        { messages: [...toolMessages, newHumanMessage] },
        { streamMode: ["values"], optimisticValues: ... }
      );

      return { assetType, holdingsCount: holdings.length };
    },
    onSuccess: (result) => {
      toast.success(`${result.assetType} holdings added to chat`);
    },
  });
}
```

---

## Data Models

### ConsentData (localStorage)

```typescript
interface ConsentData {
  consentID: string;           // Real consent ID from MoneyOne
  consentCreationData: string; // ISO date string (used for "last updated")
  consentExpiry: string;       // ISO date string
  userId: string;              // Browser-unique user ID (UUID)
  isDataReady: boolean;        // True after successful FI data fetch
  type: ConsentType;           // EQUITIES | MUTUAL_FUNDS
  name: string | null;         // User identifier (mobile number)
  mobileNo: string;            // User's mobile number
}
```

### FiDataResponse

```typescript
type FiDataResponse = AccountType[];

type AccountType = {
  linkReferenceNumber: string;
  maskedAccountNumber: string;
  fiType: string;
  bank: string;
  Summary?: {
    costValue: string;
    currentValue: string;
    Investment: {
      Holdings: {
        Holding: Holding[];
      };
    };
  };
};
```

### Holding (Unified for Equity & MF)

```typescript
type Holding = {
  // Mutual Fund fields
  amc: string;              // Asset Management Company
  nav: string;              // Net Asset Value
  folioNo: string;          // Folio number
  navDate: string;          // NAV date
  amfiCode: string;         // AMFI code
  schemeTypes: string;      // Scheme type
  closingUnits: string;     // Closing units
  schemeOption: string;     // Scheme option
  schemeCategory: string;   // Scheme category

  // Equity fields
  units: string;            // Number of units
  issuerName: string;       // Company name
  isin: string;             // ISIN code
  isinDescription: string;  // Description
  lastTradedPrice: string;  // Last traded price

  // Common fields
  ucc: string;
  lienUnits: string;
  registrar: string;
  schemeCode: string;
  FatcaStatus: string;
  lockinUnits: string;
};
```

### HoldingWithQuantity (Form Management)

```typescript
type HoldingWithQuantity = Holding & { quantity: number };

// Used in HoldingsPreviewModal for editing
// quantity field is derived from:
// - EQUITIES: parseFloat(holding.units)
// - MUTUAL_FUNDS: parseFloat(holding.closingUnits)
```

---

## Storage Strategy

### localStorage Keys

```typescript
// User identification
"moneyone:userId" → uuidv4()

// Consent storage
"moneyone:consent:{consentID}" → ConsentData

// User's consent index
"moneyone:user:{userId}:consents" → string[] (consent IDs)

// Temporary during OAuth flow
"moneyone:pending-consent:{consentHandle}" → PendingConsentData
```

### Storage Functions

**Location**: `src/lib/moneyone/moneyone.storage.ts`

```typescript
// Core functions
getUserId(): string                     // Get or create browser-unique ID
saveConsent(consent: ConsentData): void // Save & dispatch event
getConsent(consentID: string): ConsentData | null
getUserConsent(consentType: ConsentType): ConsentData | null // Most recent valid
updateConsent(consentID: string, updates: Partial<ConsentData>): void
deleteConsent(consentID: string): void
getAllUserConsents(): ConsentData[]
checkConsent(consentType: ConsentType): boolean
completePendingConsent(...): ConsentData | null // Post-OAuth conversion
```

### Custom Event System

**Purpose**: Enable same-tab reactivity for localStorage changes

```typescript
// Dispatched by saveConsent() and updateConsent()
window.dispatchEvent(new CustomEvent("moneyone:consent-updated", {
  detail: { consentType, type: "consent" }
}));

// Listened by useConsentQuery hook
window.addEventListener("moneyone:consent-updated", handleCustomStorageChange);
```

### Consent Lifecycle

```
1. User initiates → savePendingConsent(consentHandle)
   localStorage: "moneyone:pending-consent:{handle}"

2. OAuth redirect → completePendingConsent(consentID)
   - Remove pending consent
   - Save full consent with real consentID
   - Dispatch "moneyone:consent-updated" event
   localStorage: "moneyone:consent:{consentID}"

3. Data fetched → updateConsent({ isDataReady: true })
   - Update consent
   - Dispatch "moneyone:consent-updated" event

4. User refreshes → updateConsent({ consentCreationData: new Date() })

5. User removes → revokeConsent(consentID) then deleteConsent(consentID)
   - revokeConsent: POST /revokeconsent on MoneyOne (stops AA data sharing).
     "Already revoked"/"does not exist" is treated as success; any other
     failure still removes locally but warns the user (warning-on-failure).
   - deleteConsent: remove consent + remove from user's index
   - Clear cached FI data: queryClient.removeQueries(["fi-data", consentID])
   - Dispatch "moneyone:consent-updated" event
   - Guarded by a ConfirmDialog (revoke is irreversible)
```

---

## API Integration

### MoneyOne Base Configuration

**Location**: `src/lib/moneyone/moneyone.actions.ts`

**Environment Variables**:
```bash
MONEY_ONE_BASE_URL=https://api.moneyone.in
MONEY_ONE_API_KEY=your_api_key_here
MONEY_ONE_CLIENT_ID=your_client_id_here

# Consent Form IDs (Product IDs)
MONEY_ONE_EQUITIES_CONSENT_FORM=EQSUMMARY
MONEY_ONE_MUTUAL_FUNDS_CONSENT_FORM=WM101

# Financial Information Provider IDs (comma-separated)
MONEY_ONE_EQUITIES_FIPS=NSDL-FIP,CDSL-FIP
MONEY_ONE_MUTUAL_FUNDS_FIPS=CAMS-FIP,KARVY-FIP
```

**Auth Headers** (`src/lib/moneyone/moneyone.headers.ts`):
```typescript
export const moneyOneAuthHeaders = {
  "api-key": process.env.MONEY_ONE_API_KEY!,
  "client-id": process.env.MONEY_ONE_CLIENT_ID!,
};
```

### API Endpoints

#### 1. Create Consent Request V3 (One-Step Flow)

```typescript
POST /v3/requestconsent

Request:
{
  "partyIdentifierType": "MOBILE",
  "partyIdentifierValue": "9876543210",
  "productID": "EQSUMMARY" | "WM101",
  "vua": "9876543210@onemoney",
  "accountID": "uuid-v4",
  "fipID": ["FIP1", "FIP2"],
  "pan": "ABCDE1234F",
  "redirectUrl": "https://app.com/moneyone/EQUITIES~userId~threadId"
}

Response:
{
  "status": "success",
  "ver": "3.0",
  "message": "Consent request created",
  "data": {
    "webRedirectionUrl": "https://moneyone.in/auth?encrypted=...",
    "status": "PENDING",
    "consent_handle": "consent-handle-123"
  }
}
```

**Code**: `src/lib/moneyone/moneyone.actions.ts:77-126`

**Advantages over V2**:
- Single API call (combines consent creation + encrypted URL)
- Includes FIP IDs in request
- Returns webRedirectionUrl directly

#### 2. Decrypt URL

```typescript
POST /webRedirection/decryptUrl

Request:
{
  "webRedirectionURL": {
    "ecres": "...",
    "fi": "...",
    "resdate": "..."
  }
}

Response:
{
  "status": "success",
  "data": {
    "status": "S",
    "userid": "9876543210@onemoney",
    "srcref": "consent-handle-123"
  }
}
```

**Code**: `src/lib/moneyone/moneyone.actions.ts:204-234`

#### 3. Get Consent List

```typescript
POST /v2/getconsentslist

Request:
{
  "partyIdentifierType": "MOBILE",
  "partyIdentifierValue": "9876543210",
  "productID": "EQSUMMARY",
  "accountID": "uuid-v4"
}

Response:
{
  "status": "success",
  "data": [
    {
      "consentID": "consent-id-456",
      "consentHandle": "consent-handle-123",
      "status": "ACTIVE",
      "productID": "EQSUMMARY",
      "accountID": "uuid-v4",
      "aaId": "AA-ID",
      "vua": "9876543210@onemoney",
      "consentCreationData": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Code**: `src/lib/moneyone/moneyone.actions.ts:166-202`

#### 4. Get All FI Data

```typescript
POST /getallfidata

Request:
{
  "consentID": "consent-id-456"
}

Response (Success):
{
  "status": "success",
  "data": [
    {
      "linkReferenceNumber": "LRN123",
      "maskedAccountNumber": "XXXX1234",
      "fiType": "EQUITIES",
      "bank": "NSDL",
      "Summary": {
        "costValue": "100000",
        "currentValue": "120000",
        "Investment": {
          "Holdings": {
            "Holding": [
              {
                "issuerName": "TCS",
                "isin": "INE467B01029",
                "units": "10",
                "lastTradedPrice": "3500"
              }
            ]
          }
        }
      }
    }
  ]
}

Response (Data Not Ready):
{
  "errorCode": "NoDataFound",
  "errorMsg": "Data not ready!"
}
```

**Code**: `src/lib/moneyone/moneyone.actions.ts:236-280`

**Error Handling**:
- `NoDataFound` error triggers React Query retry
- Validates `Summary` exists in response

#### 5. Request FI Data (Manual Refresh)

```typescript
POST /fi/request

Request:
{
  "consentId": "consent-id-456"
}

Response:
{
  "ver": "1.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "response": "ok",
  "data": {
    "consentId": "consent-id-456",
    "sessionId": "session-123"
  }
}
```

**Code**: `src/lib/moneyone/moneyone.actions.ts:282-328`

**Usage**: Triggers fresh FI data fetch from MoneyOne

---

## Code References

### Key Files & Line Numbers

| Component | File Path | Key Lines |
|-----------|-----------|-----------|
| **Import Button** | `src/components/thread/history/index.tsx` | 165-178 |
| **Import Data Page** | `src/modules/import-data/components/ImportDataPage.tsx` | 42-205 |
| **MoneyOne Holdings Card** | `src/modules/import-data/components/account-types/MoneyOneHoldingsCard.tsx` | 24-125 |
| **Import Holdings** | `src/components/moneyone/import-holdings.tsx` | 16-66 |
| **Create Consent Modal** | `src/components/moneyone/CreateConsentModel.tsx` | 21-90 |
| **Consent Mutation** | `src/components/moneyone/useCreateConsentAndRedirectMut.ts` | 13-71 |
| **Check Consent** | `src/components/moneyone/useCheckConsentMut.ts` | 7-41 |
| **OAuth Redirect Handler** | `src/app/moneyone/[slug]/page.tsx` | 16-98 |
| **Data Fetching Modal** | `src/components/moneyone/FetchingFiDataModal.tsx` | 6-17 |
| **FI Data Hook** | `src/modules/import-data/hooks/useFiData.ts` | 26-205 |
| **Consent Query Hook** | `src/modules/import-data/hooks/useConsentQuery.ts` | 12-51 |
| **Holdings Preview Modal** | `src/modules/import-data/components/modals/HoldingsPreviewModal/` | Multiple files |
| **Import Mutation** | `src/modules/import-data/hooks/useImportHoldingsMutation.ts` | 22-90 |
| **Storage Functions** | `src/lib/moneyone/moneyone.storage.ts` | 1-243 |
| **API Actions** | `src/lib/moneyone/moneyone.actions.ts` | 1-328 |
| **Holdings Transformer** | `.../HoldingsPreviewModal/utils/holdings-transformer.ts` | 1-140 |
| **Markdown Converter** | `src/lib/convertToMarkdownTable.ts` | 1-17 |

### Function Call Chain

```
User clicks "Connect"
  → ImportHoldings.handleImportClick()
    → useCheckConsentMut.mutate()
      → getUserConsent(consentType)
        → NO CONSENT FOUND
          → CreateConsentModel opens
            → useCreateConsentAndRedirectMut.mutate()
              → createConsentRequestV3()
                → savePendingConsent()
                  → redirect(webRedirectionUrl)
                    → [User at MoneyOne OAuth]
                      → MoneyOne redirects back
                        → /moneyone/[slug]/page.tsx
                          → decryptUrl()
                            → getConsentList()
                              → redirect(/?consentID=...)
                                → FetchingFiDataModal.useFiDataConsentFlow
                                  → completePendingConsent()
                                    → getAllFiData()
                                      → updateConsent({ isDataReady: true })
                                        → Close modal

User clicks "Analyse"
  → HoldingsPreviewModal opens
    → useHoldingsData()
      → useFiData() // From React Query cache
        → extractHoldingsFromFiData()
          → transformHoldingsToFormData()
    → User edits holdings
      → User clicks import
        → transformFormDataToHoldings()
          → useImportHoldingsMutation.mutate()
            → transformHoldingsToMarkdownFormat()
              → convertToMarkdownTable()
                → stream.submit()
                  → [AI analyzes data]

User clicks refresh
  → useRefreshFiData.mutate()
    → requestFiData()
      → queryClient.removeQueries()
        → pollData()
          → getAllFiData()
            → updateConsent({ consentCreationData: new Date() })
              → queryClient.setQueryData()
```

---

## Configuration

### Environment Variables

**Required for MoneyOne Integration**:

```bash
# MoneyOne API Configuration
MONEY_ONE_BASE_URL=https://api.moneyone.in
MONEY_ONE_CLIENT_ID=your_client_id_here
MONEY_ONE_API_KEY=your_api_key_here

# Consent Form IDs (Product IDs)
MONEY_ONE_EQUITIES_CONSENT_FORM=EQSUMMARY
MONEY_ONE_MUTUAL_FUNDS_CONSENT_FORM=WM101
MONEY_ONE_ETF_CONSENT_FORM=                      # Pending API configuration
MONEY_ONE_BANK_ACCOUNTS_CONSENT_FORM=DEPOSITDETAILS

# Financial Information Provider IDs (comma-separated)
MONEY_ONE_EQUITIES_FIPS=NSDL-FIP,CDSL-FIP
MONEY_ONE_MUTUAL_FUNDS_FIPS=CAMS-FIP,KARVY-FIP
MONEY_ONE_ETF_FIPS=                              # Pending API configuration
MONEY_ONE_BANK_ACCOUNTS_FIPS=                    # Pending API configuration
```

### Consent Type Mapping

**Location**: `src/lib/moneyone/moneyone.enums.ts`

```typescript
export enum ConsentType {
  MUTUAL_FUNDS = 'MUTUAL_FUNDS',
  EQUITIES = 'EQUITIES',
  ETF = 'ETF',
  BANK_ACCOUNTS = 'BANK_ACCOUNTS',
  SIP = 'SIP'
}
```

### React Query Default Settings

**Location**: `src/providers/QueryProvider.tsx`

```typescript
// Consent queries
queryClient.setQueryDefaults(["consent"], {
  staleTime: 1000,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
});

// FI data queries
queryClient.setQueryDefaults(["fi-data"], {
  gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  staleTime: Infinity,              // Never consider stale
  refetchOnWindowFocus: false,      // Don't refetch on focus
});
```

---

## Error Handling

### FinPro FI-Data Error Catalogue

`POST /getallfidata` (and `POST /fi/request`) return a JSON body of the shape
`{ ver, timestamp, errorCode, errorMsg, status }` on failure. The frontend reads
this body (`getAllFiData` / `requestFiData` in `moneyone.actions.ts`) and surfaces
the real `errorCode` instead of a generic "status 400". Source: the *Get All FI
Data → Error Code Catalogue* in the FinPro Postman collection.

| FP code | `errorCode` | `errorMsg` | Meaning |
|---------|-------------|------------|---------|
| FP0034 | `InvalidConsentId` | "Consent ID does not exist." | Consent gone |
| FP0058 | `InvalidRequest` | "Consent ID is Revoked…" | Consent revoked |
| FP0060 | `NoDataAvailable` | "Data is not available for the given consent" | **Valid consent, no data fetched yet (or purged after retention)** |
| FP0061 | `DataIsDeleted` | "Data is deleted for this consent" | FI data expired & deleted |
| FP0063 | `NoDataFound` | "Data is not available" | No linked accounts found |
| FP0055 | `InvalidPayload` | "Either consentId or accountID…" | Bad request payload |
| FP0070 | `InternalError` | "Internal Server Error…" | Server-side error |

> **Common gotcha**: `NoDataAvailable` (FP0060) is **not** an expired consent —
> it means the consent is still valid but FinPro currently holds no data. The fix
> is to re-fetch via `/fi/request`, not to delete/re-consent.

### Frontend Error Classification

`classifyFiDataError(errorCode, errorMsg)` in `moneyone.utils.ts` maps the above
into three handling buckets (`FiDataErrorKind`):

| Kind | Triggers | UI behaviour |
|------|----------|--------------|
| `consent-dead` | `InvalidConsentId` (FP0034), Revoked (FP0058) | Card flips to **Expired** state (`isExpired` set on `ConsentData`); preview modal offers **Remove connection**. Refresh polling stops immediately. |
| `data-missing` | `NoDataAvailable` (FP0060), `DataIsDeleted` (FP0061), `NoDataFound` (FP0063) | Modal shows **"No data to show yet"** + a **Fetch latest data** button (runs the refresh flow; modal auto-recovers into the form once data arrives). Consent stays Connected. |
| `transient` | network / 5xx / unrecognised | **Try again** button. |

**Key files**:
- `src/lib/moneyone/moneyone.utils.ts` — `classifyFiDataError`, `isConsentInvalidError`
- `src/modules/import-data/hooks/useFiData.ts` — exposes `errorKind`; flips consent to `isExpired` on `consent-dead`; stops refresh polling on dead consents
- `src/modules/import-data/components/shared/FiDataErrorState.tsx` — per-kind modal error UI (Fetch / Remove / Try again)
- `src/modules/import-data/components/account-types/MoneyOneHoldingsCard.tsx` — Connected (Refresh + Delete) and Expired (Refresh + Delete) card states

> **Authoritative status check**: to verify a consent's true state instead of
> trusting the locally-cached `consentExpiry`, call `getConsentStatus(consentID,
> mobileNo, consentType, accountID)` (`moneyone.actions.ts`), which wraps
> `POST /v2/getconsentslist` and returns the live `status`
> (`ACTIVE`/`PAUSED`/`REVOKED`/`EXPIRED`) and `consent_expiry`.

### Error Types & Recovery

#### 1. Consent Creation Errors

**Location**: `src/components/moneyone/useCreateConsentAndRedirectMut.ts:40`

```typescript
if ("error" in createConsentReqRes) throw createConsentReqRes;
```

**Common Errors**:
- `503 Service Temporarily Unavailable`: MoneyOne API down
- Invalid mobile/PAN format
- Network timeout

**User Experience**: Toast error shown, modal remains open for retry

#### 2. Data Not Ready Error

**Location**: `src/lib/moneyone/moneyone.actions.ts:262`

```typescript
if (response?.errorCode === "NoDataFound") throw response;
```

**Recovery**: React Query automatically retries every 3 seconds

**User Experience**: Loading modal shows "Fetching data..." animation

#### 3. No Holdings Found

**Location**: `src/modules/import-data/hooks/useImportHoldingsMutation.ts:34-36`

```typescript
if (holdings.length === 0) {
  throw new Error("No holdings found in the imported data");
}
```

**User Experience**: Toast error notification

#### 4. Consent Not Found

**Location**: `src/app/moneyone/[slug]/page.tsx:60`

```typescript
if (!consent) return <div>Consent not found</div>;
```

**Recovery**: User must create new consent

#### 5. Storage Errors

**Location**: `src/lib/moneyone/moneyone.storage.ts:75-79`

```typescript
try {
  return JSON.parse(consentData) as ConsentData;
} catch {
  return null;
}
```

**Recovery**: Graceful fallback to null, treated as no consent

### Error Monitoring

All MoneyOne API errors are logged:
```typescript
if (process.env.NODE_ENV === "development")
  console.log("---Making consent request ~ body:", body);

console.error("---Error occurred while ...", error);
```

Production recommendation: Integrate with Sentry/LogRocket for error tracking

---

## Security Considerations

### 1. No Credential Storage

- Application **never** stores user login credentials
- Uses OAuth-based Account Aggregator framework
- MoneyOne handles all authentication

### 2. Client-Side Encryption

- All sensitive data transmitted via HTTPS
- MoneyOne uses bank-level 256-bit encryption
- Encrypted URL parameters for OAuth callback

### 3. Read-Only Access

- Consents only grant read permissions
- Cannot initiate transactions
- Cannot modify account data

### 4. Consent Expiry

- Consents have defined expiry (default: 1 year)
- Expired consents automatically filtered by `getUserConsent()`
- User must re-authorize after expiry

### 5. Browser-Only Storage

- localStorage used for consent data (client-side only)
- Data tied to specific browser/device
- No server-side storage of financial data in current implementation

### 6. User Control

- Users can revoke consent anytime via the card/modal Remove action, which
  calls `revokeConsent` (`POST /revokeconsent`) to tear down the consent on
  MoneyOne/the AA, then `deleteConsent` for local cleanup. Guarded by a
  confirmation dialog; on revoke failure it removes locally and warns.
- Clear consent status shown in UI (Connected / Expired)
- Transparent data usage messaging

### 7. API Security

**Server-Side Actions**:
```typescript
"use server"; // Ensures MoneyOne credentials only used server-side
```

**Headers Protection**:
```typescript
export const moneyOneAuthHeaders = {
  "api-key": process.env.MONEY_ONE_API_KEY!,
  "client-id": process.env.MONEY_ONE_CLIENT_ID!,
};
```

**Never Exposed to Client**:
- MoneyOne API key and client ID
- PAN numbers (only used during redirect)
- Full consent handles

### 8. Data Minimization

- Only holdings data is fetched
- No transaction history stored
- No account numbers stored (only masked)
- Holdings converted to markdown immediately, raw data only cached in React Query

### 9. Secure Redirects

**URL Pattern Validation** (`src/app/moneyone/[slug]/page.tsx:25`):
```typescript
if (!Object.values(ConsentType).includes(slugParts[0] as ConsentType))
  return <div>Invalid slug</div>;
```

**Schema Validation**:
```typescript
const validatedData = webRedirectionDecryptionApiReqParamsSchema.safeParse(searchParamsData);
if (!validatedData.success) {
  return <div>Invalid search params</div>;
}
```

### 10. Best Practices for Production

**Recommended Enhancements**:

1. **Move to Database Storage**:
   ```typescript
   // Replace localStorage with secure server-side storage
   // Encrypt consent data at rest
   // Associate with authenticated user accounts
   ```

2. **Add Rate Limiting**:
   ```typescript
   // Limit consent creation attempts per user
   // Prevent API abuse
   ```

3. ~~**Implement Consent Revocation API**~~ ✅ **Done**:
   ```typescript
   // revokeConsent(consentID) → POST /revokeconsent (moneyone.actions.ts)
   // Called by the Remove action before deleteConsent; cleans up MoneyOne side.
   // Treats "already revoked"/"does not exist" as success; warns on other
   // failures while still removing locally.
   ```

4. **Add Webhook Signature Verification**:
   ```typescript
   // Verify webhook requests actually from MoneyOne
   // Prevent spoofing
   ```

5. **Session Management**:
   ```typescript
   // Tie consents to authenticated user sessions
   // Invalidate on logout
   ```

6. **Audit Logging**:
   ```typescript
   // Log all consent creation/usage/deletion
   // Track data access patterns
   ```

---

## Troubleshooting

### Common Issues

#### Connect Button Not Responding
- **Check**: Browser console for errors
- **Check**: `useCheckConsentMut` mutation status
- **Fix**: Clear localStorage and refresh

#### OAuth Redirect Fails
- **Check**: Redirect URL matches configured domain in MoneyOne dashboard
- **Check**: Slug format: `{consentType}~{userId}~{threadId?}`
- **Fix**: Verify environment variables

#### Data Not Fetching (Stuck in Loading)
- **Check**: Browser console for "NoDataFound" errors
- **Check**: React Query DevTools for retry status
- **Fix**: Wait 5-10 seconds, MoneyOne may still be fetching from FIPs
- **Alternative**: Close modal and try "Analyse" button again

#### Consent Not Persisting
- **Check**: localStorage quota not exceeded
- **Check**: localStorage permissions enabled
- **Fix**: Clear old consents or other localStorage data

#### Analyse Button Disabled
- **Check**: `consent.isDataReady === true`
- **Check**: `useConsentQuery` hook returning data
- **Fix**: Verify FI data fetch completed successfully

#### Refresh Not Working
- **Check**: `requestFiData` API response
- **Check**: React Query cache cleared
- **Fix**: Check network tab for API errors

#### Holdings Not Importing to Chat
- **Check**: Holdings array length > 0
- **Check**: Stream context available
- **Fix**: Verify `useImportHoldingsMutation` mutation status

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development # Shows all MoneyOne API logs
```

Check localStorage:
```javascript
// In browser console
Object.keys(localStorage)
  .filter(k => k.startsWith('moneyone:'))
  .forEach(k => console.log(k, JSON.parse(localStorage.getItem(k))));
```

Check React Query cache:
```javascript
// In React Query DevTools
// Look for ["consent", ConsentType] and ["fi-data", consentID] queries
```

---

## Conclusion

The import holdings feature provides a secure, user-friendly way to import financial data using India's Account Aggregator framework. The implementation leverages:

- **V3 API** for streamlined consent creation
- **React Query** with optimized caching (7-day gcTime, infinite staleTime)
- **localStorage** with custom events for real-time reactivity
- **Modular architecture** with HoldingsPreviewModal for user control
- **Manual refresh** capability with cache invalidation
- **AI integration** via markdown table format

Key benefits:
- Minimal API calls (aggressive caching)
- Real-time UI updates (custom events + React Query)
- User control (preview/edit before import)
- Thread continuity (threadId preserved through OAuth flow)

For questions or issues, refer to:
- MoneyOne Documentation: [docs.moneyone.in](https://docs.moneyone.in)
- RBI AA Framework: [rbi.org.in/Scripts/AA_FAQs.aspx](https://rbi.org.in/Scripts/AA_FAQs.aspx)
- Internal Team: Contact FinSharpe engineering team

---

## Adding New Consent Types

To integrate a new MoneyOne consent type (e.g., NPS, Insurance, Bonds), refer to the comprehensive integration guide:

**📄 See**: [`ADDING_NEW_MONEYONE_CONSENT_TYPE.md`](./ADDING_NEW_MONEYONE_CONSENT_TYPE.md)

**Key Points**:
- **Form components are optional** - Not all consent types need editable forms
- Start with read-only implementation, add forms only if needed
- Choose between two implementation paths:
  - **Path A: Read-Only Display** - Simple preview with direct import (1-2 hours)
  - **Path B: Editable Form** - Full form with quantity editing (2-4 hours)
- Includes complete code examples and decision tree
- Lists all files that need to be created/updated
- Provides testing checklist and troubleshooting guide

**Implementation Pattern**:
```
1. Add consent type to enum
2. Update webhook handler
3. Create types (basic for read-only, extended for forms)
4. Create transformers
5. Create data hooks
6. Create modal component (simple or with form)
7. Add to ImportDataPage
8. Configure environment variables
```

---

**Document Version**: 3.3
**Last Updated**: June 2026
**Maintained By**: FinSharpe Engineering Team

> **Changelog 3.3**: Consent removal now revokes on MoneyOne (`revokeConsent` →
> `POST /revokeconsent`) before local cleanup, guarded by a `ConfirmDialog`, with
> a warning-on-failure policy. Removed the "implement revocation" production TODO.
>
> **Changelog 3.2**: Added the FinPro FI-data error catalogue (FP00xx codes) and
> the frontend error-classification model (`consent-dead` / `data-missing` /
> `transient`); documented the Expired card state, per-kind modal recovery
> (`FiDataErrorState`), and the `getConsentStatus` authoritative status check.
>
> **Changelog 3.1**: `ConsentType` expanded to 5 AA types (added `SIP`);
> `MoneyOneHoldingsCard` refactored to accept a generic `AnalysisModal` prop
> instead of a hardcoded `HoldingsPreviewModal`; each consent type now wires its
> own preview modal from `ImportDataPage`.
