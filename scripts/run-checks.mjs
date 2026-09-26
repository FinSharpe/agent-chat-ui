/**
 * Behaviour checks for client contracts that are easy to break silently —
 * rules shared with the mobile client or the agents, not implementation detail.
 *
 * This repo has no test runner, so rather than add one, each check file under
 * `scripts/<suite>/` is bundled with esbuild (already a dependency) and run
 * under node. A check prints its cases and exits non-zero on any failure.
 *
 *   pnpm check                      every suite
 *   pnpm check:chat-errors          a run's error by its class name (agents#282)
 *   pnpm check:chat-handoffs        Import hand-offs send the request (#85)
 *   pnpm check:citations            filings citations (finsharpe-agents#66)
 *   pnpm check:credits              Balance, History, the quote (agents#280)
 *                                   and credits in chat (agents#282)
 *   pnpm check:day-move             the net-worth card's day move, after mobile
 *   pnpm check:fi-cache             sign-out, deletion, revoke clear the FI copy (agents#283)
 *   pnpm check:portfolio-connect    the chat's connect card (#79)
 *   pnpm check:smart-alerts         Import Smart Alerts by class (#86)
 *   pnpm check:tool-activity        chat tool rows, after finsharpe-mobile
 */

import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SUITES = [
  "chat-errors",
  "chat-handoffs",
  "citations",
  "credits",
  "day-move",
  "fi-cache",
  "model-pin",
  "portfolio-connect",
  "smart-alerts",
  "tool-activity",
];

const requested = process.argv.slice(2);
const unknown = requested.filter((suite) => !SUITES.includes(suite));
if (unknown.length > 0) {
  console.error(`Unknown suite(s): ${unknown.join(", ")}`);
  process.exit(2);
}
const suites = requested.length > 0 ? requested : SUITES;

const out = mkdtempSync(join(tmpdir(), "client-checks-"));
let failed = false;

try {
  for (const suite of suites) {
    const dir = join(import.meta.dirname, suite);
    const checks = readdirSync(dir).filter((file) => /\.tsx?$/.test(file));
    for (const check of checks) {
      // CommonJS: react-dom/server reaches for node built-ins via require().
      const bundle = join(out, `${suite}-${check}.cjs`);
      await build({
        entryPoints: [join(dir, check)],
        bundle: true,
        platform: "node",
        format: "cjs",
        jsx: "automatic",
        alias: { "@": "./src" },
        // Stylesheets have no behaviour: a check that renders the chat
        // transcript reaches the markdown renderer's KaTeX CSS and its fonts.
        loader: { ".css": "empty" },
        outfile: bundle,
        logLevel: "error",
      });

      console.log(`\n=== ${suite}/${check}`);
      const run = spawnSync(process.execPath, [bundle], { stdio: "inherit" });
      if (run.status !== 0) failed = true;
    }
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
