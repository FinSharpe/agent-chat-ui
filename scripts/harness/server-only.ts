/**
 * What `server-only` resolves to in a check. A check runs under node, which is
 * the server, so the marker has nothing to refuse: this is what Next resolves
 * it to in a server bundle (the package's `react-server` export, an empty
 * module). Without it a check could not import a route handler or anything
 * under `src/lib/auth/` that calls the backend.
 *
 * Not a check itself: `scripts/run-checks.mjs` only runs files under a suite.
 */
export {};
