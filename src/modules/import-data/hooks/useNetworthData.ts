"use client";
import { ConsentType } from "@/modules/import-data/types/consent-type";
import { useAaPortfolio } from "./useAaPortfolio";
import { useDayMove, type DayMoveState } from "./useDayMove";

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
  /** Accounts (consents) behind net worth, and how many are still syncing. */
  accountCount: number;
  syncingAccountCount: number;
  latestUpdate?: string;
  /** The invested book's move over the latest session. */
  dayMove: DayMoveState;
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
  const dayMove = useDayMove(positions);

  const byType = new Map(positions.map((p) => [p.type, p]));
  const sipCount = byType.get("SIP")?.count ?? 0;

  let latestUpdate: string | undefined;
  let accountCount = 0;
  let syncingAccountCount = 0;

  const classes: NetworthClass[] = CLASS_ORDER.map((key) => {
    const position = byType.get(key);
    if (!position || position.consents.length === 0) return null;
    accountCount += position.consents.length;
    syncingAccountCount += position.syncingConsents;

    if (position.updatedAt && (!latestUpdate || position.updatedAt > latestUpdate)) {
      latestUpdate = position.updatedAt;
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
    accountCount,
    syncingAccountCount,
    latestUpdate,
    dayMove,
    // A failed consent list is NOT an empty portfolio — saying "connect an
    // account" to someone who has five would be a lie. The accounts section
    // below owns the error and the retry; the card just stays quiet.
    isEmpty: !isLoading && !isError && connectedCount === 0 && !hasConnections,
    // No figure until every account behind it has landed: a partial sum
    // reads as the whole book, and ₹0 before the first one reads as broke.
    // A consent that gave up or expired is not waited on — it will not
    // arrive on its own, and its row already says so. finsharpe-mobile's
    // `PortfolioSnapshot.netWorthSync` — change the two together.
    isInitialLoading:
      isLoading ||
      isError ||
      syncingAccountCount > 0 ||
      (connectedCount > 0 && readyCount === 0),
  };
}
