# Phase 25JC — Redesigned Deterministic Validation Environment Architecture Gate

## Phase identity

- Phase: `25JC`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static architecture selection
- Approved predecessor phase: `25JB`
- Approved predecessor commit: `7b7fa4d0fff06274fdb1e4b9fadbfb2e22a28909`
- Phase 25JB artifact SHA-256: `ecce2e7fd4a071e931099742ae4e8207f1636ecacd2f9b4a5bb3da57fae32c24`
- Selected path: `PATH_C_REDESIGNED_VALIDATION_ENVIRONMENT`
- Architecture scope: `STATIC_ONLY`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JC defines and selects the architecture for a deterministic production-mode local validation boundary.

This phase does not implement the architecture. It does not build or start the application, invoke C01 or C02, inspect raw logs, access a live database or external service, inspect environment values, install packages, modify source code, execute a harness, mutate data, publish, deploy, decide candidates, begin Batch D, or launch.

## Static predecessor and package verification

| Static invariant | State | Evidence |
|---|---|---|
| `baseline-head` | `PASS` | HEAD matches the approved Phase 25JB commit. |
| `baseline-origin` | `PASS` | origin/main matches the approved Phase 25JB commit. |
| `phase25jb-artifact-present` | `PASS` | Phase 25JB artifact is present. |
| `phase25jb-artifact-sha` | `PASS` | Phase 25JB artifact SHA-256 matches the approved record. |
| `phase25jb-current-commit-identity` | `PASS` | Phase 25JB artifact is unchanged at the current baseline. |
| `phase25jb-required-markers` | `PASS` | Phase 25JB path-selection and safety markers are preserved. |
| `package-json-present` | `PASS` | package.json is present. |
| `package-lock-present` | `PASS` | package-lock.json is present. |
| `next-package-present` | `PASS` | node_modules/next/package.json is present. |
| `readiness-source-present` | `PASS` | node_modules/next/dist/server/lib/start-server.js is present. |
| `build-script-present` | `PASS` | package.json defines an existing build script. |
| `start-script-present` | `PASS` | package.json defines an existing start script. |
| `next-version` | `PASS` | Installed Next.js version is 16.2.6. |
| `readiness-source-sha` | `PASS` | Installed readiness-source fingerprint matches the approved Phase 25IY identity. |
| `readiness-literal` | `PASS` | The installed readiness source contains the approved readiness literal. |
| `readiness-event-evidence` | `PASS` | The readiness literal is grounded in event-logger source evidence. |
| `node-version-readable` | `PASS` | Installed Node.js version metadata is readable. |
| `npm-version-readable` | `PASS` | Installed npm version metadata is readable. |

## Current toolchain identity

- Node.js version: `v24.15.0`
- npm version: `11.12.1`
- `package.json` SHA-256: `cfb7d96e75191a6b21276318a41698a11ad38600c0598cc92c0c5da18fe9a3a4`
- `package-lock.json` SHA-256: `e4c3b701315248dd40f0d1ed328604440b150eb89cf2e25ad87f914e9e7f6e34`
- Installed Next.js version: `16.2.6`
- Installed Next.js package SHA-256: `1ec03f46fd6a51b9adbc80b023f6e75223f0a7125b1394023d55841ca5ddf625`
- Canonical readiness source: `node_modules/next/dist/server/lib/start-server.js`
- Canonical readiness-source SHA-256: `9a0922f50f9280231d1d22d6e31a2bb5faebaf06fc98ab0563f02e8a751504c7`
- Existing build script: `next build`
- Existing start script: `next start`

## Next.js configuration identity

| Configuration file | SHA-256 | Bytes |
|---|---|---:|
| `next.config.ts` | `18c61dcd4508b8a479afaaaefb7ff1d111300a0cc4a0370a7c62fc6c8f948afd` | 144 |

## Architecture candidates

### Candidate A — Isolated host production-mode boundary

Sequence:

1. export the exact reviewed commit into a disposable directory outside the repository;
2. create a disposable dependency snapshot from the already installed dependency tree;
3. run the existing build script inside a deny-by-default network boundary;
4. start the built application with the existing start script;
5. bind only to `127.0.0.1` on one approved port;
6. require source-grounded readiness, process liveness, exact listener identity, and a stabilization interval;
7. permit one approved C01 request only after all readiness gates pass;
8. terminate the process tree and delete the disposable workspace;
9. prove the original repository and dependency tree remain unchanged.

**Decision:** `SELECTED_FOR_FUTURE_STATIC_IMPLEMENTATION_PLANNING`

### Candidate B — Containerized production-mode boundary

This candidate could improve filesystem and network isolation, but it introduces container-engine availability, base-image provenance, image-build behavior, and additional dependency identities.

**Decision:** not selected for the immediate design.

Candidate B remains a fallback if Candidate A cannot prove enforceable host isolation without privileged or non-portable behavior.

### Candidate C — Remote preview or deployment boundary

This candidate would more closely resemble hosted production but would require deployment, external infrastructure, remote logs, and broader network activity.

**Decision:** rejected for this Batch C path.

Deployment and remote-environment validation remain outside the authorized scope.

## Selected architecture

Phase 25JC selects:

`ISOLATED_HOST_PRODUCTION_MODE_BOUNDARY`

Selection status:

`ARCHITECTURE_SELECTED_NOT_IMPLEMENTED`

The selection does not claim that production mode will pass. It defines a more deterministic evidence boundary than the closed development-server cycle.

## Architecture components

### 1. Immutable source capsule

The future implementation must:

- verify exact repository path, origin, branch, commit, and synchronization;
- require a clean working tree;
- export the reviewed commit using a content-addressed archive;
- verify the archive tree identity before use;
- place the checkout outside the repository;
- prohibit writes to the original working tree.

### 2. Disposable dependency capsule

No package installation is authorized.

The future design must create a disposable dependency snapshot from the existing installed dependency tree without allowing the build to mutate the original `node_modules`.

Acceptable future mechanisms may include an APFS clone, filesystem copy, or another separately reviewed local snapshot method.

The implementation plan must:

- fingerprint the source dependency identities before snapshotting;
- verify the disposable snapshot contains the approved Next.js package and readiness source;
- redirect package-manager and framework caches into the disposable workspace;
- detect and fail on writes to the original dependency tree;
- delete the disposable dependency snapshot afterward.

### 3. Production build capsule

The future build must use only the repository's existing build script:

`next build`

Required boundary:

- disposable checkout only;
- disposable dependency capsule only;
- no package installation;
- deny external network by default;
- bounded duration;
- bounded output size;
- metadata-only reporting;
- secret-like scanning before any output is retained;
- no raw output in the governance artifact;
- deterministic process termination;
- build-artifact inventory and fingerprints;
- deletion of all disposable build material after review evidence is produced.

A successful build alone must not authorize runtime startup.

### 4. Production runtime capsule

The future runtime candidate must use only the repository's existing start script:

`next start`

Required boundary:

- start only from the reviewed disposable production build;
- bind exactly to `127.0.0.1`;
- use one approved port;
- own and track the complete process group;
- accept no external inbound connections;
- prohibit hidden health-check requests;
- require exactly one approved readiness marker;
- verify listener identity and process stability;
- use a bounded stabilization interval;
- stop before any application request if readiness, process, or listener evidence changes.

### 5. Readiness evidence

The production-mode candidate may use the installed framework readiness evidence only after a future preflight reconfirms:

- Next.js version `16.2.6`;
- readiness source `node_modules/next/dist/server/lib/start-server.js`;
- readiness-source SHA-256 `9a0922f50f9280231d1d22d6e31a2bb5faebaf06fc98ab0563f02e8a751504c7`;
- normalized readiness expression;
- exact expected marker count;
- process and listener stability rules.

The readiness marker remains framework-startup evidence only. It does not prove C01 compilation, database connectivity, or route success.

### 6. Network architecture

#### Build stage

Selected design:

`EXTERNAL_NETWORK_DENIED`

The future implementation plan must identify a concrete, enforceable, non-interactive host mechanism for denying external network access during the build.

If that mechanism is absent, unavailable, requires unapproved privilege escalation, or cannot be verified, the build must not run.

#### Runtime readiness stage

Selected design:

`LOOPBACK_ONLY_NO_APPLICATION_REQUESTS`

No HTTP request may be issued during readiness or stabilization.

#### C01 request stage

State:

`NETWORK_POLICY_UNRESOLVED_AND_NOT_AUTHORIZED`

C01 may require its statically reviewed read-only external dependency behavior. Phase 25JC does not authorize environment-value inspection, destination derivation, database access, or external egress.

A later static network-policy phase must define:

- the allowed destination derivation method;
- whether derivation requires separately authorized private environment-value handling;
- destination minimization and comparison rules;
- DNS and address-change handling;
- unexpected-destination stop conditions;
- metadata-only evidence;
- prohibition on direct validation-client database commands;
- confirmation that only the approved route may exercise its normal read-only dependency behavior.

No future C01 request may be authorized until this network policy is approved.

### 7. Evidence model

A future execution result may retain only approved metadata, including:

- exact commit and artifact hashes;
- dependency and toolchain fingerprints;
- build exit classification, duration, byte count, and output hash;
- generated build-artifact inventory hashes;
- readiness marker count and time-to-marker;
- listener and process-count metadata;
- one bounded response status, byte count, content type, duration, and response hash;
- secret-scan states;
- cleanup and repository-preservation states.

It must not retain or print:

- raw build or server output;
- matched readiness lines;
- environment values;
- secrets, tokens, cookies, or sessions;
- response bodies or header values;
- database rows;
- external service response bodies.

### 8. Failure model

The future implementation must define named fail-closed outcomes for at least:

- repository identity mismatch;
- dependency identity mismatch;
- unavailable dependency snapshot mechanism;
- original dependency-tree mutation;
- network-denial mechanism unavailable;
- build timeout or nonzero exit;
- build output limit exceeded;
- build secret scan triggered;
- missing or ambiguous build artifacts;
- startup timeout or nonzero exit;
- missing, duplicate, or changed readiness marker;
- listener binding mismatch;
- process identity change;
- stabilization failure;
- unresolved runtime network policy;
- request connection or response failure;
- non-success HTTP status;
- response output or secret-scan violation;
- cleanup failure;
- original repository snapshot change.

Every failure stops the cycle. No automatic retry is allowed.

## Authorization and phase chain

The Phase 25IW authorization SHA-256 `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473` remains `CONSUMED_AND_NOT_REUSABLE`.

The Phase 25IZ authorization SHA-256 `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080` remains `CONSUMED_AND_NOT_REUSABLE`.

Phase 25JC creates no new runtime authorization.

Required future chain:

1. static implementation plan;
2. static network-policy plan;
3. static implementation or harness review;
4. static preflight bound to the then-current commit and all artifact hashes;
5. Gemini approval;
6. fresh exact human authorization with a unique SHA-256;
7. one fail-closed execution attempt.

## Architecture decision

Selected architecture:

`ISOLATED_HOST_PRODUCTION_MODE_BOUNDARY`

Build mode:

`EXISTING_PRODUCTION_BUILD_SCRIPT`

Runtime mode:

`EXISTING_PRODUCTION_START_SCRIPT`

Dependency installation:

`PROHIBITED`

Build external network:

`DENIED_PENDING_ENFORCEMENT_DESIGN`

Runtime readiness network:

`LOOPBACK_ONLY`

C01 runtime egress:

`UNRESOLVED_AND_NOT_AUTHORIZED`

Implementation:

`NOT_AUTHORIZED`

Runtime execution:

`NOT_AUTHORIZED`

Successful C01 validation:

`NOT_ACHIEVED`

Authenticated C02:

`NOT_AUTHORIZED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Safe successor

The safe successor is:

**Phase 25JD — Isolated Production-Mode Validation Environment Static Implementation Plan Gate**

Phase 25JD may define the exact scripts, temporary-directory structure, dependency snapshot mechanism, build and startup commands, output limits, process ownership, cleanup, and evidence schema.

Phase 25JD must not:

- execute the build or start command;
- install packages;
- inspect environment values;
- authorize external network or database access;
- invoke C01 or C02;
- inspect raw historical logs;
- modify source code;
- authorize runtime execution;
- begin Batch D;
- authorize operational reactivation or public launch.

The unresolved C01 runtime network policy must remain an explicit blocker and receive its own static approval before any execution preflight.

## Gemini senior-review questions

Gemini should approve Phase 25JC only if all answers are affirmative:

1. Is Phase 25JC anchored to exact Phase 25JB commit `7b7fa4d0fff06274fdb1e4b9fadbfb2e22a28909`?
2. Is the approved Phase 25JB artifact identity preserved?
3. Are package, lockfile, toolchain, Next.js, readiness-source, and configuration identities recorded statically?
4. Are Candidate A, B, and C compared without executing any candidate?
5. Is Candidate A selected only as an architecture, not an implementation or authorization?
6. Does the design isolate source, dependencies, build output, caches, and runtime processes from the original repository?
7. Is package installation prohibited?
8. Is the build network denied pending a concrete enforcement design?
9. Is runtime readiness loopback-only and zero-request?
10. Is C01 runtime egress explicitly unresolved and unauthorized?
11. Is a dedicated future network-policy approval required before any C01 execution?
12. Are raw output, environment values, response bodies, header values, and database rows prohibited?
13. Are named fail-closed conditions and zero automatic retries required?
14. Are both prior authorization hashes preserved as consumed and non-reusable?
15. Is Phase 25JD limited to a static implementation plan?
16. Are build, runtime execution, C02, Batch D, operational reactivation, and public launch unauthorized?
17. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC deterministic environment architecture: 100%
- Selected architecture: isolated host production-mode boundary
- Phase 25JC Gemini review: pending
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
