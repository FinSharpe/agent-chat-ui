"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** How long a removed row stays in the ledger with its Undo before it goes. */
export const REMOVAL_GRACE_MS = 5000;

/**
 * Removal with a grace period: the row stays where it is, marked, with Undo in
 * place of its remove button, and only leaves the ledger when the time runs
 * out. Keyed on the field-array id, so rows added or removed meanwhile don't
 * shift which row goes.
 */
export function usePendingRemovals(
  fieldIds: string[],
  remove: (index: number) => void,
) {
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const ids = useRef(fieldIds);
  ids.current = fieldIds;

  const drop = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setPending((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const schedule = useCallback(
    (id: string) => {
      if (timers.current.has(id)) return;
      setPending((prev) => new Set(prev).add(id));
      timers.current.set(
        id,
        setTimeout(() => {
          drop(id);
          const index = ids.current.indexOf(id);
          if (index !== -1) remove(index);
        }, REMOVAL_GRACE_MS),
      );
    },
    [drop, remove],
  );

  /** Forget every pending removal (the rows stay). */
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    setPending(new Set());
  }, []);

  useEffect(() => clear, [clear]);

  return { pending, schedule, undo: drop, clear };
}
