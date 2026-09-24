import type { ChatModelOption } from "../api/chatModels";

/**
 * What the composer's pick means for the next Run (finsharpe-agents#255,
 * ADR-0015: "an unavailable pinned model is the user's choice").
 *
 * A pin is never replaced quietly. A model the list marks unavailable, or no
 * longer lists at all, stays the pin — shown by its last known label, marked
 * unavailable — and a send waits until the user chooses another model or
 * Auto. Nothing here or anywhere else in the client moves a pin to Auto on
 * its own, so when the model comes back the same pin simply works again.
 *
 * - `available`: the list answered and offers it — sent pinned.
 * - `unconfirmed`: the list has not answered (loading, or the read failed).
 *   A list that did not arrive is no evidence the model went, so the Run is
 *   still sent pinned; the server refuses a pin it cannot serve, it never
 *   swaps it (#249). Sending it unpinned is the one thing ruled out.
 * - `unavailable`: listed, but the deployment cannot serve it right now.
 * - `unlisted`: the list answered and no longer carries it. Treated exactly
 *   like `unavailable`.
 */
export type PinStatus =
  | "available"
  | "unconfirmed"
  | "unavailable"
  | "unlisted";

export type PinState =
  | { kind: "auto" }
  | {
      kind: "pinned";
      id: string;
      label: string;
      shortLabel: string;
      status: PinStatus;
    };

/** What the picker calls the absence of a pin. */
export const AUTO_LABEL = "Auto";

/** The sentence that says why a send is waiting, or null when none is. */
export function unavailableNotice(
  pin: PinState,
  waiting: boolean,
): string | null {
  if (!isBlocked(pin) || pin.kind !== "pinned") return null;
  return waiting
    ? `${pin.label} isn't available right now. Choose another model or Auto to send your message.`
    : `${pin.label} isn't available right now. Choose another model or Auto before you send.`;
}

/** What a send may do right now: go out (pinned or on Auto), or wait. */
export type RunPin = { send: true; model: string | null } | { send: false };

/**
 * The name of a pin the list does not carry and this browser never saw a
 * label for (pinned under an earlier build, say): its model id, exactly as
 * stored. A made-up name could not be told from a real one; the id at least
 * says precisely which model the chat is set to.
 */
export function fallbackLabel(id: string): string {
  return id;
}

export function pinState(
  model: string | null,
  models: readonly ChatModelOption[] | undefined,
  labels: Readonly<Record<string, string>> = {},
): PinState {
  if (!model) return { kind: "auto" };
  const row = models?.find((m) => m.id === model);
  const label = row?.label ?? labels[model] ?? fallbackLabel(model);
  const shortLabel = row?.shortLabel ?? label;
  const status: PinStatus = !models
    ? "unconfirmed"
    : !row
      ? "unlisted"
      : row.available
        ? "available"
        : "unavailable";
  return { kind: "pinned", id: model, label, shortLabel, status };
}

/** True when the pin cannot run now and the user has to choose first. */
export function isBlocked(state: PinState): boolean {
  return (
    state.kind === "pinned" &&
    (state.status === "unavailable" || state.status === "unlisted")
  );
}

/**
 * The model a Run goes out on. The invariant this ticket exists for: a pick
 * that is not Auto is either sent as itself or not sent at all — never as
 * Auto.
 */
export function runPin(
  model: string | null,
  models: readonly ChatModelOption[] | undefined,
): RunPin {
  const state = pinState(model, models);
  if (state.kind === "auto") return { send: true, model: null };
  if (isBlocked(state)) return { send: false };
  return { send: true, model: state.id };
}

/** One row of the picker: a model on offer, or the pin that cannot run now. */
export interface PickerRow {
  id: string;
  label: string;
  /** False for the pinned row that cannot run: shown, marked, not choosable. */
  choosable: boolean;
}

/**
 * The picker's model rows, grouped by provider in the server's order. Models
 * the list marks unavailable are not offered — except the pin, which keeps
 * its place (or, once unlisted, a group of its own at the end) so the user
 * can see what the chat is set to and why it is waiting.
 */
export function pickerGroups(
  models: readonly ChatModelOption[],
  pin: PinState,
): [string, PickerRow[]][] {
  const groups = new Map<string, PickerRow[]>();
  const add = (provider: string, row: PickerRow) => {
    const rows = groups.get(provider) ?? [];
    rows.push(row);
    groups.set(provider, rows);
  };
  const pinnedId = pin.kind === "pinned" ? pin.id : null;
  for (const m of models) {
    if (m.available) {
      add(m.provider, { id: m.id, label: m.label, choosable: true });
    } else if (m.id === pinnedId) {
      add(m.provider, { id: m.id, label: m.label, choosable: false });
    }
  }
  if (pin.kind === "pinned" && pin.status === "unlisted") {
    add("No longer offered", {
      id: pin.id,
      label: pin.label,
      choosable: false,
    });
  }
  return [...groups.entries()];
}
