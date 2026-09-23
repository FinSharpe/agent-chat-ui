"use client";
import { useEffect, useState } from "react";

/**
 * False on the server and the first client render. Gate anything read from
 * localStorage (the persisted manual-asset and watchlist stores) behind it so
 * the server HTML and the hydrating client agree.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
