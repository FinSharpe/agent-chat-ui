/**
 * The copy belongs to the account that wrote it. A session that ends
 * somewhere else — the account deleted in the mobile app, say — leaves this
 * browser's `user_info` cookie in place, so the next page to start here, the
 * sign-in page included, still reads as that account. When someone else signs
 * in on this browser before that cookie expires — another person, or a new
 * account made after the deletion — the first account's copy is neither
 * loaded nor written back under their session:
 *
 * - a page that starts with another account signed in removes the copy
 *   instead of loading it;
 * - one that starts with the same account loads it and writes it back, as
 *   before;
 * - a copy that names no account — every copy written before copies named
 *   one — is removed whoever is signed in, and so is any copy when the
 *   cookie names no account;
 * - the sign-in page, which loaded the first account's copy under the old
 *   cookie, writes none of it once someone else signs in in that same tab:
 *   it removes that copy, and leaves the new account's own copy alone.
 *
 * Each `startPage()` is a new page, with a persister of its own.
 */
import "./support/indexeddb";

import {
  appPersistence,
  eq,
  finish,
  heldConsents,
  installWindow,
  seedCopy,
  signIn,
  signInWithoutAccount,
  startPage,
  storedConsents,
  storedKeys,
  storedOwner,
} from "./support/browser";

/** The account whose session ended elsewhere, and whoever signs in next. */
const FIRST = "user-1";
const NEXT = "user-2";

(async () => {
  installWindow();

  // The first account uses the web app here, and its page writes the copy.
  signIn(FIRST);
  const used = appPersistence(["consent-a"]);
  await used.save();
  eq(await storedConsents(), ["consent-a"], "setup: a copy is kept");
  eq(await storedOwner(), FIRST, "a copy names the account that wrote it");

  // The account is deleted in the mobile app: nothing reaches this browser,
  // and its cookie stays. Within 7 days the sign-in page opens here.
  const signInPage = await startPage();
  eq(
    heldConsents(signInPage.queryClient),
    ["consent-a"],
    "same cookie: the sign-in page loads the copy",
  );

  // Someone else signs in on that page, in that tab.
  signIn(NEXT);
  await signInPage.save();
  eq(
    await storedKeys(),
    [],
    "another account signs in in the same tab: the page writes none of the first account's data back, and its copy is removed",
  );

  // The new account's own copy, as another of its pages would write it.
  await seedCopy(["consent-next"], NEXT);
  await signInPage.save();
  eq(
    await storedConsents(),
    ["consent-next"],
    "and that page leaves the new account's own copy as it is",
  );
  eq(await storedOwner(), NEXT, "still named for the new account");

  // The first account's copy is still there when the new account's next
  // page starts: the sign-in page left before it saved.
  await seedCopy(["consent-a"], FIRST);
  const nextPage = await startPage();
  eq(
    heldConsents(nextPage.queryClient),
    [],
    "another account signed in: a page start does not load the first account's copy",
  );
  eq(await storedKeys(), [], "and removes it");

  // The same account, signed in again before the cookie expired.
  signIn(FIRST);
  await seedCopy(["consent-b"], FIRST);
  const samePage = await startPage();
  eq(
    heldConsents(samePage.queryClient),
    ["consent-b"],
    "the same account: a page start loads its copy",
  );
  eq(await storedConsents(), ["consent-b"], "the same account: it is kept");
  await samePage.save();
  eq(
    await storedConsents(),
    ["consent-b"],
    "the same account: and written back",
  );
  eq(await storedOwner(), FIRST, "for that account");

  // A copy an earlier build wrote, which names no account.
  await seedCopy(["consent-c"], null);
  const legacyPage = await startPage();
  eq(
    heldConsents(legacyPage.queryClient),
    [],
    "a copy naming no account: not loaded, even by the account signed in",
  );
  eq(await storedKeys(), [], "a copy naming no account: removed");

  // A readable cookie that names no account.
  signInWithoutAccount();
  await seedCopy(["consent-d"], FIRST);
  const anonymousPage = await startPage();
  eq(
    heldConsents(anonymousPage.queryClient),
    [],
    "a cookie naming no account: the copy is not loaded",
  );
  eq(await storedKeys(), [], "a cookie naming no account: and is removed");

  for (const page of [used, signInPage, nextPage, samePage, legacyPage]) {
    page.queryClient.clear();
  }
  anonymousPage.queryClient.clear();
  finish();
})();
