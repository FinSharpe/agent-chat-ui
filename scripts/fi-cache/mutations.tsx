/**
 * The copy never holds a mutation, paused or not. The query library's default
 * dehydrates a paused mutation — any request started while the browser is
 * offline — with its arguments. Under a signed-in `user_info` cookie (an
 * earlier session's, on the sign-in page) that would put an offline
 * sign-in's email and password into IndexedDB, and an offline revoke's
 * connection record with its mobile number. With the options `QueryProvider`
 * dehydrates with, run here through its persister:
 *
 * - an offline sign-in on a page that restored that account's copy writes
 *   neither the email nor the password, nor any mutation;
 * - with no copy there, it writes nothing at all;
 * - an offline sign-up, email verification and resent code write nothing;
 * - an offline revoke writes no record of the connection;
 * - a mutation that is not paused — one that succeeded, one that failed, one
 *   in flight — is not written either;
 * - and `QueryProvider` dehydrates with exactly these options.
 */
import "./support/indexeddb";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { del } from "idb-keyval";

import { QUERY_CACHE_KEY } from "@/lib/query-persistence";
import {
  useLoginMutation,
  useRegisterMutation,
  useResendOtpMutation,
  useVerifyEmailMutation,
} from "@/modules/auth/hooks/useAuthMutations";
import { useRevokeConsent } from "@/modules/import-data/hooks/useAaMutations";
import type { ConsentRecord } from "@/modules/import-data/types/aa";
import {
  answerFetch,
  eq,
  fetchCalls,
  finish,
  heldConsents,
  installWindow,
  networkDown,
  seedCopy,
  signIn,
  startPage,
  status,
  storedConsents,
  storedKeys,
  storedMutations,
  storedValuesNaming,
} from "./support/browser";

/** The account whose session ended elsewhere, leaving its cookie here. */
const EARLIER = "user-1";
const EMAIL = "asha@example.com";
const PASSWORD = "Horse-Battery-7";
const MOBILE = "9876543210";

/** A hook's real mutation, over a page's query client. */
function mutationOf<T>(queryClient: QueryClient, useHook: () => T): T {
  let result: T | null = null;
  function Probe() {
    result = useHook();
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <Probe />
    </QueryClientProvider>,
  );
  return result!;
}

/** Whether each mutation a page holds is paused, in the order made. */
const paused = (queryClient: QueryClient) =>
  queryClient
    .getMutationCache()
    .getAll()
    .map((mutation) => mutation.state.isPaused);

const consent = (consentID: string): ConsentRecord => ({
  consentID,
  type: "EQUITIES",
  mobileNo: MOBILE,
  consentCreationData: "2026-01-01T00:00:00Z",
  consentExpiry: "2027-01-01T00:00:00Z",
  isDataReady: true,
});

(async () => {
  installWindow();

  // An earlier session's cookie and copy: the sign-in page restores it.
  signIn(EARLIER);
  await seedCopy(["consent-a"], EARLIER);
  const signInPage = await startPage();
  eq(
    heldConsents(signInPage.queryClient),
    ["consent-a"],
    "setup: the sign-in page holds the earlier session's copy",
  );

  onlineManager.setOnline(false);
  mutationOf(signInPage.queryClient, useLoginMutation).mutate({
    email: EMAIL,
    password: PASSWORD,
  });
  eq(
    paused(signInPage.queryClient),
    [true],
    "setup: a sign-in made offline is paused, holding its arguments",
  );
  await signInPage.save();
  eq(
    await storedConsents(),
    ["consent-a"],
    "offline sign-in: the page still saves (the copy it restored)",
  );
  eq(await storedMutations(), [], "offline sign-in: no mutation is written");
  eq(
    await storedValuesNaming(PASSWORD),
    [],
    "offline sign-in: the password is not in IndexedDB",
  );
  eq(await storedValuesNaming(EMAIL), [], "offline sign-in: nor the email");

  // The same browser with no copy at all.
  await del(QUERY_CACHE_KEY);
  const emptyPage = await startPage();
  mutationOf(emptyPage.queryClient, useLoginMutation).mutate({
    email: EMAIL,
    password: PASSWORD,
  });
  eq(paused(emptyPage.queryClient), [true], "setup: paused again");
  await emptyPage.save();
  eq(
    await storedKeys(),
    [],
    "offline sign-in with no copy: nothing is written at all",
  );

  // Signing up, verifying the email and asking for a new code, all offline.
  const signUpPage = await startPage();
  mutationOf(signUpPage.queryClient, useRegisterMutation).mutate({
    name: "Asha",
    email: EMAIL,
    password: PASSWORD,
  });
  mutationOf(signUpPage.queryClient, useVerifyEmailMutation).mutate({
    email: EMAIL,
    token: "123456",
  });
  mutationOf(signUpPage.queryClient, useResendOtpMutation).mutate(EMAIL);
  eq(
    paused(signUpPage.queryClient),
    [true, true, true],
    "setup: sign-up, verification and a resent code are paused",
  );
  await signUpPage.save();
  eq(
    await storedKeys(),
    [],
    "offline sign-up, verification and resent code: nothing is written",
  );

  // Revoking a connection offline, on a page holding that account's copy.
  await seedCopy(["consent-a"], EARLIER);
  const importPage = await startPage();
  mutationOf(importPage.queryClient, useRevokeConsent).mutate(
    consent("consent-a"),
  );
  eq(
    paused(importPage.queryClient),
    [true],
    "setup: an offline revoke is paused",
  );
  await importPage.save();
  eq(await storedMutations(), [], "offline revoke: no mutation is written");
  eq(
    await storedValuesNaming(MOBILE),
    [],
    "offline revoke: no record of the connection, mobile number included",
  );
  eq(fetchCalls, [], "setup: offline, no request left the browser");

  // Online: a sign-in that succeeded, one that failed, and one whose answer
  // has not come.
  onlineManager.setOnline(true);
  const onlinePage = await startPage();
  answerFetch(status(200, { user: { id: EARLIER } }));
  await mutationOf(onlinePage.queryClient, useLoginMutation).mutateAsync({
    email: EMAIL,
    password: PASSWORD,
  });
  answerFetch(networkDown);
  await mutationOf(onlinePage.queryClient, useLoginMutation)
    .mutateAsync({ email: EMAIL, password: PASSWORD })
    .catch(() => undefined);
  answerFetch(() => new Promise<Response>(() => {}));
  mutationOf(onlinePage.queryClient, useLoginMutation).mutate({
    email: EMAIL,
    password: PASSWORD,
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  eq(
    fetchCalls.slice(-3),
    Array(3).fill("POST /api/auth/login"),
    "setup: each of the three sign-ins asked the server",
  );
  eq(
    onlinePage.queryClient
      .getMutationCache()
      .getAll()
      .map(({ state }) => `${state.status}${state.isPaused ? " paused" : ""}`),
    ["success", "error", "pending"],
    "setup: succeeded, failed and in flight, none paused",
  );
  await onlinePage.save();
  eq(await storedMutations(), [], "not paused: no mutation is written either");
  eq(
    await storedValuesNaming(PASSWORD),
    [],
    "not paused: and the password is not in IndexedDB",
  );

  const provider = readFileSync(
    join(process.cwd(), "src/providers/QueryProvider.tsx"),
    "utf8",
  );
  eq(
    /dehydrateOptions:\s*COPY_DEHYDRATE_OPTIONS\b/.test(provider),
    true,
    "QueryProvider dehydrates with these options",
  );

  for (const page of [
    signInPage,
    emptyPage,
    signUpPage,
    importPage,
    onlinePage,
  ]) {
    page.queryClient.clear();
  }
  finish();
})();
