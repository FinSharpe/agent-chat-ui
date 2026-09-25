/**
 * The persisted query cache has one writer, so one clear is enough: nothing
 * in `src/` but `lib/query-persistence.ts` may reach IndexedDB or build a
 * persister, and `QueryProvider` persists through it. A second writer would
 * keep a copy that signing out and deleting the account never clear.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { eq, finish } from "./support/browser";

const SRC = join(process.cwd(), "src");
const OWNER = "src/lib/query-persistence.ts";
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

finish();
