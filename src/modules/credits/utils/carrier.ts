/**
 * The `credits` carrier: what the agents put on a chat answer under
 * `additional_kwargs.credits` when a turn's credits moved or were refused —
 *
 *   { kind: "charge", turn_id, status, charge_minor }   (#263, the label)
 *   { kind: "refused" }                                   (#268, a Short Balance)
 *
 * This ticket (#280) reads it for one thing only: the Balance on screen is
 * refetched whenever a carrier lands. Rendering it — the charge label under
 * the answer, the refusal's notice — is #282's, which reads the same key
 * through `getCreditsCarrier`.
 *
 * Any object under the key counts as a carrier, whatever its `kind`: a kind a
 * later server adds still means the Balance may have moved.
 */

export const CREDITS_CARRIER_KEY = "credits";

/** The raw carrier on a message, or null when it carries none. */
export function getCreditsCarrier(
  message: unknown,
): Record<string, unknown> | null {
  if (!message || typeof message !== "object") return null;
  const kwargs = (message as { additional_kwargs?: unknown }).additional_kwargs;
  if (!kwargs || typeof kwargs !== "object") return null;
  const carrier = (kwargs as Record<string, unknown>)[CREDITS_CARRIER_KEY];
  if (!carrier || typeof carrier !== "object" || Array.isArray(carrier)) {
    return null;
  }
  return carrier as Record<string, unknown>;
}

/**
 * One string per carrier in `messages`, naming the message and what it
 * carries — so the same answer re-sent by the stream is the same carrier, and
 * a different one (or a different message) is a new one.
 */
export function creditsCarrierSignatures(
  messages: readonly unknown[],
): string[] {
  const signatures: string[] = [];
  messages.forEach((message, index) => {
    const carrier = getCreditsCarrier(message);
    if (!carrier) return;
    const id = (message as { id?: unknown }).id;
    const where = typeof id === "string" && id ? id : `#${index}`;
    signatures.push(`${where}|${stableJson(carrier)}`);
  });
  return signatures;
}

/** JSON with sorted keys, so key order never makes one carrier look like two. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * The carriers in `current` not among `seen` — true when at least one landed.
 * `seen` is updated in place with everything in `current`.
 */
export function noteNewCarriers(
  seen: Set<string>,
  current: readonly string[],
): boolean {
  let landed = false;
  for (const signature of current) {
    if (!seen.has(signature)) {
      seen.add(signature);
      landed = true;
    }
  }
  return landed;
}
