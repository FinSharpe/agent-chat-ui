# Adding a New MoneyOne Consent Type - Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Planning Questions](#planning-questions)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [File Checklist](#file-checklist)
6. [Testing Checklist](#testing-checklist)
7. [Common Pitfalls](#common-pitfalls)
8. [Examples](#examples)

---

## Overview

This guide provides step-by-step instructions for integrating a new consent type (e.g., NPS, Insurance, Bonds) into the MoneyOne Account Aggregator framework within the FinSharpe application.

**Time Estimate**:
- Read-only implementation: 1-2 hours
- With editable form: 2-4 hours

**Existing Consent Types** (for reference):
- ✅ **EQUITIES** (`EQSUMMARY`) - Editable form (quantity field)
- ✅ **MUTUAL_FUNDS** (`WM101`) - Editable form (quantity field)
- ✅ **ETF** - Editable form (quantity field) - Placeholder, pending API response
- ✅ **BANK_ACCOUNTS** (`DEPOSITDETAILS`) - Read-only with analytics
- ✅ **SIP** - Read-only preview (SipPreviewModal)

> **Pattern note**: New consent types are wired into `ImportDataPage` by passing
> a per-type `AnalysisModal` to the shared `<MoneyOneHoldingsCard>`. The card is
> generic; the modal (accepting `BaseAnalysisModalProps`) is what differs per type.

---

## Prerequisites

### 1. MoneyOne API Configuration
Before starting, ensure you have from MoneyOne:
- **Product ID** (e.g., `NPS001`, `INSURANCE`, `BONDS`)
- **FIP IDs** (Financial Information Providers for this consent type)
- **API Response Sample** (essential for type definitions)

### 2. Environment Variables
Add to `.env.local`:
```bash
# Example for NPS consent type
MONEY_ONE_NPS_CONSENT_FORM=NPS001
MONEY_ONE_NPS_FIPS=NSDL-FIP,CAMS-FIP
```

### 3. Required Knowledge
- TypeScript
- React (React Hook Form if using editable form)
- React Query
- Next.js App Router
- MoneyOne AA framework basics

---

## Planning Questions

**BEFORE YOU START**, answer these questions to determine your implementation approach:

### Question 1: Does this consent type need a form?

**❓ Ask yourself**: Do users need to edit/modify the imported data before sending to AI?

- **✅ YES** - Users need to edit quantities/values (Examples: EQUITIES, MUTUAL_FUNDS, ETF)
  - → Follow **Path A: With Editable Form** (Steps include form components)

- **❌ NO** - Data is read-only or just for display (Examples: BANK_ACCOUNTS, Insurance policies)
  - → Follow **Path B: Read-Only Display** (Simplified steps, no form logic)

### Question 2: If form is needed, which columns are editable?

**❓ Ask yourself**: What fields should users be able to modify?

Common patterns:
- **Quantity field only** (EQUITIES: `units`, MUTUAL_FUNDS: `closingUnits`)
  - Most common use case
  - Users can set quantity to 0 to exclude holdings

- **Multiple fields** (Less common)
  - Specify exactly which fields: e.g., `quantity`, `price`, `notes`

- **Read-only with selection** (Checkboxes)
  - Users can only include/exclude entire rows
  - No field editing needed

**💡 Recommendation**: Start with read-only implementation. Add form later if needed.

---

## Step-by-Step Integration

### Core Steps (Required for ALL implementations)

These steps are required regardless of whether you're implementing a form or read-only view:

---

### Step 1: Add Consent Type to Enum

**File**: `src/lib/moneyone/moneyone.enums.ts`

**Action**: Add your new consent type to the enum

```typescript
export enum ConsentType {
    MUTUAL_FUNDS = 'MUTUAL_FUNDS',
    EQUITIES = 'EQUITIES',
    ETF = 'ETF',
    BANK_ACCOUNTS = 'BANK_ACCOUNTS',
    // Add your new type
    NPS = 'NPS',  // ✨ NEW
}
```

**Line Reference**: `src/lib/moneyone/moneyone.enums.ts:5-10`

---

### Step 2: Update Webhook Handler

**File**: `src/app/api/webhooks/moneyone/data-ready/route.ts`

**Action**: Add product ID mapping for webhook data-ready notifications

```typescript
const productIdToConsentTypeMap: { [productId: string]: ConsentType } = {
  [process.env.MONEY_ONE_EQUITIES_CONSENT_FORM as string]: ConsentType.EQUITIES,
  [process.env.MONEY_ONE_MUTUAL_FUNDS_CONSENT_FORM as string]: ConsentType.MUTUAL_FUNDS,
  [process.env.MONEY_ONE_ETF_CONSENT_FORM as string]: ConsentType.ETF,
  [process.env.MONEY_ONE_BANK_ACCOUNTS_CONSENT_FORM as string]: ConsentType.BANK_ACCOUNTS,
  // Add your new type
  [process.env.MONEY_ONE_NPS_CONSENT_FORM as string]: ConsentType.NPS,  // ✨ NEW
};
```

**Line Reference**: `src/app/api/webhooks/moneyone/data-ready/route.ts:5-8`

---

### Step 3: Create Type Definitions

**File**: `src/modules/import-data/types/nps.ts` (create new)

**Action**: Define TypeScript types based on MoneyOne API response

#### For Read-Only Implementation:

```typescript
/**
 * NPS-specific types and constants
 */

import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { BaseHolding, BaseAccountType } from "./common";

/**
 * NPS-specific holding type
 * Update based on actual API response structure
 */
export interface NPSHolding extends BaseHolding {
  pranNumber: string;        // PRAN number
  contributionAmount: string; // Contribution amount
  navValue: string;          // NAV value
  tierType: string;          // Tier I or Tier II
  // Add other NPS-specific fields as needed
}

/**
 * NPS FI data account type
 */
export type NPSFiDataAccount = BaseAccountType<NPSHolding> & {
  fiType: "NPS";
};

/**
 * NPS FI data response (array of accounts)
 */
export type NPSFiDataResponse = NPSFiDataAccount[];

/**
 * NPS markdown format for chat import
 */
export interface NPSMarkdownFormat {
  "PRAN Number": string;
  "Tier Type": string;
  "Contribution Amount": string;
  "NAV Value": string;
}

/**
 * Consent type constant
 */
export const NPS_CONSENT_TYPE = ConsentType.NPS;
```

#### For Editable Form Implementation:

Add these additional types:

```typescript
import { ColumnConfig } from "./common";

/**
 * NPS holding with quantity field for form management
 * Only needed if form is editable
 */
export type NPSHoldingWithQuantity = NPSHolding & { quantity: number };

/**
 * NPS form data structure
 * Only needed if form is editable
 */
export interface NPSFormData {
  holdings: NPSHoldingWithQuantity[];
}

/**
 * Column configurations for NPS holdings table
 * Define which columns are shown and which are editable
 */
export const NPS_COLUMNS: readonly ColumnConfig[] = [
  { key: "pranNumber", label: "PRAN Number", align: "left" },
  { key: "tierType", label: "Tier Type", align: "left" },
  { key: "quantity", label: "Contribution", align: "right" },  // Editable column
  { key: "action", label: "Action", align: "center" },
] as const;

/**
 * Quantity field name for NPS
 * This determines which field is used for the editable quantity
 * Only needed if form is editable
 */
export const NPS_QUANTITY_FIELD = "contributionAmount" as const;
```

**Export**: Add to `src/modules/import-data/types/index.ts`

```typescript
export * from "./nps";  // ✨ NEW
```

---

### Step 4: Create Data Transformer Utilities

**File**: `src/modules/import-data/components/modals/NpsPreviewModal/utils/nps-transformer.ts` (create new)

#### For Read-Only Implementation:

```typescript
/**
 * NPS-specific data transformations (Read-only)
 */

import {
  NPSHolding,
  NPSFiDataResponse,
} from "@/modules/import-data/types/nps";

/**
 * Extract all NPS holdings from FI data response
 */
export function extractNPSFromFiData(
  fiData: NPSFiDataResponse | undefined | null,
): NPSHolding[] {
  if (!fiData) return [];

  const allHoldings: NPSHolding[] = [];

  fiData.forEach((account) => {
    if (account.Summary?.Investment?.Holdings?.Holding) {
      allHoldings.push(...account.Summary.Investment.Holdings.Holding);
    }
  });

  return allHoldings;
}

/**
 * Transform NPS holdings to markdown-ready format for import mutation
 */
export function transformNPSToMarkdownFormat(
  holdings: NPSHolding[],
): Record<string, string>[] {
  return holdings.map((holding) => ({
    "PRAN Number": holding.pranNumber || "",
    "Tier Type": holding.tierType || "",
    "Contribution Amount": holding.contributionAmount || "",
    "NAV Value": holding.navValue || "",
  }));
}
```

#### For Editable Form Implementation:

Add these additional transformers:

```typescript
import {
  NPSHoldingWithQuantity,
  NPS_QUANTITY_FIELD,
} from "@/modules/import-data/types/nps";

/**
 * Transform NPS holdings to form data with quantity field
 * Only needed for editable form
 */
export function transformNPSToFormData(
  holdings: NPSHolding[],
): NPSHoldingWithQuantity[] {
  return holdings.map((holding) => ({
    ...holding,
    quantity: parseFloat(holding[NPS_QUANTITY_FIELD] || "0"),
  }));
}

/**
 * Transform form data back to NPS holdings (for submission)
 * Filters out holdings with quantity = 0
 * Only needed for editable form
 */
export function transformFormDataToNPS(
  formHoldings: NPSHoldingWithQuantity[],
): NPSHolding[] {
  // Filter out holdings with quantity = 0
  const validHoldings = formHoldings.filter((h) => h.quantity > 0);

  return validHoldings.map((holding) => {
    const { quantity, ...holdingWithoutQuantity } = holding;

    return {
      ...holdingWithoutQuantity,
      [NPS_QUANTITY_FIELD]: quantity.toString(),
    } as NPSHolding;
  });
}
```

---

### Step 5: Create Data Fetching Hook

**File**: `src/modules/import-data/components/modals/NpsPreviewModal/hooks/useNpsData.ts` (create new)

#### For Read-Only Implementation:

```typescript
/**
 * Custom hook for fetching NPS data (Read-only)
 */

import { useMemo } from "react";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import { NPSFiDataResponse } from "@/modules/import-data/types/nps";
import { extractNPSFromFiData } from "../utils/nps-transformer";

export function useNpsData(consentID: string | undefined, isDataReady: boolean) {
  const { data: fiData, isLoading } = useFiData(
    consentID,
    isDataReady,
  ) as { data: NPSFiDataResponse | undefined; isLoading: boolean };

  const holdings = useMemo(() => {
    if (!fiData) return [];
    return extractNPSFromFiData(fiData);
  }, [fiData]);

  return {
    holdings,
    isLoading,
    fiData,
  };
}
```

#### For Editable Form Implementation:

```typescript
/**
 * Custom hook for fetching and transforming NPS data (With Form)
 */

import { useMemo } from "react";
import { useFiData } from "@/modules/import-data/hooks/useFiData";
import { NPSFormData, NPSFiDataResponse } from "@/modules/import-data/types/nps";
import {
  extractNPSFromFiData,
  transformNPSToFormData,
} from "../utils/nps-transformer";

export function useNpsData(consentID: string | undefined, isDataReady: boolean) {
  const { data: fiData, isLoading } = useFiData(
    consentID,
    isDataReady,
  ) as { data: NPSFiDataResponse | undefined; isLoading: boolean };

  const formDefaultValues: NPSFormData | undefined = useMemo(() => {
    if (!fiData) return undefined;

    const holdings = extractNPSFromFiData(fiData);
    const holdingsWithQuantity = transformNPSToFormData(holdings);

    return { holdings: holdingsWithQuantity };
  }, [fiData]);

  return {
    formDefaultValues,
    isLoading,
    fiData,
  };
}
```

---

### Step 6: Create Import Mutation Hook

**File**: `src/modules/import-data/components/modals/NpsPreviewModal/hooks/useImportNpsMutation.ts` (create new)

**Action**: Handle import to chat functionality (same for both read-only and editable)

```typescript
/**
 * Mutation hook for importing NPS holdings to chat
 */

import { useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { convertToMarkdownTable } from "@/lib/convertToMarkdownTable";
import { NPSFiDataResponse } from "@/modules/import-data/types/nps";
import {
  extractNPSFromFiData,
  transformNPSToMarkdownFormat,
} from "../utils/nps-transformer";

interface ImportNPSParams {
  data: NPSFiDataResponse;
}

export function useImportNpsMutation() {
  const stream = useStreamContext();

  return useMutation({
    mutationFn: async ({ data }: ImportNPSParams) => {
      // Extract and transform holdings
      const holdings = extractNPSFromFiData(data);

      if (holdings.length === 0) {
        throw new Error("No NPS holdings found in the imported data");
      }

      const formattedHoldings = transformNPSToMarkdownFormat(holdings);
      const markdownTable = convertToMarkdownTable(formattedHoldings);

      // Create message for chat
      const messageText = `I've imported my NPS holdings. Here's the data:

${markdownTable}

Please analyze my NPS portfolio and provide insights.`;

      const toolMessages: Message[] = [];

      const newHumanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: [{ type: "text", text: messageText }],
      };

      stream.submit(
        { messages: [...toolMessages, newHumanMessage] },
        {
          streamMode: ["values"],
          optimisticValues: (prev) => ({
            ...prev,
            messages: [...(prev?.messages || []), newHumanMessage],
          }),
        },
      );

      return { assetType: "NPS", holdingsCount: holdings.length };
    },
    onSuccess: (result) => {
      toast.success(`${result.assetType} holdings added to chat`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to import NPS holdings",
      );
    },
  });
}
```

---

### Step 7: Create Preview Modal Container

**File**: `src/modules/import-data/components/modals/NpsPreviewModal/index.tsx` (create new)

#### Path A: Read-Only Display (Simple)

```typescript
/**
 * NPS Preview Modal - Read-Only Display
 */

"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BarChart3, Building, Loader2 } from "lucide-react";
import useModalState from "@/hooks/useModalState";
import { BaseAnalysisModalProps } from "@/modules/import-data/types";
import { useNpsData } from "./hooks/useNpsData";
import { useImportNpsMutation } from "./hooks/useImportNpsMutation";

/**
 * Modal component for NPS holdings preview (Read-only)
 */
export function NpsPreviewModal({ consent }: BaseAnalysisModalProps) {
  const { open, handleClose, handleOpenChange } = useModalState();

  const consentID = consent?.consentID;
  const isDataReady = consent?.isDataReady;

  const importMutation = useImportNpsMutation();
  const { holdings, isLoading, fiData } = useNpsData(consentID, !!isDataReady);

  const handleImport = () => {
    if (!fiData) return;
    handleClose();

    // Call mutation to import NPS to chat
    importMutation.mutate({ data: fiData });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          disabled={!isDataReady}
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          Analyse
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[min(96vw,80rem)] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            NPS Holdings Preview
          </DialogTitle>
          <DialogDescription>
            Review your NPS holdings before analysis
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Total Holdings: {holdings.length}
              </p>

              {/* Simple read-only table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">PRAN Number</th>
                      <th className="px-4 py-2 text-left text-sm font-medium">Tier Type</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">Contribution</th>
                      <th className="px-4 py-2 text-right text-sm font-medium">NAV Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 text-sm">{holding.pranNumber}</td>
                        <td className="px-4 py-2 text-sm">{holding.tierType}</td>
                        <td className="px-4 py-2 text-sm text-right">{holding.contributionAmount}</td>
                        <td className="px-4 py-2 text-sm text-right">{holding.navValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importMutation.isPending || isLoading}>
            {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import to Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### Path B: With Editable Form (Complex)

See **BankAccountsPreviewModal** or **EquitiesPreviewModal** for complex form examples with:
- React Hook Form integration
- Editable quantity fields
- Add/remove holdings
- Form validation

**Reference**: `src/modules/import-data/components/modals/EquitiesPreviewModal/`

---

### Step 8: Add to ImportDataPage

**File**: `src/modules/import-data/components/ImportDataPage.tsx`

**Action**: Import and add your new modal component

```typescript
// Add import at top
import { NpsPreviewModal } from "./modals/NpsPreviewModal";

// Inside the component JSX, add your card (around line 123):
{/* NPS - MoneyOne */}
<MoneyOneHoldingsCard
  consentType={ConsentType.NPS}
  icon={Building}
  title="NPS"
  description="Import National Pension System contributions and NAV data"
  AnalysisModal={NpsPreviewModal}
/>
```

**Line Reference**: `src/modules/import-data/components/ImportDataPage.tsx:123-132`

---

### Step 9: Environment Configuration

**File**: `.env.local`

**Action**: Add environment variables

```bash
# NPS Configuration
MONEY_ONE_NPS_CONSENT_FORM=NPS001
MONEY_ONE_NPS_FIPS=NSDL-FIP,CAMS-FIP
```

**File**: `.env.example`

**Action**: Document the new variables

```bash
# Example for NPS
# MONEY_ONE_NPS_CONSENT_FORM=NPS001
# MONEY_ONE_NPS_FIPS=NSDL-FIP,CAMS-FIP
```

---

## File Checklist

### Minimal Implementation (Read-Only)
- [ ] `src/lib/moneyone/moneyone.enums.ts` - Add enum value
- [ ] `src/modules/import-data/types/[consent-type].ts` - Create basic types (no form types)
- [ ] `src/modules/import-data/types/index.ts` - Export new types
- [ ] `src/app/api/webhooks/moneyone/data-ready/route.ts` - Add product ID mapping
- [ ] `.env.local` - Add environment variables
- [ ] `.env.example` - Document new variables
- [ ] `src/modules/import-data/components/modals/[ConsentType]PreviewModal/index.tsx` - Simple modal
- [ ] `src/modules/import-data/components/modals/[ConsentType]PreviewModal/utils/[consent-type]-transformer.ts` - Extract & markdown transformers only
- [ ] `src/modules/import-data/components/modals/[ConsentType]PreviewModal/hooks/use[ConsentType]Data.ts` - Simple data fetching
- [ ] `src/modules/import-data/components/modals/[ConsentType]PreviewModal/hooks/useImport[ConsentType]Mutation.ts` - Import mutation
- [ ] `src/modules/import-data/components/ImportDataPage.tsx` - Add card to UI

### Full Implementation (With Editable Form)
All items from Minimal Implementation, plus:
- [ ] `src/modules/import-data/types/[consent-type].ts` - Add form types (`FormData`, `WithQuantity`, `COLUMNS`, `QUANTITY_FIELD`)
- [ ] `src/modules/import-data/components/modals/[ConsentType]PreviewModal/[ConsentType]PreviewForm.tsx` - Form component
- [ ] `src/modules/import-data/components/modals/[ConsentType]PreviewModal/utils/[consent-type]-transformer.ts` - Add form transformers (`transformToFormData`, `transformFormDataTo...`)
- [ ] `src/modules/import-data/components/modals/[ConsentType]PreviewModal/hooks/use[ConsentType]Data.ts` - Return `formDefaultValues` instead of `holdings`

---

## Testing Checklist

### 1. Development Environment Setup
- [ ] Environment variables configured in `.env.local`
- [ ] Application builds without TypeScript errors (`pnpm build`)
- [ ] Application runs in development mode (`pnpm dev`)

### 2. UI Tests
- [ ] New consent type card appears in Import Data Page
- [ ] "Connect" button is visible and clickable
- [ ] CreateConsentModal opens with correct fields
- [ ] Modal validates mobile number (10 digits) and PAN (10 alphanumeric)

### 3. OAuth Flow Tests
- [ ] Consent creation redirects to MoneyOne OAuth
- [ ] OAuth callback redirects back with correct slug format
- [ ] Consent is saved to localStorage after OAuth
- [ ] FetchingFiDataModal appears during data fetch
- [ ] Data fetch completes and updates consent status

### 4. Data Display Tests
- [ ] "Connected" status appears after successful data fetch
- [ ] "Analyse" button becomes enabled
- [ ] Preview modal opens with fetched data
- [ ] Holdings display correctly in table/list format
- [ ] **[If Form]** Quantity field is editable
- [ ] **[If Read-only]** Data is displayed clearly without edit controls

### 5. Import Tests
- [ ] **[If Form]** Edited quantities are preserved in form
- [ ] **[If Form]** Holdings with quantity = 0 are filtered out
- [ ] Import button submits data to chat
- [ ] Markdown table appears correctly in chat
- [ ] AI can analyze the imported data

### 6. Refresh Tests
- [ ] Refresh button triggers new data fetch
- [ ] Loading state shows during refresh
- [ ] Fresh data updates UI after successful refresh
- [ ] Last updated timestamp updates

### 7. Error Handling Tests
- [ ] Invalid consent type shows appropriate error
- [ ] No data found shows retry animation
- [ ] Network errors display toast notifications
- [ ] Empty holdings show appropriate message

---

## Common Pitfalls

### 1. Over-Engineering
**Problem**: Creating form components when not needed

**Solution**: Start simple with read-only display. Add form only if:
- Users explicitly need to edit values before import
- Business logic requires filtering/selection
- You have confirmed requirement with product/stakeholders

### 2. Type Mismatches
**Problem**: TypeScript errors due to incorrect field names in types

**Solution**: Always use actual MoneyOne API response as reference for types. Add TODO comments if API response is not yet available.

```typescript
// ❌ BAD - Guessing field names
export interface NPSHolding {
  amount: string;
  value: string;
}

// ✅ GOOD - Based on actual API response or clearly marked as TODO
export interface NPSHolding {
  contributionAmount: string; // From API response field "contributionAmount"
  navValue: string;           // From API response field "navValue"
  // TODO: SET_TYPE - Verify field names when API response is available
}
```

### 3. Environment Variable Naming
**Problem**: Inconsistent naming conventions

**Solution**: Follow pattern: `MONEY_ONE_[CONSENT_TYPE]_[SUFFIX]`

```bash
# ✅ GOOD
MONEY_ONE_NPS_CONSENT_FORM=NPS001
MONEY_ONE_NPS_FIPS=NSDL-FIP,CAMS-FIP

# ❌ BAD
NPS_CONSENT_FORM=NPS001
MONEYONE_NPS_FIPS=NSDL-FIP
```

### 4. Missing Export in types/index.ts
**Problem**: New types not accessible in other files

**Solution**: Always export from `src/modules/import-data/types/index.ts`

```typescript
export * from "./nps";  // Don't forget this!
```

### 5. Incorrect Data Extraction
**Problem**: Holdings not extracted correctly from nested API structure

**Solution**: Verify the exact nesting in MoneyOne API response

```typescript
// Check actual API response structure
fiData.forEach((account) => {
  // Verify this path exists in your API response
  if (account.Summary?.Investment?.Holdings?.Holding) {
    allHoldings.push(...account.Summary.Investment.Holdings.Holding);
  }
});
```

---

## Examples

### Example 1: Read-Only Implementation (Insurance)

**Use Case**: Display insurance policies without editing

```typescript
// types/insurance.ts
export interface InsuranceHolding extends BaseHolding {
  policyNumber: string;
  policyType: string;
  sumAssured: string;
  premiumAmount: string;
}

// No form types needed!
```

**Modal**: Simple table display, direct import to chat

**Benefits**:
- Faster implementation (1-2 hours)
- Less code to maintain
- Cleaner UX for non-editable data

### Example 2: Editable Form Implementation (Fixed Deposits)

**Use Case**: Allow users to exclude certain FDs or adjust principal amounts

```typescript
// types/fixed-deposits.ts
export interface FDHolding extends BaseHolding {
  fdNumber: string;
  principal: string;
  interestRate: string;
  maturityDate: string;
}

// Form types required
export type FDHoldingWithQuantity = FDHolding & { quantity: number };
export const FD_QUANTITY_FIELD = "principal" as const;
```

**Modal**: Editable table with quantity fields, filtering

**When to use**:
- Users need to exclude specific holdings
- Values need adjustment before analysis
- Portfolio requires manual curation

---

## Additional Resources

- **MoneyOne API Documentation**: Contact MoneyOne support for latest API specs
- **Existing Implementation Examples**:
  - **Read-Only**: `src/modules/import-data/components/modals/BankAccountsPreviewModal/` - Complex read-only with analytics
  - **Editable Form**: `src/modules/import-data/components/modals/EquitiesPreviewModal/` - Complete editable implementation
  - **Placeholder**: `src/modules/import-data/components/modals/EtfPreviewModal/` - Template with TODOs
- **Import Holdings Documentation**: `docs/reference/IMPORT_HOLDINGS_DOCUMENTATION.md`

---

## Quick Decision Tree

```
Do you have MoneyOne API response?
├─ NO → Use ETF modal as template (has TODO markers)
└─ YES → Continue below

Does user need to edit data before import?
├─ NO (Read-only)
│   └─ Use Minimal Implementation
│       - Simple table display
│       - Direct import button
│       - ~1-2 hours
│
└─ YES (Editable)
    └─ Which columns are editable?
        ├─ Single quantity field
        │   └─ Use Equities modal as template
        │       - React Hook Form
        │       - Quantity editing
        │       - ~2-3 hours
        │
        └─ Multiple fields / Complex logic
            └─ Use BankAccounts modal as template
                - Custom components
                - Analytics/charts
                - ~3-4 hours
```

---

## Support

If you encounter issues:
1. Check TypeScript errors first (`pnpm build`)
2. Verify environment variables are set
3. Check browser console for runtime errors
4. Review React Query DevTools for data fetching issues
5. Check localStorage for consent data
6. Review MoneyOne API response structure

---

**Document Version**: 2.0
**Last Updated**: January 2025
**Maintained By**: FinSharpe Engineering Team
