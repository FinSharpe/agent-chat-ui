"use client";

import { useEffect, useState } from "react";
import { ConsentType } from "@/lib/moneyone/moneyone.enums";
import { getAllUserConsents } from "@/lib/moneyone/moneyone.storage";
import { LINKABLE_ACCOUNTS } from "../constants/linkedAccounts";

/** Home's connection-dependent states, named as in the design reference. */
export type ConnectionState =
  | "new_user"
  | "partially_connected"
  | "fully_connected";

/**
 * Which Account Aggregator account types the user has linked, read from the
 * consents Import keeps in localStorage — no network, so Home can pick its
 * connection state cheaply. Re-reads when Import signals a consent change.
 * Before mount (and on the server) nothing is linked, the reference default.
 */
export function useLinkedAccounts() {
  const [linked, setLinked] = useState<ConsentType[]>([]);

  useEffect(() => {
    const read = () => {
      const now = Date.now();
      const live = new Set(
        getAllUserConsents()
          .filter(
            (c) => !c.isExpired && new Date(c.consentExpiry).getTime() > now,
          )
          .map((c) => c.type),
      );
      setLinked(LINKABLE_ACCOUNTS.filter((t) => live.has(t)));
    };

    read();
    window.addEventListener("moneyone:consent-updated", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("moneyone:consent-updated", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const missing = LINKABLE_ACCOUNTS.filter((t) => !linked.includes(t));
  const state: ConnectionState =
    linked.length === 0
      ? "new_user"
      : missing.length === 0
        ? "fully_connected"
        : "partially_connected";

  return { linked, missing, state };
}
