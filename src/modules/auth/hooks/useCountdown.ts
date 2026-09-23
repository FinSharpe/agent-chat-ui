"use client";

import { useCallback, useEffect, useState } from "react";

/** Whole seconds counting down to 0; `restart(n)` starts it again from n. */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const restart = useCallback((from: number) => setSeconds(from), []);

  return [seconds, restart] as const;
}
