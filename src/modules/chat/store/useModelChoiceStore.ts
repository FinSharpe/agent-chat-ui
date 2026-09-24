"use client";

import { create } from "zustand";

/**
 * A send that is waiting for the user to choose a model (finsharpe-agents#255).
 *
 * When the chat's pin cannot run, the send is held here instead of going out
 * (and never goes out on Auto in its place), and the composer's picker opens
 * asking for a choice.
 * Choosing another model or Auto re-runs the held send on that choice;
 * closing the picker without choosing drops it (and gives its caller the
 * chance to put the words back where the user can see them).
 *
 * At most one send is held: a second blocked send replaces the first, whose
 * cancel runs, because only the newest thing the user asked for is waiting.
 */
export interface HeldSend {
  /** Sends again, re-reading the pick — called once the user has chosen. */
  retry: () => void;
  /** The user closed the picker without choosing. */
  onCancel?: () => void;
}

interface ModelChoiceStore {
  held: HeldSend | null;
  hold: (send: HeldSend) => void;
  /** The user chose a model or Auto: the held send goes out on it. */
  chosen: () => void;
  /** The user closed the picker without choosing: nothing is sent. */
  cancel: () => void;
}

export const useModelChoiceStore = create<ModelChoiceStore>()((set, get) => ({
  held: null,

  hold: (send) => {
    const previous = get().held;
    set({ held: send });
    previous?.onCancel?.();
  },

  chosen: () => {
    const held = get().held;
    set({ held: null });
    held?.retry();
  },

  cancel: () => {
    const held = get().held;
    set({ held: null });
    held?.onCancel?.();
  },
}));
