import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ConsentReturnRouter } from "./ConsentReturnRouter";

/**
 * Return target for every MoneyOne consent — the backend registers a single
 * redirect origin for web and mobile alike (finsharpe-agents
 * `src/api/aa.py::_redirect_url_for`), and `/moneyone/[slug]` forwards here.
 *
 * `ConsentReturnRouter` sends a web journey on to `/import`. What is left is
 * the Android App Link case: on devices where App Links are verified this URL
 * never renders — the OS opens the FinSharpe app with the raw params instead.
 * This copy is the fallback for browsers that strip App Links (some OEM in-app
 * browsers): the user closes the tab and the app's foreground poll resolves the
 * pending consent under its own JWT.
 *
 * A web user whose session is on another origin lands here too, so the
 * fallback also offers to finish in this browser: `/import` with the same
 * params, which sends a signed-out visitor through sign-in and back.
 *
 * Deliberately does NOT process the params server-side — resolving them is the
 * job of whichever client owns the journey.
 */
export default async function ConsentReturnPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = (await searchParams) ?? {};
  const forwarded = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") forwarded.set(key, value);
  }
  const continueHref = forwarded.has("ecres")
    ? `/import?${forwarded.toString()}`
    : null;

  return (
    <Suspense fallback={null}>
      <ConsentReturnRouter>
        <div className="bg-background flex min-h-screen items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-lg border p-6 text-center shadow-lg">
            <div className="mb-4 flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>

            <h1 className="text-foreground mb-2 text-xl font-semibold">
              Consent step finished
            </h1>

            <p className="text-muted-foreground mb-2">
              You can close this window and return to the FinSharpe app — it
              will pick up from here.
            </p>

            {continueHref && (
              <Link
                href={continueHref}
                className="text-primary mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
              >
                Started on the web? Continue in this browser
              </Link>
            )}
          </div>
        </div>
      </ConsentReturnRouter>
    </Suspense>
  );
}
