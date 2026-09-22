"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchlistCardId } from "../constants/watchlist";

export interface WatchlistGroup {
  id: string;
  name: string;
  securities: string[];
  createdAt: number;
}

interface WatchlistState {
  /** Saved groups per watchlist card, so each card's groups stay separate. */
  groups: Partial<Record<WatchlistCardId, WatchlistGroup[]>>;
  addGroup: (cardId: WatchlistCardId, name: string, securities: string[]) => void;
  removeGroup: (cardId: WatchlistCardId, groupId: string) => void;
  addSecurity: (cardId: WatchlistCardId, groupId: string, security: string) => void;
  removeSecurity: (
    cardId: WatchlistCardId,
    groupId: string,
    security: string,
  ) => void;
}

const mapGroups = (
  groups: WatchlistGroup[] | undefined,
  groupId: string,
  fn: (g: WatchlistGroup) => WatchlistGroup,
) => (groups ?? []).map((g) => (g.id === groupId ? fn(g) : g));

/**
 * Watchlist groups — securities a user tracks without owning them. There is
 * no watchlist API, so the groups the user builds are kept in this browser's
 * localStorage, as in the reference design.
 */
export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      groups: {},
      addGroup: (cardId, name, securities) =>
        set((s) => ({
          groups: {
            ...s.groups,
            [cardId]: [
              ...(s.groups[cardId] ?? []),
              {
                id: `grp_${Date.now().toString(36)}`,
                name,
                securities,
                createdAt: Date.now(),
              },
            ],
          },
        })),
      removeGroup: (cardId, groupId) =>
        set((s) => ({
          groups: {
            ...s.groups,
            [cardId]: (s.groups[cardId] ?? []).filter((g) => g.id !== groupId),
          },
        })),
      addSecurity: (cardId, groupId, security) =>
        set((s) => ({
          groups: {
            ...s.groups,
            [cardId]: mapGroups(s.groups[cardId], groupId, (g) =>
              g.securities.includes(security)
                ? g
                : { ...g, securities: [...g.securities, security] },
            ),
          },
        })),
      removeSecurity: (cardId, groupId, security) =>
        set((s) => ({
          groups: {
            ...s.groups,
            [cardId]: mapGroups(s.groups[cardId], groupId, (g) => ({
              ...g,
              securities: g.securities.filter((x) => x !== security),
            })),
          },
        })),
    }),
    { name: "finsharpe.import.watchlist" },
  ),
);
