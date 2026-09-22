import type { LucideIcon } from "lucide-react";

export type AccountTab =
  | "profile"
  | "usage"
  | "security"
  | "billing"
  | "settings";

export type ProfileTab = "overview" | "subscription" | "usage" | "tokens";

export type ToneClass = "tone-blue" | "tone-mint" | "tone-navy";

/** One mode on the Assistant wheel. */
export interface AssistantTool {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  /** Sent as the first message of the chat "Start Chat" opens. */
  prompt: string;
}
