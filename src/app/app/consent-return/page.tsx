import { CheckCircle2 } from "lucide-react";

/**
 * App Link return target for mobile-created MoneyOne consents
 * (finsharpe-mobile ADR-0004/0009).
 *
 * On devices where Android App Links are verified, navigation to this URL
 * never renders — the OS opens the FinSharpe app instead, passing the raw
 * encrypted return params along. This page is the fallback for browsers that
 * strip App Links (some OEM in-app browsers): the user closes the tab and the
 * app's foreground poll resolves the pending consent.
 *
 * Deliberately does NOT read or process the query params — the app resolves
 * them against the backend under its own JWT.
 */
export default function ConsentReturnPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg border p-6 text-center shadow-lg">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>

        <h1 className="text-foreground mb-2 text-xl font-semibold">
          Consent step finished
        </h1>

        <p className="text-muted-foreground mb-2">
          You can close this window and return to the FinSharpe app — it will
          pick up from here.
        </p>
      </div>
    </div>
  );
}
