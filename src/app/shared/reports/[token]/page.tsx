import { SharedReportScreen } from "@/modules/pipelines";

/**
 * The public share view.
 *
 * Deliberately outside the `(main)` route group: its reader has no session, no
 * navigation and no chat, and the middleware lets `/shared/` through without a
 * refresh-token cookie. Rendering it inside the app shell would surround a
 * frozen report with a product the reader has not signed up for.
 */
export default async function SharedReportRoutePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedReportScreen token={token} />;
}
