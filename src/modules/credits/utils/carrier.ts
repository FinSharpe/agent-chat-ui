/**
 * The `credits` carrier: what the agents put on a chat answer under
 * `additional_kwargs.credits` when a turn's credits moved or were refused —
 *
 *   { kind: "charge", turn_id, status, charge_minor }   (#263, the label)
 *   { kind: "refused" }                                   (#268, a Short Balance)
 *
 * It is read for two things:
 *
 * - the Balance on screen is refetched whenever a carrier lands (#280) — any
 *   object under the key counts, whatever its `kind`: a kind a later server
 *   adds still means the Balance may have moved;
 * - the chat draws it (#282, `readCreditsCarrier`): the charge label under the
 *   answer card, or the Short Balance notice beside a refusal. Only the two
 *   frozen shapes draw anything, and only through the fields named here — so
 *   nothing else a carrier might carry can reach the screen.
 *
 * Who gets a carrier is the server's decision, never the client's: in Shadow
 * Mode the label goes to staff alone, once enforced to every account, and a
 * refusal carries `{kind: "refused"}` only in enforced mode. There is no
 * client switch; an answer with no carrier shows nothing.
 */

export const CREDITS_CARRIER_KEY = "credits";

/** What the chat draws from a carrier (#282). */
export type ChatCreditsCarrier =
  /** A successful turn's Charge so far, in hundredths: the charge label. */
  | { kind: "charge"; chargeMinor: number }
  /** A turn Admission refused on a Short Balance: the notice and the pill. */
  | { kind: "refused" };

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
 * The carrier on `message` as the chat draws it, or null when it draws
 * nothing: a `charge` whose `charge_minor` is a whole, non-negative number of
 * hundredths, or a `refused`. A charge carrier with no usable figure draws no
 * label rather than a guessed one — a Charge is posted hundredths and is never
 * below zero, so a negative one is not a figure to show; any other kind draws
 * nothing (it still refetches).
 *
 * A refusal is read off this carrier alone, never off the Refusal Marker
 * (`finsharpe_refusal`): the marker rides on every refusal — scope, the
 * In-flight Cap — and only a Short Balance carries `{kind: "refused"}`.
 */
export function readCreditsCarrier(
  message: unknown,
): ChatCreditsCarrier | null {
  const carrier = getCreditsCarrier(message);
  if (!carrier) return null;
  if (carrier.kind === "refused") return { kind: "refused" };
  if (carrier.kind === "charge") {
    const minor = carrier.charge_minor;
    if (typeof minor !== "number" || !Number.isSafeInteger(minor)) return null;
    return minor >= 0 ? { kind: "charge", chargeMinor: minor } : null;
  }
  return null;
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
