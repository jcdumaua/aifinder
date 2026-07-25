# Static Test Safety Contract

`testing/static-test-safety-manifest.json` is a complete, sorted, strict-JSON
inventory of every regular file in `testing/**`. It binds the Phase 30FG–30FR
repository baseline and a self-excluding digest of path, SHA-256, byte count,
and mode.

Only these execution dispositions exist:

- `RUN_CORE` for proven `SAFE_STATIC_CORE` executables;
- `RUN_POLICY` for governance-policy executables;
- `VALIDATE_ONLY` for non-executable support, fixtures, and configuration;
- `DENY` for browser, live-route, database, network, operational, or unproven
  files.

Commands are two-element JSON argv arrays beginning with `node`; shell strings,
package commands, and indirect command construction are rejected. The policy
test validates the complete filesystem inventory, duplicate keys and paths,
ordering, modes, classes, dispositions, command shape, required suites, and
recursive executable-source safety.

The core runner revalidates the manifest, launches without a shell, supplies a
minimal fixed environment, enforces per-command and total timeouts, bounds and
hashes output, and compares the complete repository state before and after
each child. Its preload denies global and module network access, child
processes, and filesystem mutation. The sandbox is defense in depth; a denied
test does not become safe merely because it would be blocked at runtime.

The Phase 30GD–30GP static accessibility/responsive assertion is policy-only.
Its browser fixtures are support-denied, its fabricated stub is
live-server-support-denied, and its isolated orchestrator is
live-route-executable-denied. Direct browser execution requires a separate
runtime authorization and cannot enter `RUN_CORE`.

The public-launch blocker registry is a `STATIC_FIXTURE` with
`VALIDATE_ONLY`; its validator is a required `SAFE_STATIC_POLICY` with
`RUN_POLICY`. The validator reads only strict repository governance data and
rejects source drift, partition drift, authority promotion, execution
authority, and no-go decision changes.

The public-production-runtime plan is a `STATIC_FIXTURE` with `VALIDATE_ONLY`;
its validator is a required `SAFE_STATIC_POLICY` with `RUN_POLICY`. The
validator performs source-only AST/import analysis and rejects source,
dependency-graph, capability, target-strategy, authority, live-evidence,
origin, and no-go boundary drift. It never imports application modules.

The complete manifest contains 97 entries: 3 `RUN_CORE`, 6 `RUN_POLICY`, 10
`VALIDATE_ONLY`, and 78 `DENY`. These classifications do not authorize target
resolution, HTTP, browser, production-data, form-submission, mutation, or any
other blocked runtime or operational capability.
