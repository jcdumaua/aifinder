# Phase 25IV — Corrected Public-Only Controlled Runtime Validation Preflight Gate

## Phase identity

- Phase: `25IV`
- Batch: `C — Controlled Runtime Validation`
- Stage: corrected preflight review only
- Approved predecessor phase: `25IU`
- Approved Phase 25IU commit: `392e017d2e0fc9ee8aa348553f6ba8cd5bb3446b`
- Reduced-manifest governance baseline: `c163aa827280bf0f113c935bd00f340e88afeb4a`
- Source manifest baseline: `25df6000c66edc0a773facb98ea917d3e5f0f316`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Approved execution candidate count: `1`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25IV prepares the corrected fail-closed preflight for one credential-free public GET route.

This artifact does not start a server, invoke a route, access a live database or external service, create a runtime manifest file, execute the Phase 25FD harness, inspect environment values, mutate data, publish, deploy, decide candidates, or launch.

## Corrected candidate identity

- Entry: `C01`
- Route: `/api/homepage-control/published`
- Route file: `app/api/homepage-control/published/route.ts`
- Method: `GET`
- Authentication class: `PUBLIC_NO_SESSION_REQUIRED`
- Corrected dependency count: `15`
- Corrected entry SHA-256: `92866e677beda429a3d1687746c8142ede91ad5c165c60f3925017acb30aa762`
- Reduced manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`

Authenticated `C02` remains:

`AUTHENTICATED_ROUTE_EXCLUDED_PENDING_SEPARATE_AUTH_DESIGN`

## Static preflight invariants

| Preflight invariant | State | Evidence |
|---|---|---|
| `phase25iu-predecessor-baseline-marker` | `PASS` | Committed Phase 25IU records the exact Phase 25IT predecessor baseline. |
| `phase25iu-commit-contains-artifact` | `PASS` | The current Phase 25IU commit contains the exact approved recovery artifact. |
| `reduced-manifest-marker` | `PASS` | Committed Phase 25IU records the exact reduced public-only manifest SHA-256. |
| `runtime-remains-unexecuted` | `PASS` | Committed Phase 25IU records no runtime execution. |
| `operational-state-blocked` | `PASS` | Committed Phase 25IU preserves operational reactivation as BLOCKED. |
| `single-public-candidate` | `PASS` | Parsed 1 reduced public-only candidate row(s); expected 1. |
| `single-authenticated-exclusion` | `PASS` | Parsed 1 authenticated exclusion row(s); expected 1. |
| `public-entry-is-c01` | `PASS` | The reduced public-only candidate is C01. |
| `public-entry-auth-class` | `PASS` | C01 is credential-free and requires no session material. |
| `public-entry-dependency-count` | `PASS` | C01 has exactly 15 corrected dependencies. |
| `authenticated-entry-is-c02` | `PASS` | C02 is the separately classified authenticated candidate. |
| `authenticated-entry-remains-excluded` | `PASS` | C02 remains excluded pending a separately reviewed authentication design. |
| `c01-dependency-table-count` | `PASS` | Parsed 15 C01 dependency fingerprint row(s); expected 15. |
| `dependency-exists:app/api/homepage-control/published/route.ts` | `PASS` | Dependency exists at source baseline: app/api/homepage-control/published/route.ts. |
| `dependency-sha:app/api/homepage-control/published/route.ts` | `PASS` | Dependency fingerprint matches source baseline: app/api/homepage-control/published/route.ts. |
| `dependency-unchanged:app/api/homepage-control/published/route.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: app/api/homepage-control/published/route.ts. |
| `dependency-exists:app/data/tools.ts` | `PASS` | Dependency exists at source baseline: app/data/tools.ts. |
| `dependency-sha:app/data/tools.ts` | `PASS` | Dependency fingerprint matches source baseline: app/data/tools.ts. |
| `dependency-unchanged:app/data/tools.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: app/data/tools.ts. |
| `dependency-exists:components/public/tool-card.tsx` | `PASS` | Dependency exists at source baseline: components/public/tool-card.tsx. |
| `dependency-sha:components/public/tool-card.tsx` | `PASS` | Dependency fingerprint matches source baseline: components/public/tool-card.tsx. |
| `dependency-unchanged:components/public/tool-card.tsx` | `PASS` | Dependency remains unchanged through Phase 25IU: components/public/tool-card.tsx. |
| `dependency-exists:components/ui/badge.tsx` | `PASS` | Dependency exists at source baseline: components/ui/badge.tsx. |
| `dependency-sha:components/ui/badge.tsx` | `PASS` | Dependency fingerprint matches source baseline: components/ui/badge.tsx. |
| `dependency-unchanged:components/ui/badge.tsx` | `PASS` | Dependency remains unchanged through Phase 25IU: components/ui/badge.tsx. |
| `dependency-exists:components/ui/button.tsx` | `PASS` | Dependency exists at source baseline: components/ui/button.tsx. |
| `dependency-sha:components/ui/button.tsx` | `PASS` | Dependency fingerprint matches source baseline: components/ui/button.tsx. |
| `dependency-unchanged:components/ui/button.tsx` | `PASS` | Dependency remains unchanged through Phase 25IU: components/ui/button.tsx. |
| `dependency-exists:components/ui/card.tsx` | `PASS` | Dependency exists at source baseline: components/ui/card.tsx. |
| `dependency-sha:components/ui/card.tsx` | `PASS` | Dependency fingerprint matches source baseline: components/ui/card.tsx. |
| `dependency-unchanged:components/ui/card.tsx` | `PASS` | Dependency remains unchanged through Phase 25IU: components/ui/card.tsx. |
| `dependency-exists:lib/homepage-control-parser.ts` | `PASS` | Dependency exists at source baseline: lib/homepage-control-parser.ts. |
| `dependency-sha:lib/homepage-control-parser.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/homepage-control-parser.ts. |
| `dependency-unchanged:lib/homepage-control-parser.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/homepage-control-parser.ts. |
| `dependency-exists:lib/homepage-control-public.ts` | `PASS` | Dependency exists at source baseline: lib/homepage-control-public.ts. |
| `dependency-sha:lib/homepage-control-public.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/homepage-control-public.ts. |
| `dependency-unchanged:lib/homepage-control-public.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/homepage-control-public.ts. |
| `dependency-exists:lib/homepage-control-schema.ts` | `PASS` | Dependency exists at source baseline: lib/homepage-control-schema.ts. |
| `dependency-sha:lib/homepage-control-schema.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/homepage-control-schema.ts. |
| `dependency-unchanged:lib/homepage-control-schema.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/homepage-control-schema.ts. |
| `dependency-exists:lib/homepage-control-types.ts` | `PASS` | Dependency exists at source baseline: lib/homepage-control-types.ts. |
| `dependency-sha:lib/homepage-control-types.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/homepage-control-types.ts. |
| `dependency-unchanged:lib/homepage-control-types.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/homepage-control-types.ts. |
| `dependency-exists:lib/homepage-control-validation.ts` | `PASS` | Dependency exists at source baseline: lib/homepage-control-validation.ts. |
| `dependency-sha:lib/homepage-control-validation.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/homepage-control-validation.ts. |
| `dependency-unchanged:lib/homepage-control-validation.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/homepage-control-validation.ts. |
| `dependency-exists:lib/public-tool-adapter.ts` | `PASS` | Dependency exists at source baseline: lib/public-tool-adapter.ts. |
| `dependency-sha:lib/public-tool-adapter.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/public-tool-adapter.ts. |
| `dependency-unchanged:lib/public-tool-adapter.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/public-tool-adapter.ts. |
| `dependency-exists:lib/supabase-admin.ts` | `PASS` | Dependency exists at source baseline: lib/supabase-admin.ts. |
| `dependency-sha:lib/supabase-admin.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/supabase-admin.ts. |
| `dependency-unchanged:lib/supabase-admin.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/supabase-admin.ts. |
| `dependency-exists:lib/tool-categories.ts` | `PASS` | Dependency exists at source baseline: lib/tool-categories.ts. |
| `dependency-sha:lib/tool-categories.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/tool-categories.ts. |
| `dependency-unchanged:lib/tool-categories.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/tool-categories.ts. |
| `dependency-exists:lib/utils.ts` | `PASS` | Dependency exists at source baseline: lib/utils.ts. |
| `dependency-sha:lib/utils.ts` | `PASS` | Dependency fingerprint matches source baseline: lib/utils.ts. |
| `dependency-unchanged:lib/utils.ts` | `PASS` | Dependency remains unchanged through Phase 25IU: lib/utils.ts. |
| `route-in-dependency-closure` | `PASS` | The C01 route file is included in its corrected dependency closure. |
| `no-source-change-since-source-baseline` | `PASS` | Only documentation changed after the source manifest baseline. |
| `development-script-present` | `PASS` | The package exposes a development script name for a later approved execution. |
| `reduced-manifest-recomputed` | `PASS` | The reduced public-only manifest SHA-256 recomputes exactly using the original governance baseline recorded when Phase 25IU derived it. |

## Immutable C01 dependency closure

| Dependency | SHA-256 | Git blob |
|---|---|---|
| `app/api/homepage-control/published/route.ts` | `c7242b326a71eb54f14d72dc060f7d13709bafcb7cac753329cb42551dc05289` | `29992ba9fbd88f65617573047eeb4a2b8f906a5a` |
| `app/data/tools.ts` | `4cbd06d987e2a20ffe2fa1b1aa2a368335233b58fae2077b1afa0c6e96c067b4` | `5140587ed4417e5e9e1f2c61455a3dda928e3bd0` |
| `components/public/tool-card.tsx` | `6e9add11d92b49f2d6dc7cbac5314cdd840b182eca592295eff2bbf655cb33fe` | `7ccb48246fb9bfee3059111b4632fd5f24bf63d4` |
| `components/ui/badge.tsx` | `46a0de5224f6a5d5d63d45246534288518dce888f031064bff925bbc7fe6ad97` | `6eb2a057aae0e23a74368cc4daf9657210e9a740` |
| `components/ui/button.tsx` | `cc36af0f8b5019c33cc039fbf03bb952a513072b15b55b53c592b78af3e5f4c4` | `4d38506cee5430d95a59ec6a2a0cef2b79217e7a` |
| `components/ui/card.tsx` | `0cc9420f39823ff1f999007ec24ee54190a719ecefdbab247b848e4ea8febb44` | `7257504e7f8ee8427a69b39a69ea0f10ca79a445` |
| `lib/homepage-control-parser.ts` | `1d681e10139e978adaf8b30c932e9827be871b62ebb06e4f6a9ddacf71f53299` | `bab79ee1dcf5d98bdb5ac83892a484d279254d0c` |
| `lib/homepage-control-public.ts` | `e9e2e5acdca6ebd7dcd26cd3883119a41153945c1fa7556bde0ed2b591cb4a71` | `bd5f26bbed012812b50ce71fdd520b1db3ed3f3e` |
| `lib/homepage-control-schema.ts` | `6f4c1d9252a8a12011881616e4218aaf956dbf290679804978f51a272287df31` | `fa2fd7c52e94831c4ad8b571ceec10d58839cebf` |
| `lib/homepage-control-types.ts` | `82f0171bbaf5a28fc5475355b7bb7ddcacfd4023b52d712b7dc2c83244215f91` | `304f5f358294d72bc67115c5f08585658815d9e8` |
| `lib/homepage-control-validation.ts` | `337741f139ee2351abbaae9efea572deafc5b97bad721c539502fdfa49663c22` | `4747b434f94bb09493d231e4eae858a73c70af8b` |
| `lib/public-tool-adapter.ts` | `a27e0c8e0459f3c280c955b76cd8de86b2ab61c0641acf375e6de5307497f565` | `b36902d60bbff78b3d732f44da4bfe35f3878d69` |
| `lib/supabase-admin.ts` | `f48a3c80c6f66f32affa6b84460cfa539c4c5bc84719bea1fc5013fe17760637` | `47e09e86f09d3ceb0af174a932e38efe17cfdfc6` |
| `lib/tool-categories.ts` | `5d7ae105a6539b070cdc214316ec37f2f2970c0a377ceef761e159d3cb619046` | `bd52f86182478728b7cf92fe040232d076ffa084` |
| `lib/utils.ts` | `7c8c3dfc0cdd370d44932828eb067ef771c8fe7996693221d5d4b90af6d54f2d` | `bd0c391ddd1088e9067844c48835bf4abcd61783` |

## Environment identifier inventory

Only source-level identifier names were inspected. Environment files and values were not opened or read.

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

A later execution preflight may report only `present` or `missing`. Values remain prohibited.

## Package command boundary

Relevant package script names found:

- `build`
- `check`
- `dev`
- `start`

Only the existing `dev` script may be considered by a later execution gate. This phase does not run it.

## Planned execution boundary

A later execution script may perform only these actions:

1. verify exact commit `392e017d2e0fc9ee8aa348553f6ba8cd5bb3446b`;
2. verify reduced manifest SHA-256 `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`;
3. verify C01 and all 15 dependency fingerprints;
4. verify clean synchronized `main`;
5. check required environment identifiers as `present` or `missing` without values;
6. start one local server bound only to `127.0.0.1:3117`;
7. issue exactly one GET request to `/api/homepage-control/published`;
8. send no request body, cookie, token, authorization header, or session material;
9. follow zero redirects;
10. use zero retries;
11. retain at most `1 MiB` temporarily;
12. print only status code, response byte count, duration, content type, and SHA-256;
13. scan response and server-log bytes for secret-like patterns without printing matches;
14. stop on the first failed precondition or unexpected result;
15. terminate the local server;
16. verify repository, package, lockfile, route, dependency, and harness state remains unchanged;
17. create one result artifact for Gemini review with no commit or push.

## Time and output limits

- Server startup timeout: `60 seconds`
- Request connect timeout: `5 seconds`
- Request total timeout: `20 seconds`
- Request count: `1`
- Retry count: `0`
- Redirect count: `0`
- Maximum temporary response: `1 MiB`
- Printed response body bytes: `0`
- Printed environment-value bytes: `0`

## Stop conditions

Execution must not begin or must stop immediately on:

- baseline, manifest, entry, dependency, blob, or SHA mismatch;
- dirty or unsynchronized repository;
- missing approved development command;
- missing required environment identifier;
- any request for C02 or another authenticated route;
- any credential, cookie, token, authorization header, or session requirement;
- non-local bind, redirect, or network target;
- any method other than GET;
- mutation-capable behavior;
- database write or inability to prove read-only behavior;
- secret-like output;
- timeout, response overflow, retry, or indeterminate result;
- repository, source, package, lockfile, schema, migration, generated-type, deployment, audit, database, cleanup, publishing, or candidate-decision change;
- inability to terminate the server cleanly.

## Explicit human runtime authorization

Required exact statement:

> I explicitly authorize Phase 25IV to start a local AiFinder server on 127.0.0.1:3117 and invoke exactly once only C01 GET /api/homepage-control/published bound to reduced public-only manifest SHA-256 19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e for controlled read-only runtime validation. I do not authorize C02 or any authenticated route, database writes, mutations, cleanup, publishing, deployment, candidate decisions, secret output, environment-value output, or public launch.

Authorization statement SHA-256:

`1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473`

Current authorization state:

`NOT_YET_RECORDED_FOR_CORRECTED_RUNTIME_EXECUTION`

The authorization previously supplied for the superseded two-route manifest remains invalid.

## Phase decision

Corrected preflight:

`READY_FOR_GEMINI_PREFLIGHT_REVIEW`

Gemini preflight approval:

`PENDING`

Controlled runtime execution:

`NOT_EXECUTED`

Authenticated C02 execution:

`NOT_AUTHORIZED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Authorized actions

Phase 25IV authorizes only:

- creation of this single preflight artifact;
- static verification of C01 and its corrected closure;
- source-level environment-identifier inventory without values;
- non-mutating project checks;
- Gemini preflight review packaging.

## Prohibited actions

Phase 25IV prohibits:

- server startup;
- route invocation;
- C02 or authenticated-route execution;
- live database or external-service access;
- environment-file or environment-value inspection;
- runtime manifest creation or population;
- harness execution;
- mutation, cleanup, publishing, deployment, candidate decisions, or launch;
- source, API, UI, schema, migration, generated-type, package, or lockfile changes;
- secret, credential, cookie, token, session, database-row, response-body, or environment-value output;
- commit or push before Gemini review.

## Gemini senior-review questions

Gemini should approve Phase 25IV only if all answers are affirmative:

1. Is Phase 25IV anchored to exact Phase 25IU commit `392e017d2e0fc9ee8aa348553f6ba8cd5bb3446b` while using original reduced-manifest governance baseline `c163aa827280bf0f113c935bd00f340e88afeb4a` only for deterministic SHA recomputation?
2. Does it recompute reduced public-only manifest SHA-256 `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`?
3. Is exactly one candidate retained: C01 GET `/api/homepage-control/published`?
4. Are all 15 dependency fingerprints and Git blobs unchanged?
5. Is C02 explicitly excluded?
6. Are environment identifiers listed without reading files or values?
7. Is future execution restricted to one local GET at `127.0.0.1:3117`?
8. Are request count, redirects, retries, timeouts, and output strictly bounded?
9. Are response bodies and sensitive values excluded from printed output?
10. Are before/after proof, secret scanning, server termination, and stop conditions fail-closed?
11. Is new exact human authorization still required?
12. Are server startup, route invocation, database access, mutation, cleanup, publishing, deployment, Batch D, operational reactivation, and launch still unauthorized?
13. Does operational reactivation remain `BLOCKED`?

## Conditional successor

Only after Gemini approves Phase 25IV and it is committed and pushed may the user provide the exact new authorization statement above.

A separate execution script must remain bound to:

- commit `392e017d2e0fc9ee8aa348553f6ba8cd5bb3446b`;
- reduced manifest SHA-256 `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`;
- C01 GET `/api/homepage-control/published`;
- the exact 15-file dependency closure;
- authorization SHA-256 `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473`.
