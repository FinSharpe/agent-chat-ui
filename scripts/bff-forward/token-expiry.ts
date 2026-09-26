/**
 * `isTokenExpired` decides whether the session's access token is refreshed
 * before it is sent upstream. It reads `exp` without checking the signature,
 * so a token with no numeric `exp` is expired: the backend never issues one,
 * and one made by hand must cost a refresh, not pass as a live session
 * (finsharpe-agents whole-system review of 2026-09-26, finding 1).
 */
import { eq, finish, token } from "./support/server";

import { isTokenExpired } from "@/lib/auth/server-refresh";

const now = Math.floor(Date.now() / 1000);

eq(
  isTokenExpired(token({ exp: now + 600 })),
  false,
  "ten minutes left is live",
);
eq(isTokenExpired(token({ exp: now - 60 })), true, "a past exp is expired");
eq(
  isTokenExpired(token({ exp: now + 10 })),
  true,
  "inside the 30 s skew buffer is expired",
);
eq(isTokenExpired("x.e30.y"), true, "a payload of {} (no exp) is expired");
eq(isTokenExpired(token({ sub: "u" })), true, "no exp is expired");
eq(isTokenExpired(token({ exp: 0 })), true, "exp 0 is expired");
eq(isTokenExpired(token({ exp: null })), true, "a null exp is expired");
eq(
  isTokenExpired(token({ exp: String(now + 600) })),
  true,
  "a string exp is expired",
);
eq(isTokenExpired(token(null)), true, "a null payload is expired");
eq(isTokenExpired("not-a-jwt"), true, "not three parts is expired");
eq(isTokenExpired("a.!!!.c"), true, "an unreadable payload is expired");

finish();
