# Phase 25IT — Batch C Controlled Runtime Validation Preflight Gate

## Phase identity

- Phase: `25IT`
- Batch: `C — Controlled Runtime Validation`
- Stage: preflight review only
- Approved predecessor phase: `25IS`
- Approved predecessor commit: `a34128aa7424531829a6cc1e16c4177e48f4a736`
- Manifest source baseline: `25df6000c66edc0a773facb98ea917d3e5f0f316`
- Approved manifest SHA-256: `cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c`
- Selected entry count: `2`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25IT prepares the exact fail-closed preflight for controlled runtime validation.

This artifact does not start a server, invoke a route, access a live database, create a runtime manifest file, execute the Phase 25FD harness, mutate data, publish, deploy, or launch.

The execution stage remains unavailable until:

1. Gemini approves this exact preflight package;
2. the user provides the exact explicit runtime authorization recorded below;
3. all credential and environment preconditions are value-hidden and satisfied;
4. the repository, manifest, route files, and fingerprints remain unchanged.

## Immutable manifest verification

- Phase 25IS artifact: `docs/discovery-phase-25is-batch-c-controlled-runtime-validation-static-authorization-package-gate.md`
- Manifest SHA-256: `cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c`
- Manifest baseline: `25df6000c66edc0a773facb98ea917d3e5f0f316`
- Current preflight baseline: `a34128aa7424531829a6cc1e16c4177e48f4a736`
- Files changed between those baselines: exactly `docs/discovery-phase-25is-batch-c-controlled-runtime-validation-static-authorization-package-gate.md`
- Selected routes changed after manifest derivation: no
- Selected route methods: exactly GET
- Runtime manifest file created: no
- Runtime execution performed: no

## Selected entries

| Entry | Route | Auth precondition | Dependency count | Entry SHA-256 | Route blob unchanged | Credential-free eligible |
|---|---|---|---:|---|---:|---:|
| `C01` | `/api/homepage-control/published` (`app/api/homepage-control/published/route.ts`) | `PUBLIC_NO_SESSION_REQUIRED` | 1 | `d476123b943000a9c5cf1a6be9f8a4740a594209eb2f4528c893762b46640754` | yes | yes |
| `C02` | `/api/admin/session` (`app/api/admin/session/route.ts`) | `ADMIN_SESSION_REQUIRED` | 1 | `1142274f39f45d8983911dc04073f43ab22c3109edd1e256cb1513e1e7e1d410` | yes | no |

## Authentication preflight

- C02 requires `ADMIN_SESSION_REQUIRED` and needs a separately approved value-hidden authentication mechanism.

Authentication values, cookies, tokens, authorization headers, and session contents must never be printed.

## Package-script preflight

Relevant package script names present:

- `build`
- `check`
- `dev`
- `start`

Local execution requires an approved development or start command bound only to `127.0.0.1` on a dedicated non-default port.

Preflight development-script availability:

`PASS`

## Planned local execution boundary

A future execution script may perform only these actions:

1. verify exact repository commit `a34128aa7424531829a6cc1e16c4177e48f4a736`;
2. verify clean synchronized `main`;
3. verify Phase 25IS manifest SHA-256 `cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c`;
4. verify both route files and fingerprints;
5. check required environment identifiers as `present` or `missing` without values;
6. start one local server bound to `127.0.0.1` on port `3117`;
7. wait for local readiness with a strict timeout;
8. issue one GET request per approved entry, in manifest order;
9. prohibit request bodies, retries, redirects to non-local targets, and non-GET methods;
10. record only status code, response byte count, duration, content type, and SHA-256;
11. scan response bytes for secret-like patterns without printing matching content;
12. stop on the first failed precondition or unexpected result;
13. terminate the local server;
14. verify the repository remains unchanged;
15. produce a result artifact for Gemini review before commit or push.

## Output and timeout limits

- Server startup timeout: `60 seconds`
- Per-request connect timeout: `5 seconds`
- Per-request total timeout: `20 seconds`
- Maximum response body retained temporarily: `1 MiB`
- Retry count: `0`
- Redirect policy: local-only; cross-origin redirects prohibited
- Output policy: metadata and hashes only; response bodies are not printed
- Failure policy: stop on first failure

## Database and mutation boundary

No write is authorized.

The future execution must fail if static or runtime evidence indicates:

- POST, PUT, PATCH, DELETE, RPC, insert, update, upsert, delete, remove, DDL, or other mutation behavior;
- unexpected audit-row or timestamp mutation;
- unapproved database endpoint or credential use;
- inability to establish read-only behavior.

Database row contents must not be printed.

## Before-and-after proof

The future execution must capture:

- exact `HEAD` and `origin/main`;
- clean Git status before and after;
- selected route blob IDs before and after;
- package and lockfile hashes before and after;
- Phase 25FD harness hash before and after;
- runtime-generated path cleanup status;
- local server termination status.

Any mismatch causes a failed result and preserves operational state as `BLOCKED`.

## Stop conditions

Execution must not begin or must stop immediately on:

- baseline, manifest, route, dependency, or fingerprint mismatch;
- dirty working tree;
- missing development/start command;
- missing required environment identifier;
- unresolved authentication mechanism;
- non-local bind or redirect;
- unapproved method, route, dependency, or network target;
- secret-like output;
- timeout, response overflow, retry loop, or indeterminate result;
- repository, source, package, lockfile, schema, migration, generated-type, deployment, database, audit, or publishing mutation;
- inability to terminate the local server cleanly.

## Explicit human runtime authorization

The required authorization statement is:

> I explicitly authorize Phase 25IT to start a local AiFinder server and invoke only the two approved GET routes bound to manifest SHA-256 cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c for controlled read-only runtime validation. I do not authorize database writes, mutations, cleanup, publishing, deployment, candidate decisions, secret output, environment-value output, or public launch.

Current authorization state:

`NOT_YET_RECORDED_FOR_RUNTIME_EXECUTION`

The earlier approval to use batch phases does not substitute for this execution-specific authorization.

## Preflight decision

Preflight state:

`PREFLIGHT_REVIEWABLE_WITH_EXECUTION_BLOCKERS`

Gemini preflight approval:

`PENDING`

Runtime execution:

`NOT_EXECUTED`

Batch D authorization:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Authorized actions

At this stage, Phase 25IT authorizes only:

- creation of this single preflight artifact;
- static verification of the committed manifest and selected routes;
- non-mutating project checks;
- Gemini preflight review packaging.

## Prohibited actions

This stage prohibits:

- local server startup;
- route invocation;
- live database access;
- runtime manifest creation or population;
- harness execution;
- mutation, cleanup, publishing, deployment, candidate decisions, or launch;
- source, API, UI, schema, migration, generated-type, package, or lockfile changes;
- secret, credential, cookie, token, session, environment-value, or database-row output;
- commit or push before execution results receive Gemini review.

## Gemini senior-review questions

Gemini should approve this preflight only if all answers are affirmative:

1. Is Phase 25IT anchored to exact Phase 25IS commit `a34128aa7424531829a6cc1e16c4177e48f4a736`?
2. Does it preserve manifest SHA-256 `cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c` and exactly two GET entries?
3. Are the selected route blobs unchanged from manifest baseline `25df6000c66edc0a773facb98ea917d3e5f0f316`?
4. Is execution still absent?
5. Are authentication requirements explicit and value-hidden?
6. Is local execution restricted to `127.0.0.1:3117`?
7. Are request count, methods, timeouts, output limits, redirects, and retries bounded?
8. Are response bodies excluded from printed output?
9. Are secret scanning, before/after proof, server termination, and stop conditions fail-closed?
10. Is the explicit human runtime authorization still required?
11. Are database writes, mutation, cleanup, publishing, deployment, Batch D, operational reactivation, and launch still unauthorized?
12. Does operational reactivation remain `BLOCKED`?

## Conditional execution stage

Only after Gemini approves this preflight and the user provides the exact execution-specific authorization statement may an execution script be generated.

That execution script must remain bound to commit `a34128aa7424531829a6cc1e16c4177e48f4a736`, manifest SHA-256 `cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c`, and the two entries recorded above.
