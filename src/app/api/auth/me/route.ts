import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import {
  fetchWithRefresh,
  mergeSetCookieHeaders,
} from "@/lib/auth/server-refresh";

const BACKEND_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";

function authHeaders(accessToken: string, fingerprint?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (fingerprint) headers["X-Fgp"] = fingerprint;
  return headers;
}

export async function GET(request: NextRequest) {
  const { response, refreshSetCookieHeaders } = await fetchWithRefresh(
    request,
    (accessToken, fingerprint) =>
      fetch(`${BACKEND_URL}/auth/me`, {
        headers: authHeaders(accessToken, fingerprint),
      }),
  );

  const data = await response.json().catch(() => null);
  const jsonResponse = NextResponse.json(data, { status: response.status });
  return mergeSetCookieHeaders(jsonResponse, refreshSetCookieHeaders);
}

/**
 * Deletes the caller's account (finsharpe-agents `DELETE /auth/me`).
 *
 * `204` means the account is gone, so the session goes with it: the cookies
 * are cleared, and any pair refreshed on the way in is dropped rather than set.
 * Every other status reaches the backend before a row is deleted, so the
 * session is left as it was and the caller can retry.
 */
export async function DELETE(request: NextRequest) {
  const { response, refreshSetCookieHeaders } = await fetchWithRefresh(
    request,
    (accessToken, fingerprint) =>
      fetch(`${BACKEND_URL}/auth/me`, {
        method: "DELETE",
        headers: authHeaders(accessToken, fingerprint),
      }),
  );

  if (response.status === 204) {
    const deleted = new NextResponse(null, { status: 204 });
    clearAuthCookies(deleted);
    return deleted;
  }

  const data = await response.json().catch(() => null);
  const jsonResponse = NextResponse.json(data, { status: response.status });
  return mergeSetCookieHeaders(jsonResponse, refreshSetCookieHeaders);
}
