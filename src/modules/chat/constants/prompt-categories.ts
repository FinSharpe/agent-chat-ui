/**
 * Empty-state starter prompts, grouped by the category tabs above them.
 *
 * Copy from the desktop-web reference (`src/data/chatResponses.ts`): three per
 * category keeps the new-chat screen calm and scannable. Each one is sent to
 * the real agent as an ordinary first message.
 */
export const PROMPT_CATEGORIES: Record<string, string[]> = {
  Stocks: [
    "Analyse Tata Motors",
    "Compare TCS & INFY",
    "What's the outlook for Reliance?",
  ],
  "Mutual Funds": [
    "Analyse Quant Smallcap Fund",
    "Top 5 flexi-cap funds",
    "Best ELSS funds for tax saving",
  ],
  "Personal Finance": [
    "Help me plan my finances",
    "How much should I save monthly?",
    "Plan my retirement corpus",
  ],
};

export const DEFAULT_PROMPT_CATEGORY = "Stocks";

/** Icon tints the prompt rows cycle through (blue, mint, navy). */
export const PROMPT_TONES = [
  "text-[#063BAA]",
  "text-[#0A9E6E]",
  "text-[#0A1F4D]",
] as const;
