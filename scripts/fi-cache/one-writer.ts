/**
 * The persisted query cache has one writer, so one clear is enough: nothing
 * in `src/` but `lib/query-persistence.ts` may reach IndexedDB or build a
 * persister, and `QueryProvider` persists through it. A second writer would
 * keep a copy that signing out, deleting the account and revoking a
 * connection never clear. Likewise the old web build's consent records: only
 * `lib/legacy-consent-store.ts` names a `moneyone:` key, so the purge there
 * reaches every one of them.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { eq, finish } from "./support/browser";

const SRC = join(process.cwd(), "src");
const OWNER = "src/lib/query-persistence.ts";
const LEGACY_OWNER = "src/lib/legacy-consent-store.ts";
const PROVIDER = "src/providers/QueryProvider.tsx";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
  });
}

const STORAGE = [
  /["']idb-keyval["']/,
  /["']@tanstack\/query-(async|sync)-storage-persister["']/,
  /\bcreate(Async|Sync)StoragePersister\b/,
  /\bexperimental_createQueryPersister\b/,
  /\bindexedDB\b/,
];

const files = sources(SRC).map((path) => ({
  name: relative(process.cwd(), path).split("\\").join("/"),
  text: readFileSync(path, "utf8"),
}));

eq(files.length > 100, true, "the scan sees the app's sources");
eq(
  files
    .filter(({ text }) => STORAGE.some((pattern) => pattern.test(text)))
    .map(({ name }) => name),
  [OWNER],
  "only the persistence module reaches IndexedDB or builds a persister",
);
eq(
  files
    .filter(({ text }) => /<PersistQueryClientProvider\b/.test(text))
    .map(({ name }) => name),
  [PROVIDER],
  "one persisting provider",
);
eq(
  /useState\(createQueryPersister\)/.test(
    files.find(({ name }) => name === PROVIDER)?.text ?? "",
  ),
  true,
  "and it persists through the persistence module",
);

// A `moneyone:` key in a string, or in a template that builds one.
const LEGACY_KEY = [/["']moneyone:/, /`moneyone:[^`]*\$\{/];
eq(
  files
    .filter(({ text }) => LEGACY_KEY.some((pattern) => pattern.test(text)))
    .map(({ name }) => name),
  [LEGACY_OWNER],
  "only the legacy store module names an old consent record's key",
);

finish();
