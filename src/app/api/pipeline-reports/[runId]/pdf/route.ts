import { NextRequest } from "next/server";
import {
  fetchWithRefresh,
  mergeSetCookieHeaders,
} from "@/lib/auth/server-refresh";

/**
 * Proxy for the backend's authenticated pipeline-report PDF
 * (`GET /api/pipeline-reports/{run_id}/pdf`).
 *
 * Its own route rather than `/api/utilities/*` for the same reason the filings
 * PDF has one: that proxy reads the upstream body as text, which mangles PDF
 * bytes, and it drops `Content-Disposition`, which is the filename the server
 * chose. Here the body streams through untouched.
 *
 * The gate is the backend's: only a purchaser of the Run gets the document,
 * and a 404 for everyone else. The public share link has its own route
 * (`/api/shared/...`) and is deliberately not authed.
 */

const BACKEND_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";

const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-disposition",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const url = new URL(
    `/api/pipeline-reports/${encodeURIComponent(runId)}/pdf`,
    BACKEND_URL,
  );

  const { response, refreshSetCookieHeaders } = await fetchWithRefresh(
    request,
    (accessToken, fingerprint) => {
      const headers = new Headers({
        Accept: "application/pdf",
        Authorization: `Bearer ${accessToken}`,
      });
      if (fingerprint) headers.set("X-Fgp", fingerprint);
      return fetch(url, { method: "GET", headers });
    },
  );

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  // The document is frozen, but entitlement is not — never let a cache serve
  // it to a later visitor who no longer holds the purchase.
  headers.set("Cache-Control", "private, no-store");

  return mergeSetCookieHeaders(
    new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
    refreshSetCookieHeaders,
  );
}
