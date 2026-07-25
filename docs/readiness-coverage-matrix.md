# Readiness Coverage Matrix

`testing/readiness-coverage-matrix.json` inventories every current Next.js
route and special-file surface under `app/**` without importing or invoking
application code. The inventory is sorted, unique, and bound to exact Git blobs
or worktree hashes by a self-excluding route digest.

Static evidence may reference only manifest entries classified
`SAFE_STATIC_CORE` or `SAFE_STATIC_POLICY`. Browser, route, database, network,
operational, and unproven entries can appear only as future evidence. They
never satisfy a static claim.

Coverage states are intentionally conservative:

- `STATIC_COVERED` means the bounded static claim has evidence and no recorded
  static gap; it is not live-readiness proof.
- `PARTIAL_STATIC` means some static evidence exists while a named launch gap
  remains.
- `NO_STATIC_EVIDENCE` means the surface has no approved static evidence.

Every incomplete entry is launch-blocking and carries an explicit gap code.
The matrix therefore exposes work that still needs browser, live-route,
authentication, database, or operational evidence rather than converting
absence of evidence into readiness.

Phase 30GD–30GP adds bounded static evidence and non-static browser evidence
for the shared layout and the six fabricated public routes. Those entries use
`SYNTHETIC_BROWSER_PASSED_PRODUCTION_RUNTIME_UNVERIFIED`, remain
`launch_blocking=true`, and do not represent deployed/public runtime,
authentication, Supabase, SQL, database, or operational proof.

## Blocker control plane

`testing/public-launch-blocker-registry.json` derives five exact planning
workstreams from all 69 launch-blocking entries: `7/13/3/18/28` in planning
priority order. The registry does not alter this matrix, its gap codes, or its
route digest. Every workstream remains blocked behind separate authority, and
the overall decision remains `NO_GO_PENDING_SEPARATE_AUTHORITIES`.

The seven synthetic-evidence surfaces are only the first planning candidate.
They are not production-runtime proof. Static policy, synthetic evidence, or a
Vercel `READY` deployment cannot promote an entry to launch readiness.

## Public production runtime planning

The strict planning manifest covers exactly seven source-bound surfaces and
derives their local import closures and categorical capability signals without
importing or executing application modules. Planning is complete; live
evidence remains `NOT_EXECUTED`, no public/deployed target was contacted, no
target origin was resolved, no application or browser runtime occurred, and
indirect production data access was not exercised.

All 69 matrix entries remain launch-blocking. Actual HTTP, browser,
dynamic-target, and indirect production-data-read evidence require a separate
exact Gemini authority. Form submission and mutation remain prohibited, as do
authenticated runtime, Supabase, SQL, database access, migrations, deployment
control, reactivation, publishing, and public launch.
