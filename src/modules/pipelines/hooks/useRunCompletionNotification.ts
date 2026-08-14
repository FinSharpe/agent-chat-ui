"use client";

/**
 * Tell the user their report is ready when they are not looking at the tab.
 *
 * A Deep Dive takes long enough that nobody watches the timeline the whole
 * way, and the run does not stop when the tab loses focus. Two channels, in
 * order of how much they ask of the user:
 *
 * 1. The tab title, which costs no permission and works immediately.
 * 2. A system notification, only after the user has explicitly asked for one —
 *    permission is never requested on page load.
 *
 * Both fire only while the tab is hidden. A user watching the timeline
 * already sees the run finish.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { isRunTerminal } from "../types/pipelines.types";

export type NotifyPermission = "unsupported" | "default" | "granted" | "denied";

function readPermission(): NotifyPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotifyPermission;
}

interface Options {
  runId: string | null;
  status: string | undefined;
  /** "TCS" — what the notification is about. */
  symbol: string;
  /** Where a click on the notification should land. */
  href?: string;
}

export function useRunCompletionNotification({
  runId,
  status,
  symbol,
  href,
}: Options) {
  const [permission, setPermission] = useState<NotifyPermission>("default");
  const notifiedFor = useRef<string | null>(null);
  const baseTitle = useRef<string | null>(null);

  // Notification.permission is a browser API — read it after mount so the
  // server render and the first client render agree.
  useEffect(() => setPermission(readPermission()), []);

  const enable = useCallback(async () => {
    if (readPermission() === "unsupported") return;
    const result = await Notification.requestPermission();
    setPermission(result as NotifyPermission);
  }, []);

  useEffect(() => {
    if (!runId || !isRunTerminal(status)) return;
    if (notifiedFor.current === runId) return;
    if (typeof document === "undefined" || !document.hidden) return;
    notifiedFor.current = runId;

    const ready = status === "published";
    const title = ready
      ? `${symbol} report is ready`
      : `${symbol} report could not be produced`;
    const body = ready
      ? "Your research report has finished. Your credits were spent."
      : "The run failed and your credits have been refunded.";

    // Channel 1 — the tab title, restored the moment the user comes back.
    if (baseTitle.current === null) baseTitle.current = document.title;
    document.title = ready ? `✓ ${symbol} ready` : `× ${symbol} failed`;

    // Channel 2 — a system notification, only if the user asked for one.
    if (readPermission() === "granted") {
      try {
        const notification = new Notification(title, {
          body,
          tag: `pipeline-run-${runId}`,
        });
        notification.onclick = () => {
          window.focus();
          if (href) window.location.assign(href);
          notification.close();
        };
      } catch {
        // Some browsers refuse constructed Notifications outside a service
        // worker. The title channel has already done its job.
      }
    }
  }, [runId, status, symbol, href]);

  // Restore the title as soon as the user looks at the tab again.
  useEffect(() => {
    const restore = () => {
      if (!document.hidden && baseTitle.current !== null) {
        document.title = baseTitle.current;
        baseTitle.current = null;
      }
    };
    document.addEventListener("visibilitychange", restore);
    return () => {
      document.removeEventListener("visibilitychange", restore);
      if (baseTitle.current !== null) {
        document.title = baseTitle.current;
        baseTitle.current = null;
      }
    };
  }, []);

  return {
    permission,
    enable,
    /** Whether offering the "notify me" affordance makes any sense. */
    canAsk: permission === "default",
  };
}
