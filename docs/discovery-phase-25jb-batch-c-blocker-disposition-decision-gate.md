# Phase 25JB — Batch C Blocker Disposition Decision Gate

## Phase identity

- Phase: `25JB`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static blocker-disposition decision
- Approved predecessor phase: `25JA`
- Approved predecessor commit: `07369806b28d7edaa519b760e1660815b1776957`
- Phase 25JA artifact SHA-256: `61af4e1ff309a17513f5c1b49648dc6674a5d77682e3f07b6eeb4a2058e39d2c`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JB selects the safe governance path after Phase 25JA closed the current runtime-validation cycle as `CLOSED_AS_FAIL_CLOSED_INCOMPLETE`.

This phase is static only. It does not start a server, build the application, invoke a route, inspect raw logs, access a live database or external service, inspect environment values, execute the Phase 25FD harness, modify source code, mutate data, publish, deploy, decide candidates, begin Batch D, or launch.

## Static predecessor verification

| Static invariant | State | Evidence |
|---|---|---|
| `baseline-head` | `PASS` | HEAD matches the approved Phase 25JA commit. |
| `baseline-origin` | `PASS` | origin/main matches the approved Phase 25JA commit. |
| `25JA-artifact-present` | `PASS` | Phase 25JA artifact is present. |
| `25JA-artifact-sha` | `PASS` | Phase 25JA artifact SHA-256 matches the approved record. |
| `25JA-current-commit-identity` | `PASS` | Phase 25JA artifact is unchanged at the current baseline. |
| `25IZ-artifact-present` | `PASS` | Phase 25IZ artifact is present. |
| `25IZ-artifact-sha` | `PASS` | Phase 25IZ artifact SHA-256 matches the approved record. |
| `25IZ-current-commit-identity` | `PASS` | Phase 25IZ artifact is unchanged at the current baseline. |
| `phase25ja-decision-markers` | `PASS` | Phase 25JA closure, authorization, path-option, and block markers are preserved. |
| `manifest-preserved` | `PASS` | Reduced public-only manifest identity is preserved. |

## Decision criteria

The selected path must:

1. preserve the two distinct fail-closed outcomes without forcing a pass;
2. avoid inferring a root cause from `EXIT_1`, a connection closure, or output hashes;
3. produce a deterministic validation boundary before another application request is contemplated;
4. prevent reuse of both consumed authorization statements;
5. keep C02 and authenticated execution outside scope;
6. require new review and a fresh authorization before any runtime activity;
7. avoid source-code modifications solely to make validation succeed;
8. keep operational reactivation and Batch D blocked.

## Path assessment

### Path A — Close runtime validation as deferred

**Disposition:** not selected.

Path A is safe but leaves the runtime blocker unresolved. It is appropriate only if the project accepts indefinite deferral and continued operational blockage.

### Path B — Bounded diagnostic evidence planning

**Disposition:** not selected as the immediate next path.

Path B could provide additional evidence, but inspecting or reproducing diagnostic output before establishing a deterministic environment risks collecting another environment-dependent failure without improving the validation boundary.

Path B remains available later if the redesigned environment fails closed and a separately reviewed diagnostic plan becomes necessary.

### Path C — Redesigned validation environment

**Disposition:** `SELECTED_FOR_STATIC_DESIGN_ONLY`

Path C best addresses the evidence from Phases 25IW and 25IZ because two different failure modes occurred under the same development-server validation approach.

The selection does not assert that the development server caused either failure. It establishes only that the current validation boundary did not produce deterministic evidence sufficient for successful controlled runtime validation.

## Selected direction

Phase 25JB selects:

`PATH_C_REDESIGNED_VALIDATION_ENVIRONMENT`

This is a governance and architecture decision only.

No redesigned environment is implemented, built, started, or authorized by Phase 25JB.

## Required design principles

The future redesigned validation environment must be defined around these principles:

### 1. Exact immutable source identity

- Bind to one reviewed commit.
- Preserve the reduced public-only C01 manifest identity.
- Recompute all required dependency, lockfile, package, and framework fingerprints.
- Stop if the repository or dependency identity differs.

### 2. Isolated disposable workspace

- Use a temporary checkout or archive of the exact reviewed commit.
- Keep generated build output outside the working repository.
- Do not modify tracked repository files.
- Delete temporary build and runtime material after evidence collection.
- Prove the original working tree remains unchanged.

### 3. Deterministic production-mode candidate

The static design should evaluate a production-mode local boundary using the repository's existing build and start commands, rather than automatically reusing the development-server path.

The likely candidate sequence for later review is:

1. verify exact repository and dependency identities;
2. create an isolated disposable checkout;
3. provide only required environment identifiers without printing values;
4. run the existing project checks;
5. perform one bounded local production build;
6. start the built application bound only to `127.0.0.1`;
7. require source-grounded readiness, process, listener, and stabilization evidence;
8. invoke exactly one approved C01 GET only after readiness succeeds;
9. capture metadata-only result evidence;
10. terminate the process and prove repository preservation.

This sequence is a design candidate, not an authorization.

### 4. No validation-only application changes

The design must not add:

- heartbeat routes;
- test-only authentication bypasses;
- special database bypasses;
- hidden retry behavior;
- synthetic success responses;
- source changes whose purpose is merely to satisfy the validation gate.

### 5. Bounded build and startup evidence

A future plan must define:

- build timeout;
- startup timeout;
- output-byte limits;
- secret and credential scanning;
- metadata-only build and server result fields;
- process-tree ownership;
- exact listener binding;
- stable readiness interval;
- deterministic shutdown;
- cleanup verification;
- failure codes for every stop condition.

### 6. Network boundary

A future execution design must separately define:

- whether package installation is prohibited or required;
- whether the build may initiate external network calls;
- whether the application route may perform its statically reviewed read-only database behavior;
- how any unexpected network destination causes fail-closed termination.

Phase 25JB authorizes none of these network activities.

### 7. Fresh authorization chain

Any future runtime execution requires:

1. a completed static architecture phase;
2. a completed static implementation or harness plan;
3. a completed static preflight bound to the then-current commit;
4. Gemini approval;
5. a fresh exact human authorization with a unique SHA-256;
6. a one-attempt, fail-closed execution gate.

The Phase 25IW and Phase 25IZ authorization statements remain `CONSUMED_AND_NOT_REUSABLE`.

## Blocker disposition

Current Batch C runtime blocker:

`REQUIRES_REDESIGNED_DETERMINISTIC_VALIDATION_ENVIRONMENT`

Current development-server execution cycle:

`CLOSED_AND_NOT_TO_BE_RETRIED`

Successful C01 runtime validation:

`NOT_ACHIEVED`

Path B diagnostic evidence:

`DEFERRED_UNLESS_REQUIRED_AFTER_REDESIGN`

Further runtime execution:

`NOT_AUTHORIZED`

## Safe successor

The safe successor is:

**Phase 25JC — Redesigned Deterministic Validation Environment Architecture Gate**

Phase 25JC may define, compare, and select the exact production-mode or alternative local validation architecture.

Phase 25JC must remain static and documentation-only. It must not:

- build or start the application;
- invoke C01 or C02;
- inspect raw logs;
- access a live database;
- inspect environment values;
- modify source code;
- install packages;
- authorize execution;
- begin Batch D;
- authorize operational reactivation or public launch.

## Phase decision

Selected path:

`PATH_C_REDESIGNED_VALIDATION_ENVIRONMENT`

Selection scope:

`STATIC_DESIGN_ONLY`

Current execution cycle:

`CLOSED_AS_FAIL_CLOSED_INCOMPLETE`

Successful runtime validation:

`NOT_ACHIEVED`

Future runtime execution:

`NOT_AUTHORIZED`

Authenticated C02:

`NOT_AUTHORIZED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Gemini senior-review questions

Gemini should approve Phase 25JB only if all answers are affirmative:

1. Is Phase 25JB anchored to exact Phase 25JA commit `07369806b28d7edaa519b760e1660815b1776957`?
2. Is the approved Phase 25JA artifact identity preserved?
3. Does the decision preserve both fail-closed outcomes without inferring a root cause?
4. Is Path C selected only for static architecture and design?
5. Is Path A correctly left available as a future deferral option?
6. Is Path B correctly deferred rather than permanently prohibited?
7. Does the future design focus on deterministic environment boundaries rather than forcing a pass?
8. Does the production-mode sequence remain only a candidate for future static review?
9. Are validation-only source changes and bypasses prohibited?
10. Are package installation, build network behavior, runtime network behavior, and database access left unauthorized pending explicit design?
11. Are both prior authorizations preserved as consumed and non-reusable?
12. Is Phase 25JC limited to a static architecture gate?
13. Are further runtime execution, C02, Batch D, operational reactivation, and public launch unauthorized?
14. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C current runtime cycle: 100% closed as fail-closed incomplete
- Phase 25JB blocker disposition: 100%
- Selected path: Path C — redesigned deterministic validation environment
- Phase 25JB Gemini review: pending
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
