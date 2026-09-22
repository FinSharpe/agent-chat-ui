"use client";
import { create } from "zustand";

/**
 * Consents in trouble *this session*.
 *
 * Deliberately in memory only (no persist middleware): a dead or sync-failed
 * consent is a fact about the current run, not user data. The server is the
 * record of what exists; this store only stops a consent that MoneyOne has
 * just rejected from continuing to render as "Synced" until the next reload.
 *
 * Mirrors finsharpe-mobile's `deadConsentsProvider` / `syncFailedConsentsProvider`.
 */
interface AaTroubleState {
  dead: Set<string>;
  failed: Set<string>;
  /** Consents whose one-shot auto-refresh has already been spent this session. */
  autoTriggered: Set<string>;
  markDead: (consentID: string) => void;
  markFailed: (consentID: string) => void;
  /** A successful fetch clears both flags for that consent. */
  clearTrouble: (consentID: string) => void;
  markAutoTriggered: (consentID: string) => boolean;
  forget: (consentID: string) => void;
}

const without = (set: Set<string>, id: string) => {
  if (!set.has(id)) return set;
  const next = new Set(set);
  next.delete(id);
  return next;
};

const withId = (set: Set<string>, id: string) => {
  if (set.has(id)) return set;
  return new Set(set).add(id);
};

export const useAaTroubleStore = create<AaTroubleState>((set, get) => ({
  dead: new Set(),
  failed: new Set(),
  autoTriggered: new Set(),

  markDead: (consentID) =>
    set((s) => ({ dead: withId(s.dead, consentID) })),

  markFailed: (consentID) =>
    set((s) => ({ failed: withId(s.failed, consentID) })),

  clearTrouble: (consentID) =>
    set((s) => ({
      dead: without(s.dead, consentID),
      failed: without(s.failed, consentID),
    })),

  /**
   * Claim the one-shot auto-refresh for a consent. Returns false if it was
   * already spent, so a data-missing consent can never trigger a periodic
   * refresh loop.
   */
  markAutoTriggered: (consentID) => {
    if (get().autoTriggered.has(consentID)) return false;
    set((s) => ({ autoTriggered: withId(s.autoTriggered, consentID) }));
    return true;
  },

  forget: (consentID) =>
    set((s) => ({
      dead: without(s.dead, consentID),
      failed: without(s.failed, consentID),
      autoTriggered: without(s.autoTriggered, consentID),
    })),
}));
