"use client";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import { isInvestments } from "../types/aa";
import { useAaPortfolio } from "./useAaPortfolio";

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
  total: number;
  classes: NetworthClass[];
  sipCount: number;
  connectedCount: number;
  readyCount: number;
  syncingCount: number;
  latestUpdate?: string;
  /**
   * Cost basis of the ready investment accounts that report one, and those same
   * accounts' current value — the pair behind the unrealised gain. The gain is
   * always `investedCurrent - invested`, never `total - invested`: only the
   * accounts that reported a cost may be compared against it.
   */
  invested: number;
  investedCurrent: number;
  isEmpty: boolean;
  isInitialLoading: boolean;
}

/**
 * Live net worth across every consent linked to the signed-in user.
 *
 * Reads the same server-normalized figures the account rows use, from the same
 * React Query cache, so the card and the rows can never disagree. SIP carries
 * no value and is surfaced only as a registration count.
 */
export function useNetworthData(): NetworthData {
  const { positions, isLoading, isError, hasConnections } = useAaPortfolio();

  const byType = new Map(positions.map((p) => [p.type, p]));
  const sipCount = byType.get("SIP")?.count ?? 0;

  let latestUpdate: string | undefined;
  let invested = 0;
  let investedCurrent = 0;

  const classes: NetworthClass[] = CLASS_ORDER.map((key) => {
    const position = byType.get(key);
    if (!position || position.consents.length === 0) return null;

    if (position.updatedAt && (!latestUpdate || position.updatedAt > latestUpdate)) {
      latestUpdate = position.updatedAt;
    }

    // Only accounts that report both a cost and the matching covered value
    // count toward the gain.
    for (const blob of position.blobs) {
      const n = blob.normalized;
      if (!isInvestments(n)) continue;
      if (n.costValue == null || n.costBasisValue == null) continue;
      invested += n.costValue;
      investedCurrent += n.costBasisValue;
    }

    const meta = CLASS_META[key];
    return {
      key,
      label: meta.label,
      color: meta.color,
      value: position.value,
      count: position.count,
      unitLabel: meta.unit(position.count),
      pct: 0,
      status: position.value === null ? ("syncing" as const) : ("ready" as const),
    };
  }).filter((c): c is NetworthClass => c !== null);

  const total = classes.reduce((sum, c) => sum + (c.value ?? 0), 0);
  classes.forEach((c) => {
    c.pct = total > 0 && c.value != null ? (c.value / total) * 100 : 0;
  });

  const connectedCount = classes.length;
  const readyCount = classes.filter((c) => c.status === "ready").length;

  return {
    total,
    classes,
    sipCount,
    connectedCount,
    readyCount,
    syncingCount: connectedCount - readyCount,
    latestUpdate,
    invested,
    investedCurrent,
    // A failed consent list is NOT an empty portfolio — saying "connect an
    // account" to someone who has five would be a lie. The accounts section
    // below owns the error and the retry; the card just stays quiet.
    isEmpty: !isLoading && !isError && connectedCount === 0 && !hasConnections,
    isInitialLoading:
      isLoading || isError || (connectedCount > 0 && readyCount === 0),
  };
}
