import { NextRequest, NextResponse } from "next/server";

/**
 * Public proxy for the share routes (`GET /api/shared/reports/{token}` and
 * `.../pdf` on the agents backend).
 *
 * Deliberately unauthenticated, mirroring the backend decision: a share link
 * serves a frozen report to whoever holds the token, and revocation is the
 * owner's kill switch. The authed `/api/utilities` proxy would turn every
 * public link into a 401, so these routes get their own handler rather than
 * an exception inside that one — the openness is visible here, not implied.
 *
 * Only GET is exposed. Nothing behind this path mutates anything except the
 * backend's own view counter.
 */

export const runtime = "edge";

async function handleRequest(request: NextRequest, slug: string[]) {
  const backendUrl = process.env.LANGGRAPH_API_URL;
  const apiKey = process.env.LANGSMITH_API_KEY;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Backend API URL not configured" },
      { status: 500 },
    );
  }

  const url = new URL(
    `${backendUrl.replace(/\/$/, "")}/api/shared/${slug.join("/")}`,
  );

  try {
    const headers: Record<string, string> = { Accept: "*/*" };
    if (apiKey) headers["apiKey"] = apiKey;

    const response = await fetch(url.toString(), { method: "GET", headers });

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
        // A revoked token must stop working immediately; never let a CDN or
        // the browser keep serving a report the owner has just killed.
        "Cache-Control": "no-store",
        ...(response.headers.get("Content-Disposition")
          ? {
              "Content-Disposition": response.headers.get(
                "Content-Disposition",
              )!,
            }
          : {}),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected exception";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ _slug: string[] }> },
) {
  const { _slug } = await params;
  return handleRequest(request, _slug);
}
