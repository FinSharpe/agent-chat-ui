import { getJson } from "@/modules/discover/api/client";

/**
 * `GET /api/models` — the models a chat Run can be pinned to, the same list
 * finsharpe-mobile's composer offers (#157). Unauthenticated, in picker order,
 * with Auto implicit: Auto is the absence of a pin and never a row.
 *
 * `available` is false while the backend cannot reach that provider's account
 * (no key, no credit); such a row is not offered, and a thread pinned to it
 * goes back to Auto.
 */
export interface ChatModelOption {
  id: string;
  label: string;
  shortLabel: string;
  provider: string;
  supportsImages: boolean;
  available: boolean;
}

const str = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

function parseOption(raw: unknown): ChatModelOption | null {
  if (typeof raw !== "object" || raw === null) return null;
  const row = raw as Record<string, unknown>;
  const id = str(row.id);
  const label = str(row.label);
  if (!id || !label) return null;
  return {
    id,
    label,
    shortLabel: str(row.shortLabel) ?? label,
    provider: str(row.provider) ?? "Other",
    // Absent reads as true, as on mobile: only an explicit false withholds images.
    supportsImages: row.supportsImages !== false,
    available: row.available === true,
  };
}

export async function fetchChatModels(
  signal?: AbortSignal,
): Promise<ChatModelOption[]> {
  const body = await getJson<{ models?: unknown }>("models", { signal });
  const rows = Array.isArray(body.models) ? body.models : [];
  return rows.map(parseOption).filter((m): m is ChatModelOption => m !== null);
}
