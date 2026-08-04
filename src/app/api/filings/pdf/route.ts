import { NextRequest } from "next/server";
import {
  fetchWithRefresh,
  mergeSetCookieHeaders,
} from "@/lib/auth/server-refresh";

/**
 * Proxy for the backend's authenticated filings-PDF route
 * (`GET /api/filings/pdf`, FinSharpe/finsharpe-agents#67).
 *
 * The document URL the Filings MCP inlines on every hit is credentialed to the
 * server and returns 403 to any browser that fetches it directly, so a citation
 * chip has no way to show a source document without this hop. The backend route
 * takes the category and attachment identifier **verbatim from the citation** —
 * it performs no server-side metadata lookup, so a citation the Orchestrator has
 * just emitted cannot 404 on a stale table. (The older unauthenticated
 * `/api/pdf/{filename}` route derives them from such a lookup and is not used
 * here.)
 *
 * It exists as its own route rather than going through `/api/utilities/*`
 * because that proxy reads the upstream body as text, which mangles PDF bytes.
 * Here the body is streamed through untouched and `Range` is forwarded in both
 * directions so the viewer can page into a large annual report.
 */

const BACKEND_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";

/** Headers worth carrying back to the browser; everything else is ours to set. */
const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "content-disposition",
  "cache-control",
];

export async function GET(request: NextRequest) {
  const subcatname = request.nextUrl.searchParams.get("subcatname");
  const attachmentName = request.nextUrl.searchParams.get("attachment_name");

  if (!subcatname || !attachmentName) {
    return Response.json(
      { error: "subcatname and attachment_name are required" },
      { status: 400 },
    );
  }

  const url = new URL("/api/filings/pdf", BACKEND_URL);
  url.searchParams.set("subcatname", subcatname);
  url.searchParams.set("attachment_name", attachmentName);

  const range = request.headers.get("range");

  const { response, refreshSetCookieHeaders } = await fetchWithRefresh(
    request,
    (accessToken, fingerprint) => {
      const headers = new Headers({
        Accept: "application/pdf",
        Authorization: `Bearer ${accessToken}`,
      });
      if (fingerprint) headers.set("X-Fgp", fingerprint);
      if (range) headers.set("Range", range);
      return fetch(url, { method: "GET", headers });
    },
  );

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }

  return mergeSetCookieHeaders(
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
    refreshSetCookieHeaders,
  );
}
