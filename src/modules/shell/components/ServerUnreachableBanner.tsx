"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

/**
 * One strip across the top of the shell while the session state is unknown
 * because the server can't be reached (T-01 item 3, T-10 item 4).
 *
 * Without it the app looks signed-out — no name, empty lists — which reads as
 * "you have nothing" rather than "we couldn't load this". A signed-in visitor
 * is never bounced to /login for this; that stays reserved for a real 401.
 */
export default function ServerUnreachableBanner() {
  const { authError, retryAuth } = useAuth();
  const [retrying, setRetrying] = useState(false);

  if (!authError) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryAuth();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      role="status"
      className="font-funnel z-30 flex shrink-0 items-center gap-2.5 border-b border-amber-100 bg-amber-50 px-4 py-2 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
    >
      <AlertTriangle
        size={15}
        className="shrink-0"
      />
      <p className="min-w-0 flex-1 text-[11.5px] leading-tight">
        Can&rsquo;t reach the FinSharpe server. Your session is safe — sections
        may look empty until the connection is back.
      </p>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 px-3 py-1 text-[11px] font-medium transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/30 dark:hover:bg-amber-500/15"
      >
        {retrying ? (
          <Loader2
            size={12}
            className="animate-spin motion-reduce:animate-none"
          />
        ) : (
          <RefreshCw size={12} />
        )}
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
