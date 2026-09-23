import { redirect } from "next/navigation";
import { isAaConsentType } from "@/modules/import-data/types/aa";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The URL the backend registers with MoneyOne for every consent, web or mobile:
 * `{MONEY_ONE_REDIRECT_ORIGIN}/moneyone/{TYPE}~{accountID}~mobile`
 * (finsharpe-agents `src/api/aa.py::_redirect_url_for`), whose origin is this
 * app. MoneyOne appends exactly three params — `ecres`, `resdate`, `fi`.
 *
 * This route no longer talks to MoneyOne. Since T-11 the backend owns the
 * credentials and the decrypt, so all this page does is carry the encrypted
 * params — plus the `type` and `accountID` that live in the slug, not in the
 * query — over to `/app/consent-return`, which decides whether the return
 * belongs to the mobile app (Android App Link) or to this browser.
 *
 * Slug shapes seen in the wild: `{type}~{accountID}~mobile` (what the backend
 * registers today), and the two-segment `{type}~{accountID}` the pre-T-11 web
 * build created. Both forward identically.
 */
export default async function MoneyOneReturnPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};

  // `~` is the delimiter because an accountID may itself contain dashes.
  const [typeSlug, accountID] = slug.split("~");

  if (!isAaConsentType(typeSlug)) {
    return <ReturnNotice message="This consent link is not valid." />;
  }

  const forwarded = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") forwarded.set(key, value);
  }
  forwarded.set("type", typeSlug);
  if (accountID) forwarded.set("accountID", accountID);

  redirect(`/app/consent-return?${forwarded.toString()}`);
}

function ReturnNotice({ message }: { message: string }) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-md rounded-lg border p-6 text-center shadow-lg">
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
