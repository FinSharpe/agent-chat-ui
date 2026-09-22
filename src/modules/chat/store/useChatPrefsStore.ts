"use client";

import { create } from "zustand";
import { DEFAULT_MODEL_TIER, PlannerModels } from "@/configs/models";

/**
 * Chat choices that outlive one mount of the Chat page: leaving for Home and
 * coming back keeps the model tier the user picked. Not persisted — a reload
 * starts from the default tier, as before.
 */
interface ChatPrefsStore {
  model: PlannerModels;
  setModel: (model: PlannerModels) => void;
}

export const useChatPrefsStore = create<ChatPrefsStore>()((set) => ({
  model: DEFAULT_MODEL_TIER.model,
  setModel: (model) => set({ model }),
}));
