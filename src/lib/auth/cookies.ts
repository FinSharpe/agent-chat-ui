import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AuthTokenResponse, GracePeriodTokenResponse } from "@/api/generated/auth-apis/models";

const REFRESH_TOKEN_MAX_AGE = Number(process.env.REFRESH_TOKEN_MAX_AGE) || 604800;

// __Secure- prefix requires HTTPS. Derive from the actual app URL, not NODE_ENV,
// because production builds can run on localhost (HTTP) during development.
const IS_HTTPS = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false;
const FGP_COOKIE_NAME = IS_HTTPS ? "__Secure-Fgp" : "fgp";

export { FGP_COOKIE_NAME };

export function setAuthCookies(
  response: NextResponse,
  tokens: AuthTokenResponse | GracePeriodTokenResponse
): void {
  response.cookies.set("access_token", tokens.access_token, {
    httpOnly: true,
    secure: IS_HTTPS,
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });

  if ("refresh_token" in tokens && tokens.refresh_token) {
    response.cookies.set("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: IS_HTTPS,
      sameSite: "strict",
      path: "/",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  response.cookies.set(FGP_COOKIE_NAME, tokens.fingerprint, {
    httpOnly: true,
    secure: IS_HTTPS,
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  // Non-httpOnly cookie for frontend hydration — strip PII (email, institutionId)
  const userInfo = { id: tokens.user.id, name: tokens.user.name, roles: tokens.user.roles };
  response.cookies.set("user_info", JSON.stringify(userInfo), {
    httpOnly: false,
    secure: IS_HTTPS,
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  for (const name of ["access_token", "refresh_token", FGP_COOKIE_NAME, "user_info"]) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function getFingerprint(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(FGP_COOKIE_NAME)?.value ?? cookieStore.get("fgp")?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("refresh_token")?.value;
}
