/**
 * Folding a user's consents into the five per-class rows the Import page shows.
 *
 * Ported from finsharpe-mobile `portfolio_controller.dart` (`ClassPosition`,
 * `AccountRowState`, `countCaption`). One class can hold several consents (two
 * demat accounts, two registrars) and the row speaks for all of them, so the
 * WORST consent decides what it says: a healthy demat beside one that expired
 * is not a healthy row.
 */
import type {
  AaConsentType,
  ConsentRecord,
  FiBlob,
  NormalizedBank,
  NormalizedInvestments,
  NormalizedSip,
} from "../types/aa";
import { isBank, isInvestments, isSip } from "../types/aa";

/**
 * Declaration order is SEVERITY order — the fold keeps the highest-ranked
 * state its consents report. `unconnected` sits outside the ranking: a class
 * with no consent has nothing to fold.
 */
export const ROW_STATES = [
  "unconnected",
  "synced",
  "syncing",
  "syncFailed",
  "expired",
] as const;

export type AccountRowState = (typeof ROW_STATES)[number];

/** The order "Your accounts" lists its rows — never reshuffled as accounts connect. */
export const ACCOUNT_ROW_ORDER: AaConsentType[] = [
  "EQUITIES",
  "MUTUAL_FUNDS",
  "ETF",
  "BANK_ACCOUNTS",
  "SIP",
];

export const CLASS_LABELS: Record<AaConsentType, string> = {
  EQUITIES: "Equities",
  MUTUAL_FUNDS: "Mutual funds",
  ETF: "ETFs",
  BANK_ACCOUNTS: "Bank accounts",
  SIP: "SIPs",
};

/** What each class is for, shown while it is unconnected. */
export const CLASS_PITCHES: Record<AaConsentType, string> = {
  EQUITIES: "Demat holdings from CDSL and NSDL",
  MUTUAL_FUNDS: "Folios from CAMS and KFintech",
  ETF: "Exchange-traded funds in your demat",
  BANK_ACCOUNTS: "Balances from your savings accounts",
  SIP: "Your systematic investment plans",
};

/** Consents in trouble this session — dead (MoneyOne said so) and sync-failed. */
export interface ConsentTrouble {
  dead: ReadonlySet<string>;
  failed: ReadonlySet<string>;
}

export const NO_TROUBLE: ConsentTrouble = {
  dead: new Set<string>(),
  failed: new Set<string>(),
};

export function isConsentExpired(consent: ConsentRecord): boolean {
  const expiry = Date.parse(consent.consentExpiry);
  return Number.isFinite(expiry) && expiry <= Date.now();
}

/** Dead, or run out its validity. Only a renew fixes either. */
export function isConsentBroken(
  consent: ConsentRecord,
  trouble: ConsentTrouble,
): boolean {
  return trouble.dead.has(consent.consentID) || isConsentExpired(consent);
}

export interface ClassPosition {
  type: AaConsentType;
  label: string;
  consents: ConsentRecord[];
  blobs: FiBlob[];
  state: AccountRowState;
  /** The consent the row names, and the one a renew has to fix. */
  brokenConsent: ConsentRecord | null;
  /**
   * Consents still on a first sync that can make progress on their own. Per
   * consent, unlike `state`: there an expired sibling outranks a demat still
   * syncing, but the net-worth total still waits for it.
   */
  syncingConsents: number;
  /** Rupee value of the class; null for SIP (a commitment is not a balance). */
  value: number | null;
  count: number;
  hasData: boolean;
  /** Most recent server-side fetch across this class's blobs. */
  updatedAt: string | null;
  /** SIPs detected inside the mutual-funds consent, surfaced on the SIP row. */
  activeSips: number;
  monthlyCommitment: number | null;
}

function foldState(
  consents: ConsentRecord[],
  blobs: FiBlob[],
  trouble: ConsentTrouble,
): AccountRowState {
  if (consents.length === 0) return "unconnected";
  const synced = new Set(blobs.map((b) => b.consentID));

  let worst: AccountRowState = "synced";
  for (const consent of consents) {
    const state: AccountRowState = isConsentBroken(consent, trouble)
      ? "expired"
      : synced.has(consent.consentID)
        ? "synced"
        : trouble.failed.has(consent.consentID)
          ? "syncFailed"
          : "syncing";
    if (ROW_STATES.indexOf(state) > ROW_STATES.indexOf(worst)) worst = state;
  }
  return worst;
}

function foldValue(type: AaConsentType, blobs: FiBlob[]): number | null {
  // A SIP commitment is never summed into net worth.
  if (type === "SIP") return null;

  if (type === "BANK_ACCOUNTS") {
    const balances = blobs
      .map((b) => (isBank(b.normalized) ? b.normalized.totalBalance : null))
      .filter((v): v is number => typeof v === "number");
    return balances.length === 0
      ? null
      : balances.reduce((sum, v) => sum + v, 0);
  }

  if (blobs.length === 0) return null;
  return blobs.reduce((sum, b) => {
    const n = b.normalized;
    return sum + (isInvestments(n) ? (n.currentValue ?? 0) : 0);
  }, 0);
}

function foldCount(type: AaConsentType, blobs: FiBlob[]): number {
  if (type === "BANK_ACCOUNTS") {
    return blobs.reduce(
      (sum, b) => sum + (isBank(b.normalized) ? b.normalized.accountCount : 0),
      0,
    );
  }
  if (type === "SIP") {
    return blobs.reduce(
      (sum, b) =>
        sum + (isSip(b.normalized) ? b.normalized.registrations.length : 0),
      0,
    );
  }
  // Distinct instruments, not per-account rows.
  const isins = new Set<string>();
  for (const b of blobs) {
    if (!isInvestments(b.normalized)) continue;
    for (const h of b.normalized.holdings) isins.add(h.isin);
  }
  return isins.size;
}

/**
 * Fold one asset class. `mutualFundBlobs` supplies the SIP row's "detected
 * SIPs" — the mutual-funds consent is where `activeSips` actually arrive.
 */
export function buildPosition(
  type: AaConsentType,
  allConsents: ConsentRecord[],
  blobsById: Record<string, FiBlob | undefined>,
  trouble: ConsentTrouble,
): ClassPosition {
  const consents = allConsents.filter((c) => c.type === type);
  const blobs = consents
    .map((c) => blobsById[c.consentID])
    .filter((b): b is FiBlob => !!b);

  const updatedAt = blobs.reduce<string | null>(
    (latest, b) => (!latest || b.fetchedAt > latest ? b.fetchedAt : latest),
    null,
  );

  const sipBlob = blobs.find((b) => isSip(b.normalized));
  const sipAnalytics = sipBlob && isSip(sipBlob.normalized)
    ? sipBlob.normalized.analytics
    : null;

  // SIPs are detected inside the mutual-funds feed, so the SIP row reads them
  // from there rather than from its own (registration-only) consent.
  const activeSips =
    type === "SIP"
      ? Object.values(blobsById).reduce((sum, b) => {
          const n = b?.normalized;
          return (
            sum +
            (n && isInvestments(n) && n.assetClass === "MUTUAL_FUNDS"
              ? (n.activeSips?.length ?? 0)
              : 0)
          );
        }, 0)
      : 0;

  return {
    type,
    label: CLASS_LABELS[type],
    consents,
    blobs,
    state: foldState(consents, blobs, trouble),
    brokenConsent:
      consents.find((c) => isConsentBroken(c, trouble)) ?? null,
    syncingConsents: consents.filter(
      (c) =>
        !blobs.some((b) => b.consentID === c.consentID) &&
        !isConsentBroken(c, trouble) &&
        !trouble.failed.has(c.consentID),
    ).length,
    value: foldValue(type, blobs),
    count: foldCount(type, blobs),
    hasData: blobs.length > 0,
    updatedAt,
    activeSips,
    monthlyCommitment: sipAnalytics?.monthlyCommitment ?? null,
  };
}

/** Every class, in the fixed row order. */
export function buildPositions(
  consents: ConsentRecord[],
  blobsById: Record<string, FiBlob | undefined>,
  trouble: ConsentTrouble,
): ClassPosition[] {
  return ACCOUNT_ROW_ORDER.map((type) =>
    buildPosition(type, consents, blobsById, trouble),
  );
}

export type { NormalizedBank, NormalizedInvestments, NormalizedSip };
