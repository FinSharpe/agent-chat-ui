"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * The model each chat runs on, as finsharpe-mobile keeps it (#157): the pick
 * belongs to the thread, and a new chat starts on the last pick made anywhere.
 * `null` is Auto — the backend's model switcher picks per message — and is
 * recorded, not absent, so a thread set back to Auto does not reopen on the
 * last pick. A thread this browser never pinned is on Auto, whatever the last
 * pick was.
 */
interface ChatPrefsStore {
  /** The composer's pick for the chat on screen; null is Auto. */
  model: string | null;
  /** The last pick made anywhere: what a new chat starts on. */
  last: string | null;
  /** Thread id to its pick, oldest first. */
  threads: Record<string, string | null>;

  /** A pick made in the composer, for the open thread (null: a new chat). */
  pick: (model: string | null, threadId: string | null) => void;
  /** The chat on screen changed: an existing thread, or null for a new chat. */
  openThread: (threadId: string | null) => void;
  /** A new chat's first run created its thread: it keeps the pick it ran on. */
  attachThread: (threadId: string) => void;
  /** The server stopped offering `model`: every mention goes back to Auto. */
  forget: (model: string) => void;
}

/** Oldest threads are dropped past this, so the stored map cannot grow forever. */
const MAX_THREADS = 500;

function withThread(
  threads: Record<string, string | null>,
  threadId: string,
  model: string | null,
): Record<string, string | null> {
  const next = { ...threads };
  delete next[threadId];
  next[threadId] = model;
  const keys = Object.keys(next);
  for (let i = 0; i < keys.length - MAX_THREADS; i++) delete next[keys[i]];
  return next;
}

export const useChatPrefsStore = create<ChatPrefsStore>()(
  persist(
    (set) => ({
      model: null,
      last: null,
      threads: {},

      pick: (model, threadId) =>
        set((s) => ({
          model,
          last: model,
          threads: threadId
            ? withThread(s.threads, threadId, model)
            : s.threads,
        })),

      openThread: (threadId) =>
        set((s) => ({
          model: threadId ? (s.threads[threadId] ?? null) : s.last,
        })),

      attachThread: (threadId) =>
        set((s) => ({ threads: withThread(s.threads, threadId, s.model) })),

      forget: (model) =>
        set((s) => ({
          model: s.model === model ? null : s.model,
          last: s.last === model ? null : s.last,
          threads: Object.fromEntries(
            Object.entries(s.threads).map(([id, m]) => [
              id,
              m === model ? null : m,
            ]),
          ),
        })),
    }),
    {
      name: "chat-model-prefs",
      storage: createJSONStorage(() => localStorage),
      // The on-screen pick is derived from these on every thread change.
      partialize: (s) => ({ last: s.last, threads: s.threads }),
    },
  ),
);

/**
 * The run config for a pick. Auto sends nothing, so the backend's switcher
 * routes the turn; a pinned model turns the switcher off for that Run, which
 * is how the backend tells a pin from a default (`OrchestratorConfig`).
 */
export function runConfigurable(model: string | null): {
  model?: string;
  model_switcher_enabled?: boolean;
} {
  return model ? { model, model_switcher_enabled: false } : {};
}
