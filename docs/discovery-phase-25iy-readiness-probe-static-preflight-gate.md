# Phase 25IY — Readiness-Probe Static Preflight Gate

## Phase identity

- Phase: `25IY`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static readiness-probe preflight
- Approved predecessor phase: `25IX`
- Approved predecessor commit: `497d6b453e4ecd7e1c4614a7906953a0d69cea71`
- Source dependency baseline: `25df6000c66edc0a773facb98ea917d3e5f0f316`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Consumed prior authorization SHA-256: `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473`
- New Phase 25IZ authorization statement SHA-256: `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25IY defines and statically validates the exact readiness evidence required before a possible second controlled C01 attempt.

This phase does not start a server, inspect a runtime log, invoke a route, access a live database or external service, inspect environment files or values, create a runtime manifest, execute the Phase 25FD harness, mutate data, publish, deploy, decide candidates, or launch.

## Static preflight results

| Static invariant | State | Evidence |
|---|---|---|
| `phase25ix-byte-identity` | `PASS` | Working Phase 25IX artifact matches the committed baseline. |
| `phase25ix-artifact-sha` | `PASS` | Phase 25IX artifact SHA-256 matches the approved commit result. |
| `phase25ix-consumed-authorization` | `PASS` | The prior authorization remains consumed and non-reusable. |
| `phase25ix-indeterminate-classification` | `PASS` | The Phase 25IW result remains classified as indeterminate. |
| `phase25ix-operational-block` | `PASS` | Operational reactivation remains blocked. |
| `phase25iv-present` | `PASS` | The committed corrected public-only preflight artifact is present. |
| `phase25iv-manifest` | `PASS` | The corrected public-only manifest identity is preserved. |
| `phase25iv-c01-only` | `PASS` | C01 remains the sole public candidate and C02 remains excluded. |
| `c01-dependency-count` | `PASS` | Parsed 15 C01 dependency fingerprints; expected 15. |
| `dependency-sha:app/api/homepage-control/published/route.ts` | `PASS` | Dependency SHA-256 matches the source baseline: app/api/homepage-control/published/route.ts. |
| `dependency-blob:app/api/homepage-control/published/route.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: app/api/homepage-control/published/route.ts. |
| `dependency-unchanged:app/api/homepage-control/published/route.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: app/api/homepage-control/published/route.ts. |
| `dependency-sha:app/data/tools.ts` | `PASS` | Dependency SHA-256 matches the source baseline: app/data/tools.ts. |
| `dependency-blob:app/data/tools.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: app/data/tools.ts. |
| `dependency-unchanged:app/data/tools.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: app/data/tools.ts. |
| `dependency-sha:components/public/tool-card.tsx` | `PASS` | Dependency SHA-256 matches the source baseline: components/public/tool-card.tsx. |
| `dependency-blob:components/public/tool-card.tsx` | `PASS` | Dependency Git blob matches Phase 25IV evidence: components/public/tool-card.tsx. |
| `dependency-unchanged:components/public/tool-card.tsx` | `PASS` | Dependency remains unchanged through Phase 25IX: components/public/tool-card.tsx. |
| `dependency-sha:components/ui/badge.tsx` | `PASS` | Dependency SHA-256 matches the source baseline: components/ui/badge.tsx. |
| `dependency-blob:components/ui/badge.tsx` | `PASS` | Dependency Git blob matches Phase 25IV evidence: components/ui/badge.tsx. |
| `dependency-unchanged:components/ui/badge.tsx` | `PASS` | Dependency remains unchanged through Phase 25IX: components/ui/badge.tsx. |
| `dependency-sha:components/ui/button.tsx` | `PASS` | Dependency SHA-256 matches the source baseline: components/ui/button.tsx. |
| `dependency-blob:components/ui/button.tsx` | `PASS` | Dependency Git blob matches Phase 25IV evidence: components/ui/button.tsx. |
| `dependency-unchanged:components/ui/button.tsx` | `PASS` | Dependency remains unchanged through Phase 25IX: components/ui/button.tsx. |
| `dependency-sha:components/ui/card.tsx` | `PASS` | Dependency SHA-256 matches the source baseline: components/ui/card.tsx. |
| `dependency-blob:components/ui/card.tsx` | `PASS` | Dependency Git blob matches Phase 25IV evidence: components/ui/card.tsx. |
| `dependency-unchanged:components/ui/card.tsx` | `PASS` | Dependency remains unchanged through Phase 25IX: components/ui/card.tsx. |
| `dependency-sha:lib/homepage-control-parser.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/homepage-control-parser.ts. |
| `dependency-blob:lib/homepage-control-parser.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/homepage-control-parser.ts. |
| `dependency-unchanged:lib/homepage-control-parser.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/homepage-control-parser.ts. |
| `dependency-sha:lib/homepage-control-public.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/homepage-control-public.ts. |
| `dependency-blob:lib/homepage-control-public.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/homepage-control-public.ts. |
| `dependency-unchanged:lib/homepage-control-public.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/homepage-control-public.ts. |
| `dependency-sha:lib/homepage-control-schema.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/homepage-control-schema.ts. |
| `dependency-blob:lib/homepage-control-schema.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/homepage-control-schema.ts. |
| `dependency-unchanged:lib/homepage-control-schema.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/homepage-control-schema.ts. |
| `dependency-sha:lib/homepage-control-types.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/homepage-control-types.ts. |
| `dependency-blob:lib/homepage-control-types.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/homepage-control-types.ts. |
| `dependency-unchanged:lib/homepage-control-types.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/homepage-control-types.ts. |
| `dependency-sha:lib/homepage-control-validation.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/homepage-control-validation.ts. |
| `dependency-blob:lib/homepage-control-validation.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/homepage-control-validation.ts. |
| `dependency-unchanged:lib/homepage-control-validation.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/homepage-control-validation.ts. |
| `dependency-sha:lib/public-tool-adapter.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/public-tool-adapter.ts. |
| `dependency-blob:lib/public-tool-adapter.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/public-tool-adapter.ts. |
| `dependency-unchanged:lib/public-tool-adapter.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/public-tool-adapter.ts. |
| `dependency-sha:lib/supabase-admin.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/supabase-admin.ts. |
| `dependency-blob:lib/supabase-admin.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/supabase-admin.ts. |
| `dependency-unchanged:lib/supabase-admin.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/supabase-admin.ts. |
| `dependency-sha:lib/tool-categories.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/tool-categories.ts. |
| `dependency-blob:lib/tool-categories.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/tool-categories.ts. |
| `dependency-unchanged:lib/tool-categories.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/tool-categories.ts. |
| `dependency-sha:lib/utils.ts` | `PASS` | Dependency SHA-256 matches the source baseline: lib/utils.ts. |
| `dependency-blob:lib/utils.ts` | `PASS` | Dependency Git blob matches Phase 25IV evidence: lib/utils.ts. |
| `dependency-unchanged:lib/utils.ts` | `PASS` | Dependency remains unchanged through Phase 25IX: lib/utils.ts. |
| `no-source-change-since-manifest-baseline` | `PASS` | Only documentation changed after the source manifest baseline. |
| `next-dependency-declared` | `PASS` | Next.js is declared in package.json. |
| `installed-next-package-present` | `PASS` | The installed Next.js package metadata is present. |
| `installed-next-version-present` | `PASS` | The installed Next.js version is explicit and parseable. |
| `single-lockfile` | `PASS` | Detected 1 package lockfile(s); expected exactly one. |
| `installed-next-matches-lock` | `PASS` | Installed Next.js version matches package-lock.json. |
| `readiness-source-candidate-present` | `PASS` | Detected 2 installed Next.js source file(s) containing both the readiness literal and event-logger evidence. |
| `canonical-or-unambiguous-readiness-source` | `PASS` | Readiness-source selection: CANONICAL_CJS_START_SERVER. |
| `readiness-source-literal` | `PASS` | The selected framework readiness source contains the literal marker prefix. |
| `readiness-source-event-call` | `PASS` | The readiness literal is associated with the framework event logger. |
| `new-authorization-sha` | `PASS` | The new exact Phase 25IZ authorization statement SHA-256 is deterministic. |

## Candidate and dependency identity

- Entry: `C01`
- Route: `/api/homepage-control/published`
- Method: `GET`
- Authentication class: `PUBLIC_NO_SESSION_REQUIRED`
- Corrected dependency count: `15`
- C02: `AUTHENTICATED_ROUTE_EXCLUDED_PENDING_SEPARATE_AUTH_DESIGN`

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

## Framework and package identity

- Declared Next.js dependency: `16.2.6`
- Installed Next.js version: `16.2.6`
- `package.json` SHA-256: `cfb7d96e75191a6b21276318a41698a11ad38600c0598cc92c0c5da18fe9a3a4`
- Installed Next.js package metadata SHA-256: `1ec03f46fd6a51b9adbc80b023f6e75223f0a7125b1394023d55841ca5ddf625`
- Lockfile: `package-lock.json`
- Lockfile SHA-256: `e4c3b701315248dd40f0d1ed328604440b150eb89cf2e25ad87f914e9e7f6e34`
- Readiness-source selection: `CANONICAL_CJS_START_SERVER`
- Selected readiness source file: `node_modules/next/dist/server/lib/start-server.js`
- Selected readiness source SHA-256: `9a0922f50f9280231d1d22d6e31a2bb5faebaf06fc98ab0563f02e8a751504c7`
- Selected readiness source bytes: `22321`
- Readiness-source candidate count: `2`

### Bounded readiness-source candidate inventory

| Candidate source | SHA-256 | Bytes |
|---|---|---:|
| `node_modules/next/dist/server/lib/start-server.js` | `9a0922f50f9280231d1d22d6e31a2bb5faebaf06fc98ab0563f02e8a751504c7` | 22321 |
| `node_modules/next/dist/esm/server/lib/start-server.js` | `57f33b3818f443f016af48599096483706e2ca83bf11e3f91977e17baecb7896` | 19511 |

The canonical CommonJS `node_modules/next/dist/server/lib/start-server.js` is preferred when it contains both the readiness literal and event-logger evidence. A single source-grounded fallback is allowed only when the canonical file does not qualify. Multiple candidates are recorded rather than treated as a failure when the canonical source qualifies.

A future Phase 25IZ execution must fail before server startup if any selected package or readiness-source identity differs.

## Exact allowlisted readiness evidence

The installed Next.js source statically associates its event logger with the literal prefix:

`Ready in `

The future runtime may normalize server-output bytes only by:

1. decoding with replacement for invalid UTF-8;
2. removing ANSI control sequences using the fixed normalization expression;
3. converting carriage returns to newlines.

Approved ANSI-removal expression:

```text
\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])
```

Approved normalized readiness expression:

```text
\bReady in\s+[0-9]+(?:\.[0-9]+)?(?:ms|s)\b
```

Required readiness-marker count before the application request:

`1`

The marker's matched text and surrounding line must not be printed or committed.

## Readiness semantics

The marker proves only that the installed Next.js development server emitted its framework ready state.

It does not independently prove:

- that C01 has already compiled;
- that C01 will return a successful response;
- that runtime configuration is complete;
- that a live database is reachable;
- that the previous connection closure was caused by startup timing.

Therefore, readiness must be combined with process, listener, stabilization, secret-scan, and repository controls.

## Required future readiness sequence

A future Phase 25IZ script may proceed only in this order:

1. verify the exact Phase 25IY commit, manifest, C01 route, 15-file closure, package files, lockfile, installed Next.js package metadata, and readiness-source SHA-256;
2. verify clean synchronized `main`;
3. check required environment identifiers only as `present` or `missing`, without printing values;
4. create an isolated temporary checkout using the approved commit and existing local dependencies;
5. bind the server only to `127.0.0.1:3117`;
6. start the existing `dev` command with telemetry disabled;
7. continuously verify that the server process remains alive;
8. verify that the only listener on port `3117` is `127.0.0.1:3117`;
9. inspect server-output bytes privately for secret-like patterns and the allowlisted normalized readiness expression;
10. require exactly one readiness marker within `90` seconds;
11. after the marker, require `3` continuous seconds of unchanged process identity, process liveness, exact listener binding, no additional readiness marker, and no secret-like scan result;
12. issue no HTTP request during the readiness stage;
13. only after readiness succeeds, issue exactly one separately authorized C01 GET request;
14. stop on the first failure, terminate the server, verify port release, and preserve only metadata and hashes.

Polling interval:

`250 ms`

## Environment identifier boundary

Only identifier names preserved by Phase 25IV are in scope:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The future execution may determine only whether each identifier is present. It must not print, hash, compare, transmit, or commit environment values.

## Future request boundary

After readiness succeeds, a future Phase 25IZ execution may issue:

- request count: `1`
- method: `GET`
- route: `/api/homepage-control/published`
- destination: `127.0.0.1:3117`
- request body: none
- cookies: none
- authorization header: none
- session material: none
- retries: `0`
- redirects: `0`
- connect timeout: `5 seconds`
- request timeout: `20 seconds`
- maximum temporary response: `1 MiB`

Printed response data remains limited to:

- HTTP status;
- response byte count;
- duration;
- normalized content type;
- response SHA-256;
- header byte count and SHA-256;
- secret-scan state without match disclosure.

## Readiness failure conditions

Readiness must fail closed before the C01 request on:

- baseline, manifest, dependency, package, lockfile, installed-version, readiness-source, or authorization mismatch;
- dirty or unsynchronized repository;
- unavailable local dependencies;
- missing required environment identifier;
- occupied local port;
- server process exit or restart;
- listener outside `127.0.0.1:3117`;
- absent readiness marker after `90` seconds;
- more than one readiness marker;
- secret-like server-output scan result;
- failure to complete the `3`-second stable interval;
- any HTTP request made during readiness;
- indeterminate process, listener, marker, or output state.

## Result metadata for Phase 25IZ

A future result artifact may record only:

- verified commit and manifest identities;
- verified package, lockfile, installed Next.js, and readiness-source hashes;
- environment identifier count and missing count;
- server process started and terminated states;
- readiness marker observed yes/no and marker count;
- time to marker;
- stabilization completed yes/no;
- listener verification state;
- server-output byte count and SHA-256;
- server-output secret-scan state;
- request issued yes/no;
- response metadata and hashes when available;
- repository before/after snapshot comparison;
- commit and push states.

Raw server output, matched readiness text, response bodies, header values, environment values, and secret-like matches remain prohibited.

## New exact human authorization

Required exact statement:

> I explicitly authorize Phase 25IZ to start a local AiFinder server on 127.0.0.1:3117, observe only the approved normalized Next.js readiness marker without printing server-log content, require a 3-second stable process and listener interval, and then invoke exactly once only C01 GET /api/homepage-control/published bound to reduced public-only manifest SHA-256 19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e for controlled read-only runtime validation. I do not authorize C02 or any authenticated route, retries, database writes, mutations, cleanup, publishing, deployment, candidate decisions, raw log output, secret output, environment-value output, or public launch.

Authorization statement SHA-256:

`c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080`

Current authorization state:

`NOT_YET_RECORDED_FOR_PHASE_25IZ`

The consumed authorization SHA-256 `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473` remains invalid and must not be reused.

## Phase decision

Readiness-probe static preflight:

`READY_FOR_GEMINI_PREFLIGHT_REVIEW`

Phase 25IZ runtime execution:

`NOT_AUTHORIZED`

Authenticated C02 execution:

`NOT_AUTHORIZED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Gemini senior-review questions

Gemini should approve Phase 25IY only if all answers are affirmative:

1. Is Phase 25IY anchored to exact Phase 25IX commit `497d6b453e4ecd7e1c4614a7906953a0d69cea71`?
2. Does it preserve the reduced manifest and mark the previous authorization consumed?
3. Are C01 and all 15 dependency fingerprints unchanged?
4. Is the installed Next.js package version and lockfile identity recorded?
5. Is the canonical or uniquely grounded readiness-source file selected deterministically and fingerprinted, with all qualifying candidates inventoried?
6. Is the normalized readiness expression grounded in the installed Next.js event-logger source?
7. Are raw server logs, matched lines, environment values, and response bodies prohibited?
8. Does readiness require process liveness, exact listener binding, exactly one marker, and a stable post-marker interval?
9. Does the readiness stage issue zero HTTP requests?
10. Does the design explicitly avoid claiming that the marker proves C01 compilation or the prior root cause?
11. Are all timeouts, polling, request limits, secret scans, shutdown controls, and repository checks fail-closed?
12. Is a new exact authorization with SHA-256 `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080` still required?
13. Are server startup, route invocation, C02, database mutation, deployment, Batch D, operational reactivation, and public launch unauthorized in Phase 25IY?
14. Does operational reactivation remain `BLOCKED`?

## Conditional successor

Only after Gemini approves Phase 25IY and it is committed and pushed may the user provide the exact new authorization statement.

A separate Phase 25IZ execution gate must bind to:

- the final Phase 25IY commit;
- manifest SHA-256 `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`;
- C01 GET `/api/homepage-control/published`;
- all 15 dependency fingerprints;
- installed Next.js version `16.2.6`;
- lockfile SHA-256 `e4c3b701315248dd40f0d1ed328604440b150eb89cf2e25ad87f914e9e7f6e34`;
- readiness-source SHA-256 `9a0922f50f9280231d1d22d6e31a2bb5faebaf06fc98ab0563f02e8a751504c7`;
- authorization SHA-256 `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080`.
