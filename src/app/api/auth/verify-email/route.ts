import { NextRequest, NextResponse } from "next/server";
import { validateOrigin } from "@/lib/auth/origin";
import { clientAddressHeaders } from "@/lib/auth/client-address";
import { setAuthCookies } from "@/lib/auth/cookies";

const BACKEND_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";

export async function POST(request: NextRequest) {
  try {
    validateOrigin(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const res = await fetch(`${BACKEND_URL}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...clientAddressHeaders(request),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, data);
  return response;
}
