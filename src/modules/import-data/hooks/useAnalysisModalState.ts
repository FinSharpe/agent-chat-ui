"use client";
import { useCallback, useState } from "react";

/**
 * Open state for an analysis modal that still renders its own "Analyse" pill
 * but can also be opened by the account row's body tap.
 *
 * Uncontrolled by default (the pill owns it). Pass `open`/`onOpenChange` and
 * the caller owns it instead — the two never fight, because the controlled
 * value simply wins when it is supplied.
 */
export function useAnalysisModalState(
  open?: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const controlled = open !== undefined;

  const set = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  return {
    open: controlled ? open : uncontrolled,
    handleOpen: useCallback(() => set(true), [set]),
    handleClose: useCallback(() => set(false), [set]),
    handleOpenChange: set,
  };
}
