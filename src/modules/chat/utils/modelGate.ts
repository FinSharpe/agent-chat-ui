import type { ChatModelOption } from "../api/chatModels";
import type { HeldSend } from "../store/useModelChoiceStore";
import { runPin } from "./pin";

/** Sends a Run on the model it is given: a pinned id, or null for Auto. */
export type PinnedSend = (model: string | null) => void;

/**
 * Runs `send` on the pick, or holds it while the user chooses.
 * `onCancel` runs if the user closes the choice without choosing.
 * Returns true when it went out now.
 */
export type ModelGate = (send: PinnedSend, onCancel?: () => void) => boolean;

export interface ModelGateDeps {
  /** The composer's pick right now (null: Auto). */
  getModel: () => string | null;
  /** The list as last answered; undefined while it has not. */
  getModels: () => readonly ChatModelOption[] | undefined;
  /** Parks a send and asks the user to choose. */
  hold: (send: HeldSend) => void;
  /** Re-reads the list, so a model that came back is seen promptly. */
  refresh?: () => void;
}

/**
 * The one check every chat send passes through (finsharpe-agents#255). The
 * pick is read when the send actually goes out — at once, or on the retry
 * after the user chose — never captured earlier, so a held send runs on the
 * choice and not on the pin that blocked it.
 */
export function createModelGate(deps: ModelGateDeps): ModelGate {
  const gate: ModelGate = (send, onCancel) => {
    const pin = runPin(deps.getModel(), deps.getModels());
    if (pin.send) {
      send(pin.model);
      return true;
    }
    deps.hold({ retry: () => void gate(send, onCancel), onCancel });
    deps.refresh?.();
    return false;
  };
  return gate;
}
