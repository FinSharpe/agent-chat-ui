import type { LucideIcon } from "lucide-react";

/** One mode on the Assistant wheel. */
export interface AssistantTool {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  /** Sent as the first message of the chat "Start Chat" opens. */
  prompt: string;
}
