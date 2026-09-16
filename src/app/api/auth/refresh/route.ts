import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { clientAddressHeaders } from "@/lib/auth/client-address";

const BACKEND_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Refresh-Token": refreshToken,
      ...clientAddressHeaders(request),
    },
  });

  // Rate limited (finsharpe-agents#205): the session is still good, so its
  // cookies stay — clearing them would sign the user out over a short wait.
  if (res.status === 429) {
    return NextResponse.json(await res.json().catch(() => ({})), {
      status: 429,
      headers: { "Retry-After": res.headers.get("Retry-After") ?? "60" },
    });
  }

  if (!res.ok) {
    const response = NextResponse.json({ error: "Session expired" }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const data = await res.json();
  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    fingerprint: data.fingerprint,
    user: data.user,
  });
  return response;
}
