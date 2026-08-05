/**
 * Behaviour checks for the filings-citation client (finsharpe-agents#66).
 *
 * The rules these assert are a contract with the mobile client — numbering,
 * stripping, footer deduplication, coordinate handling — not implementation
 * detail, and they are easy to break silently. This repo has no test runner, so
 * rather than add one for a single feature the two check files are bundled with
 * esbuild (already a dependency) and run under node.
 *
 *   pnpm check:citations
 */

import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHECKS = ["logic.ts", "rendering.tsx"];

const out = mkdtempSync(join(tmpdir(), "citation-checks-"));
let failed = false;

try {
  for (const check of CHECKS) {
    // CommonJS: react-dom/server reaches for node built-ins via require().
    const bundle = join(out, `${check}.cjs`);
    await build({
      entryPoints: [join(import.meta.dirname, check)],
      bundle: true,
      platform: "node",
      format: "cjs",
      jsx: "automatic",
      alias: { "@": "./src" },
      outfile: bundle,
      logLevel: "error",
    });

    console.log(`\n=== ${check}`);
    const run = spawnSync(process.execPath, [bundle], { stdio: "inherit" });
    if (run.status !== 0) failed = true;
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
