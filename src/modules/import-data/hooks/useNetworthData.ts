"use client";
import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getAllFiData } from "@/lib/moneyone/moneyone.actions";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import {
  getAllUserConsents,
  type ConsentData,
} from "@/lib/moneyone/moneyone.storage";
import type { FiDataResponse } from "@/lib/moneyone/moneyone.types";
import {
  extractCurrentValueFromFiData,
  extractHoldingsFromFiData,
} from "@/modules/import-data/components/modals/HoldingsPreviewModal/utils/holdings-transformer";
import { extractBankBalanceFromFiData } from "@/modules/import-data/components/modals/BankAccountsPreviewModal/utils/bank-accounts-transformer";
import { FI_DATA_QUERY_KEY } from "./useFiData";

/** Asset classes that carry a rupee value toward net worth (SIP is excluded). */
export type NetworthClassKey =
  | ConsentType.EQUITIES
  | ConsentType.MUTUAL_FUNDS
  | ConsentType.ETF
  | ConsentType.BANK_ACCOUNTS;

/** Per-class display metadata — colours map to the app's --chart-* tokens
 * (light/dark variants come for free); the unit verbaliser labels the count. */
const CLASS_META: Record<
  NetworthClassKey,
  { label: string; color: string; unit: (n: number) => string }
> = {
  [ConsentType.EQUITIES]: {
    label: "Equities",
    color: "var(--chart-1)",
    unit: (n) => `${n} holding${n === 1 ? "" : "s"}`,
  },
  [ConsentType.MUTUAL_FUNDS]: {
    label: "Mutual Funds",
    color: "var(--chart-5)",
    unit: (n) => `${n} scheme${n === 1 ? "" : "s"}`,
  },
  [ConsentType.ETF]: {
    label: "ETF",
    color: "var(--chart-4)",
    unit: (n) => `${n} fund${n === 1 ? "" : "s"}`,
  },
  [ConsentType.BANK_ACCOUNTS]: {
    label: "Cash",
    color: "var(--chart-2)",
    unit: (n) => `${n} account${n === 1 ? "" : "s"}`,
  },
};

/** Fixed render order — largest typical class first, per the chart-design rule. */
const CLASS_ORDER: NetworthClassKey[] = [
  ConsentType.EQUITIES,
  ConsentType.MUTUAL_FUNDS,
  ConsentType.ETF,
  ConsentType.BANK_ACCOUNTS,
];

export interface NetworthClass {
  key: NetworthClassKey;
  label: string;
  color: string;
  /** null while the class is still syncing (no ready value yet). */
  value: number | null;
  /** Holdings / schemes / funds / accounts behind this class. */
  count: number;
  unitLabel: string;
  /** Share of the (ready) total, 0..100. */
  pct: number;
  status: "ready" | "syncing";
}

export interface NetworthData {
  /** Sum of all ready class values (Equities + MF + ETF + Cash). */
  total: number;
  /** Only connected classes, in CLASS_ORDER. */
  classes: NetworthClass[];
  /** SIP registrations across connected SIP consents (never summed into total). */
  sipCount: number;
  connectedCount: number;
  readyCount: number;
  syncingCount: number;
  /** Most recent consent timestamp, for the "Updated …" pill. */
  latestUpdate?: string;
  /** No value-bearing consent is connected (covers SIP-only and nothing). */
  isEmpty: boolean;
  /** Pre-mount, or connected with nothing ready yet — show the skeleton. */
  isInitialLoading: boolean;
}

/**
 * Reactively read every non-expired consent from localStorage. Mirrors
 * useConsentQuery's event wiring so connecting/removing an account updates the
 * net-worth card live, without a per-type collapse (multiple consents of the
 * same type are all counted, not just the latest).
 */
function useActiveConsents(): { consents: ConsentData[]; mounted: boolean } {
  const [consents, setConsents] = useState<ConsentData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const read = () => {
      const now = Date.now();
      setConsents(
        getAllUserConsents().filter(
          (c) =>
            !c.isExpired && new Date(c.consentExpiry).getTime() > now,
        ),
      );
      setMounted(true);
    };

    read();
    window.addEventListener("moneyone:consent-updated", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("moneyone:consent-updated", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return { consents, mounted };
}

/**
 * Aggregate live net worth across every connected MoneyOne consent.
 *
 * Reuses the SAME extraction the preview modals use
 * (extractCurrentValueFromFiData for investments, extractBankBalanceFromFiData
 * for cash) and the SAME React Query cache key (['fi-data', consentID]) — so the
 * figures match the modals exactly and no extra network calls are made when a
 * consent's data is already cached. SIP carries no value and is surfaced only as
 * a registration count.
 */
export function useNetworthData(): NetworthData {
  const { consents, mounted } = useActiveConsents();

  const results = useQueries({
    queries: consents.map((c) => ({
      queryKey: [FI_DATA_QUERY_KEY, c.consentID],
      queryFn: async () => {
        const data = await getAllFiData(c.consentID);
        if (data && typeof data === "object" && "error" in data) {
          throw new Error((data as { error: string }).error);
        }
        return data as FiDataResponse;
      },
      // Don't fetch before the AA has the data ready; gc'd/refreshed consents
      // re-fetch and surface as "syncing" until they resolve.
      enabled: c.isDataReady && !c.isExpired,
    })),
  });

  // Accumulate per value-class (multiple consents of one type fold together).
  const acc: Record<
    NetworthClassKey,
    { value: number | null; count: number }
  > = {
    [ConsentType.EQUITIES]: { value: null, count: 0 },
    [ConsentType.MUTUAL_FUNDS]: { value: null, count: 0 },
    [ConsentType.ETF]: { value: null, count: 0 },
    [ConsentType.BANK_ACCOUNTS]: { value: null, count: 0 },
  };
  const connected = new Set<NetworthClassKey>();
  let sipCount = 0;
  let latestUpdate: string | undefined;

  consents.forEach((consent, i) => {
    const result = results[i];

    if (consent.type === ConsentType.SIP) {
      if (result?.isSuccess && Array.isArray(result.data)) {
        sipCount += result.data.length;
      }
      return;
    }

    const key = consent.type as NetworthClassKey;
    const bucket = acc[key];
    if (!bucket) return;
    connected.add(key);

    const ready = consent.isDataReady && result?.isSuccess && result.data;
    if (!ready) return;

    const data = result.data as FiDataResponse;
    let value = 0;
    let count = 0;
    if (key === ConsentType.BANK_ACCOUNTS) {
      value = extractBankBalanceFromFiData(data as never) ?? 0;
      count = Array.isArray(data) ? data.length : 0;
    } else {
      value = Number(extractCurrentValueFromFiData(data) ?? 0);
      count = extractHoldingsFromFiData(data).length;
    }

    bucket.value = (bucket.value ?? 0) + value;
    bucket.count += count;
    if (!latestUpdate || consent.consentCreationData > latestUpdate) {
      latestUpdate = consent.consentCreationData;
    }
  });

  const classes: NetworthClass[] = CLASS_ORDER.filter((key) =>
    connected.has(key),
  ).map((key) => {
    const bucket = acc[key];
    const meta = CLASS_META[key];
    return {
      key,
      label: meta.label,
      color: meta.color,
      value: bucket.value,
      count: bucket.count,
      unitLabel: meta.unit(bucket.count),
      pct: 0,
      status: bucket.value === null ? "syncing" : "ready",
    };
  });

  const total = classes.reduce((sum, c) => sum + (c.value ?? 0), 0);
  classes.forEach((c) => {
    c.pct = total > 0 && c.value != null ? (c.value / total) * 100 : 0;
  });

  const connectedCount = classes.length;
  const readyCount = classes.filter((c) => c.status === "ready").length;
  const syncingCount = connectedCount - readyCount;

  return {
    total,
    classes,
    sipCount,
    connectedCount,
    readyCount,
    syncingCount,
    latestUpdate,
    isEmpty: mounted && connectedCount === 0,
    isInitialLoading:
      !mounted || (connectedCount > 0 && readyCount === 0),
  };
}
