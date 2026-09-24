import type { ChatModelOption } from "../api/chatModels";
import type { HeldSend } from "../store/useModelChoiceStore";
import { runPin } from "./pin";

/** Sends a Run on the model it is given: a pinned id, or null for Auto. */
export type PinnedSend = (model: string | null) => void;

/**
 * Runs `send` on the pick, or holds it while the user chooses.
 * `onCancel` runs if the send is dropped without going out: the user closed
 * the choice, or a newer send replaced it.
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
  /**
   * True when the list is too old to send a pin on. A pinned send then waits
   * for {@link confirm} and is decided on the list it returns, so a model the
   * server has since dropped or marked unavailable holds the send instead of
   * going out on a stale read.
   */
  needsConfirm?: () => boolean;
  /** Reads the list again. Resolves (never rejects) once it has, or gave up. */
  confirm?: () => Promise<unknown>;
  /**
   * Where the send was asked for (the open thread). A send whose confirmation
   * finishes after the user has moved elsewhere is dropped, not sent there.
   */
  getScope?: () => unknown;
}

/**
 * The one check every chat send passes through (finsharpe-agents#255). The
 * pick is read when the send actually goes out — at once, after the list was
 * confirmed, or on the retry after the user chose — never captured earlier,
 * so a held send runs on the choice and not on the pin that blocked it.
 */
export function createModelGate(deps: ModelGateDeps): ModelGate {
  // At most one send waits on a confirmation; a newer one replaces it, as a
  // second press of Send must not send twice.
  let confirming: { onCancel?: () => void } | null = null;

  const decide: ModelGate = (send, onCancel) => {
    const pin = runPin(deps.getModel(), deps.getModels());
    if (pin.send) {
      send(pin.model);
      return true;
    }
    deps.hold({ retry: () => void gate(send, onCancel), onCancel });
    deps.refresh?.();
    return false;
  };

  const gate: ModelGate = (send, onCancel) => {
    const pinned = deps.getModel() !== null;
    if (!pinned || !deps.confirm || !deps.needsConfirm?.()) {
      return decide(send, onCancel);
    }
    const mine = { onCancel };
    const previous = confirming;
    confirming = mine;
    previous?.onCancel?.();
    const scope = deps.getScope?.();
    void deps
      .confirm()
      .catch(() => undefined)
      .then(() => {
        if (confirming !== mine) return;
        confirming = null;
        if (deps.getScope && deps.getScope() !== scope) {
          onCancel?.();
          return;
        }
        decide(send, onCancel);
      });
    return false;
  };
  return gate;
}
