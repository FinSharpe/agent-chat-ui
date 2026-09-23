import { NextRequest, NextResponse } from "next/server";
import { isPublicPath } from "@/lib/auth/public-paths";
// The constants file, not the module barrel: middleware runs on the edge and
// must not pull in the auth screens.
import { AUTH_ROUTES } from "@/modules/auth/constants/routes";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    // No session: the Welcome screen, remembering where the visitor was going
    // so the sign-in flow can bring them back (vetted by safeReturnPath there).
    const welcome = new URL(AUTH_ROUTES.welcome, request.url);
    const query = new URLSearchParams(searchParams);
    query.delete("_rsc"); // the router's own cache-buster, not the visitor's
    const qs = query.toString();
    const wanted = qs ? `${pathname}?${qs}` : pathname;
    if (wanted !== "/") welcome.searchParams.set("next", wanted);
    return NextResponse.redirect(welcome);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
