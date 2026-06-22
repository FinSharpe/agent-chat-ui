export enum PlannerModels {
    // GPT_5 = "openai:gpt-5",
    GPT_5_5 = "openai:gpt-5.5",
    GPT_5_4 = "openai:gpt-5.4",
    GPT_5_4_MINI = "openai:gpt-5.4-mini",
    GPT_5_2 = "openai:gpt-5.2",
    GPT_5_1 = "openai:gpt-5.1",
    GPT_5 = "openai:gpt-5",
    GEMINI_3 = "google_genai:gemini-3-pro-preview",
    GEMINI_3_FLASH = "google_genai:gemini-3-flash-preview",
    SONNET_4_6 = "anthropic:claude-sonnet-4-6",
    SONNET_4_5 = "anthropic:claude-sonnet-4-5-20250929",
    HAIKU_4_5 = "anthropic:claude-haiku-4-5-20251001",
    OPUS_4_8 = "anthropic:claude-opus-4-8",
    DEEPSEEK_V4_PRO = "deepseek:deepseek-v4-pro",
    DEEPSEEK_V4_FLASH = "deepseek:deepseek-v4-flash",
}

/**
 * User-facing model "tiers". Instead of exposing raw model names in the
 * selector, we surface a short curated list labelled by capability/effort
 * (Default → Ultra). Each tier maps to a concrete {@link PlannerModels} value
 * that is what actually gets sent to the LangGraph backend.
 *
 * To re-point a tier at a different model, change only its `model` field.
 */
export type ModelTierId = "low" | "medium" | "high" | "max" | "ultra";

export interface ModelTier {
    id: ModelTierId;
    /** Short label shown in the picker, e.g. "Default", "Ultra". */
    label: string;
    /** One-line helper text shown under the label. */
    description: string;
    /** The concrete backend model this tier resolves to. */
    model: PlannerModels;
}

export const MODEL_TIERS: ModelTier[] = [
    {
        id: "low",
        label: "Low",
        description: "Fastest & cheapest for everyday questions",
        model: PlannerModels.DEEPSEEK_V4_FLASH,
    },
    {
        id: "medium",
        label: "Medium",
        description: "Strong value for broader tasks",
        model: PlannerModels.DEEPSEEK_V4_PRO,
    },
    {
        id: "high",
        label: "High",
        description: "Strong reasoning with a huge context window",
        model: PlannerModels.GEMINI_3,
    },
    {
        id: "max",
        label: "Max",
        description: "Frontier-class for hard problems",
        model: PlannerModels.GPT_5_4,
    },
    {
        id: "ultra",
        label: "Ultra",
        description: "Most powerful — deep, nuanced thinking",
        model: PlannerModels.OPUS_4_8,
    },
];

/** The tier selected by default when a chat opens. */
export const DEFAULT_MODEL_TIER: ModelTier =
    MODEL_TIERS.find((t) => t.id === "medium") ?? MODEL_TIERS[0];

/** Resolve the tier that owns a given backend model (falls back to default). */
export function getModelTier(model: PlannerModels): ModelTier {
    return MODEL_TIERS.find((t) => t.model === model) ?? DEFAULT_MODEL_TIER;
}
