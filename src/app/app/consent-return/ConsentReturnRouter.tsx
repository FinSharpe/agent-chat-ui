"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { readPendingJourney } from "@/modules/import-data/utils/aa-pending";

/**
 * Decides who a MoneyOne return belongs to.
 *
 * The backend registers ONE redirect for every consent, whatever started it
 * (finsharpe-agents `_redirect_url_for` has no platform branch), so both the
 * Android app and this web app land here. Only the browser that started a web
 * journey has the `sessionStorage` marker, so that marker — not the URL — is
 * the discriminator:
 *
 *  - marker present → a web consent: carry the params on to `/import`, where
 *    `useConsentReturn` resolves them inside the signed-in shell.
 *  - no marker → the Android App Link case. On a device with verified App
 *    Links this page never renders at all; when it does, it is the fallback
 *    that tells the user to go back to the app, which resolves the consent
 *    itself under its own JWT.
 */
export function ConsentReturnRouter({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    // Nothing to forward without the encrypted payload.
    if (!searchParams.get("ecres")) {
      setDecided(true);
      return;
    }
    if (!readPendingJourney()) {
      setDecided(true);
      return;
    }
    router.replace(`/import?${searchParams.toString()}`);
  }, [router, searchParams]);

  // Hold the fallback copy back for the instant it takes to decide, so a web
  // user never sees "return to the FinSharpe app" flash by.
  if (!decided) return null;
  return <>{children}</>;
}
