# Phase 25JD — Isolated Production-Mode Validation Environment Static Implementation Plan Gate

## Phase identity

- Phase: `25JD`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static implementation plan
- Approved predecessor phase: `25JC`
- Approved predecessor commit: `a90c14ba8f9bde7bb8cdc87878a57532925805ec`
- Phase 25JC artifact SHA-256: `73c2476afacc3c9eeb26ce979c4c06085f73b3c5e7c8f333bf76f91d12ba0d22`
- Selected architecture: `ISOLATED_HOST_PRODUCTION_MODE_BOUNDARY`
- Implementation status: `PLANNED_NOT_IMPLEMENTED`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JD converts the approved Phase 25JC architecture into an exact non-executable implementation blueprint.

This phase does not create the future runtime harness. It does not build or start the application, clone dependencies, create an environment capsule, run `sandbox-exec`, invoke C01 or C02, inspect raw logs, access a live database or external service, inspect environment values, install packages, modify source code, mutate data, publish, deploy, decide candidates, begin Batch D, or launch.

## Static predecessor and host-capability inventory

| Static invariant | State | Evidence |
|---|---|---|
| `baseline-head` | `PASS` | HEAD matches the approved Phase 25JC commit. |
| `baseline-origin` | `PASS` | origin/main matches the approved Phase 25JC commit. |
| `phase25jc-artifact-present` | `PASS` | Phase 25JC artifact is present. |
| `phase25jc-artifact-sha` | `PASS` | Phase 25JC artifact SHA-256 matches the approved record. |
| `phase25jc-current-commit-identity` | `PASS` | Phase 25JC artifact is unchanged at the current baseline. |
| `phase25jc-required-markers` | `PASS` | Phase 25JC architecture, network, and safety markers are preserved. |
| `tool-git` | `PASS` | git is available on the host. |
| `tool-node` | `PASS` | node is available on the host. |
| `tool-npm` | `PASS` | npm is available on the host. |
| `tool-python3` | `PASS` | python3 is available on the host. |
| `tool-tar` | `PASS` | tar is available on the host. |
| `tool-cp` | `PASS` | cp is available on the host. |
| `tool-ditto` | `PASS` | ditto is available on the host. |
| `tool-mktemp` | `PASS` | mktemp is available on the host. |
| `tool-lsof` | `PASS` | lsof is available on the host. |
| `tool-sandbox-exec` | `PASS` | sandbox-exec is available on the host. |
| `package-json-present` | `PASS` | package.json is present. |
| `package-lock-present` | `PASS` | package-lock.json is present. |
| `next-package-present` | `PASS` | node_modules/next/package.json is present. |
| `readiness-source-present` | `PASS` | node_modules/next/dist/server/lib/start-server.js is present. |
| `build-script` | `PASS` | The existing production build script is defined. |
| `start-script` | `PASS` | The existing production start script is defined. |
| `next-version` | `PASS` | Installed Next.js version is 16.2.6. |
| `readiness-source-sha` | `PASS` | Readiness-source fingerprint matches the approved identity. |

## Host tool identity inventory

| Tool | Resolved path | SHA-256 | Bytes |
|---|---|---|---:|
| `git` | `/usr/bin/git` | `a961f78075d8e7621ef4f5d764c64ef8a41bf66c0a98ab5cb6ca39b85ce31c93` | 118880 |
| `node` | `/usr/local/bin/node` | `a5ebb9adc969c8fcc486823ada530a4130b0d56edf954de7b05c280170487b1a` | 242234784 |
| `npm` | `/usr/local/lib/node_modules/npm/bin/npm-cli.js` | `8e5f6f3429f8cdbe693cdc29904e9d5a7b127a494bd15c804bd54c7403bfcbe7` | 54 |
| `python3` | `/usr/bin/python3` | `a961f78075d8e7621ef4f5d764c64ef8a41bf66c0a98ab5cb6ca39b85ce31c93` | 118880 |
| `tar` | `/usr/bin/bsdtar` | `465aa6ae11e635dea208c0a24f16d1a1236a71fc4e143dbf1967426e649758d9` | 274784 |
| `cp` | `/bin/cp` | `7bb0a397dfc5a0475e4ee465b3a26c2acb15a56133e4c8f3259cc7e1db34a115` | 153360 |
| `ditto` | `/usr/bin/ditto` | `55318f2bb92f21edaaea733fe9447354679d9f178540169cd213a58ed239aa33` | 172576 |
| `mktemp` | `/usr/bin/mktemp` | `6a427415b2485f4917b6d2145032410bf4feb7a48d247aa7a6c4e0996ee82b1c` | 101728 |
| `lsof` | `/usr/sbin/lsof` | `5861dad96c4053a6b4b263d20e23b3a8215476a38a55ec1a8e05f4638e9b890c` | 307600 |
| `sandbox-exec` | `/usr/bin/sandbox-exec` | `f3162ae11789a5b296bb3850d493c33ddd52053a03f984b2c4bc34004f4fee99` | 102560 |

## Package and dependency identity

- `package.json` SHA-256: `cfb7d96e75191a6b21276318a41698a11ad38600c0598cc92c0c5da18fe9a3a4`
- `package-lock.json` SHA-256: `e4c3b701315248dd40f0d1ed328604440b150eb89cf2e25ad87f914e9e7f6e34`
- Installed Next.js version: `16.2.6`
- Installed Next.js package SHA-256: `1ec03f46fd6a51b9adbc80b023f6e75223f0a7125b1394023d55841ca5ddf625`
- Readiness source: `node_modules/next/dist/server/lib/start-server.js`
- Readiness-source SHA-256: `9a0922f50f9280231d1d22d6e31a2bb5faebaf06fc98ab0563f02e8a751504c7`
- Top-level `node_modules` entry count: `511`
- Existing build script: `next build`
- Existing start script: `next start`

These identities are planning evidence only. A future preflight must recompute them against the then-current reviewed commit.

## Planned implementation form

The future implementation should consist of two files generated outside the repository:

1. a parser-safe Bash gate responsible for repository identity, scope, logging, clipboard delivery, and original exit-code propagation;
2. an embedded Python supervisor responsible for temporary workspace lifecycle, process ownership, bounded output capture, secret scanning, readiness observation, request execution, cleanup, and result-artifact generation.

The future implementation must contain:

- zero shell heredocs;
- zero literal shell backticks;
- no interactive prompts;
- no background work after the gate exits;
- one explicit cleanup path;
- one final result artifact at most;
- no commit or push.

## Planned temporary-directory layout

A future run should allocate one root under `/private/tmp`:

```text
/private/tmp/aifinder-25j*-<timestamp>/
  source/
  dependencies/
  build-home/
  npm-cache/
  next-cache/
  profiles/
    build-deny-network.sb
    runtime-policy.sb
  logs/
    check-before.log
    build.log
    server.log
    check-after.log
  metadata/
    source-tree.json
    dependency-tree.json
    build-artifacts.json
    result.json
```

Rules:

- the root must not be inside the Git repository;
- every path must be owned by the invoking user;
- symlinks that escape the temporary root are prohibited except an explicitly reviewed opaque environment capsule reference;
- all temporary material must be removed before the gate reports success;
- cleanup failure produces `FAILED_CLOSED`.

## Stage 0 — Guard and identity verification

The future gate must verify before any temporary workspace is created:

1. repository path `/Users/jamescarlodumaua/aifinder`;
2. approved origin;
3. branch `main`;
4. exact reviewed commit and `origin/main` identity;
5. ahead and behind counts both zero;
6. clean working tree;
7. exact Phase 25JC artifact identity;
8. exact manifest, package, lockfile, Next.js, readiness-source, and configuration identities;
9. required tool paths and fingerprints;
10. no existing result artifact for the future execution phase;
11. no listener on the approved port;
12. no previous temporary workspace using the same run identifier.

Any mismatch stops before build or startup.

## Stage 1 — Original-state snapshot

Before any disposable copy is created, the future supervisor must record metadata-only hashes for:

- all approved tracked source and governance files;
- package and lockfile;
- approved Next.js package files;
- readiness source;
- selected dependency-tree sentinel files;
- existing tracked harness files;
- current HEAD and `origin/main`;
- `git status --porcelain`.

The snapshot must not read or hash environment-file contents.

## Stage 2 — Immutable source capsule

Exact future mechanism:

```text
git archive --format=tar <reviewed-commit>
tar -xf - -C <temporary-source-directory>
```

Requirements:

- archive creation occurs from the exact reviewed commit;
- extraction target is empty;
- extracted tracked-path inventory is compared with `git ls-tree -r --name-only`;
- archive and extracted-tree metadata are hashed;
- the original repository remains read-only by policy;
- no Git checkout, worktree mutation, or branch operation occurs.

## Stage 3 — Disposable dependency capsule

Selected future mechanism:

```text
/bin/cp -cR <repository>/node_modules <temporary-root>/dependencies/node_modules
```

`cp -cR` is selected as the APFS clone candidate because it can create a copy-on-write disposable tree without writing into the original dependency directory.

A future static capability preflight must prove before implementation:

- the host filesystem supports the selected clone operation;
- the command is non-interactive;
- source and destination are distinct;
- the clone contains the approved Next.js package and readiness source;
- mutations in the clone do not change source file hashes;
- the original `node_modules` remains unchanged;
- fallback to a full `ditto` or ordinary recursive copy is not automatic.

If clone capability is unavailable or unproven, the future execution must stop. It must not silently use symlinks or mutate the original dependency tree.

## Stage 4 — Opaque environment capsule

Environment values remain unauthorized for inspection or output.

The future design may use an opaque capsule only after a separate static preflight approves:

- the exact environment-file names or exported identifier allowlist;
- read-only copying or process-environment transfer;
- temporary permissions;
- no value logging, hashing, comparison, clipboard output, or artifact retention;
- deletion immediately after shutdown;
- secret scanning of logs without printing matches.

Phase 25JD does not select or authorize the environment-capsule mechanism.

State:

`ENVIRONMENT_CAPSULE_UNRESOLVED_AND_NOT_AUTHORIZED`

## Stage 5 — Build network-denial profile

Selected future mechanism:

`/usr/bin/sandbox-exec`

Planned profile semantics:

```text
(version 1)
(allow default)
(deny network*)
```

Planned build invocation shape:

```text
sandbox-exec -f <build-profile> env -i <approved-nonsecret-runtime-metadata> npm run build
```

Requirements:

- no package installation;
- `NEXT_TELEMETRY_DISABLED=1`;
- `CI=1`;
- disposable `HOME`;
- disposable npm and framework cache paths;
- no inherited proxy variables unless explicitly allowlisted;
- no raw output printed;
- bounded build time;
- bounded combined output bytes;
- process-group ownership;
- secret-like scanning before metadata is retained;
- nonzero exit or unavailable enforcement produces `FAILED_CLOSED`;
- no automatic fallback to an unsandboxed build.

A future capability preflight must verify the exact `sandbox-exec` path and fingerprint and prove the profile denies external network without requiring privilege escalation.

Phase 25JD does not run `sandbox-exec`.

## Stage 6 — Production build evidence

The future supervisor must execute only the existing build script:

`next build`

Proposed limits for later review:

- build timeout: `300 seconds`;
- maximum combined build output: `16 MiB`;
- retries: `0`;
- package installation attempts: fail closed;
- unexpected network activity: fail closed;
- raw build output retention after metadata extraction: prohibited.

Allowed metadata:

- exit classification;
- duration;
- byte count;
- SHA-256 of raw temporary output;
- secret-scan state;
- `.next` existence;
- bounded generated-artifact inventory of paths, sizes, and hashes;
- build cleanup state.

A successful build does not authorize startup.

## Stage 7 — Runtime policy dependency

The production runtime must not start until a dedicated static C01 network-policy phase is approved.

Runtime profile requirements remain unresolved because C01 may need its statically reviewed external read-only dependency behavior.

State:

`RUNTIME_NETWORK_PROFILE_BLOCKED_PENDING_25JE`

The later network policy must define:

- loopback access;
- exact allowed external destinations;
- DNS behavior;
- IP-address changes;
- proxy prohibition or allowlisting;
- unexpected-destination termination;
- startup-time egress rules;
- metadata-only connection evidence;
- no direct validation-client database commands.

## Stage 8 — Production startup plan

After all blockers are approved, the future supervisor may start only the existing production start script:

`next start`

Planned controls:

- disposable source and dependencies only;
- approved production build only;
- bind exactly to `127.0.0.1`;
- one approved port;
- Python `subprocess.Popen` with `start_new_session=True`;
- complete process-group ownership;
- stdin closed;
- raw output written only to a bounded temporary file;
- readiness marker privately normalized;
- exactly one approved marker;
- exact listener identity;
- stable process and listener interval;
- zero HTTP requests during readiness;
- immediate termination on any changed condition.

Proposed limits for later review:

- startup timeout: `90 seconds`;
- stabilization interval: `5 seconds`;
- maximum server output: `8 MiB`;
- polling interval: `250 milliseconds`;
- retries: `0`.

These values are proposed for static review only.

## Stage 9 — Single C01 request plan

The request stage remains unauthorized until the runtime network policy is approved and a fresh human authorization is supplied.

Future request invariants:

- candidate `C01` only;
- method `GET`;
- route `/api/homepage-control/published`;
- no request body;
- no cookie, authorization, or session material;
- `Accept: application/json`;
- `Connection: close`;
- one connection attempt;
- one request;
- zero retries;
- zero redirects;
- connection timeout `5 seconds`;
- response timeout `20 seconds`;
- response-body limit `1 MiB`;
- response and header values never printed;
- metadata and hashes only;
- server terminated immediately after the bounded result.

C02 remains excluded.

## Stage 10 — Cleanup and preservation proof

The future supervisor must:

1. terminate the complete process group;
2. verify the port is released;
3. delete opaque environment material;
4. delete raw build and server output after hashing and scanning;
5. delete disposable build artifacts;
6. delete disposable dependency and source capsules;
7. recompute the original repository and dependency sentinel snapshot;
8. require exact HEAD, origin, status, and file-hash identity;
9. create at most one untracked result artifact;
10. perform no commit or push.

Any cleanup or preservation mismatch produces `FAILED_CLOSED`.

## Planned evidence schema

The future result artifact may contain only:

### Identity

- reviewed commit;
- architecture and plan artifact hashes;
- manifest hash;
- tool and dependency fingerprints;
- future authorization hash and disposition.

### Build

- enforcement mechanism identity;
- exit classification;
- duration;
- output bytes and hash;
- secret-scan state;
- generated-artifact inventory hash;
- build success or fail-closed state.

### Runtime

- server-started state;
- readiness-marker count;
- time to marker;
- stabilization duration;
- process and listener counts;
- request-issued state;
- bounded HTTP status and metadata;
- response and header hashes;
- server termination and port-release states.

### Preservation

- original repository unchanged;
- original dependency sentinels unchanged;
- temporary workspace deleted;
- raw outputs deleted;
- commit and push not performed.

## Named fail-closed codes

The future implementation plan must preserve at least these codes:

- `REPOSITORY_IDENTITY_MISMATCH`
- `PREDECESSOR_ARTIFACT_MISMATCH`
- `DEPENDENCY_IDENTITY_MISMATCH`
- `HOST_TOOL_IDENTITY_MISMATCH`
- `TEMPORARY_ROOT_UNSAFE`
- `SOURCE_ARCHIVE_MISMATCH`
- `DEPENDENCY_CLONE_UNAVAILABLE`
- `DEPENDENCY_CLONE_INDEPENDENCE_UNPROVEN`
- `ORIGINAL_DEPENDENCY_TREE_CHANGED`
- `ENVIRONMENT_CAPSULE_NOT_APPROVED`
- `BUILD_NETWORK_ENFORCEMENT_UNAVAILABLE`
- `BUILD_NETWORK_DENIAL_UNPROVEN`
- `BUILD_TIMEOUT`
- `BUILD_NONZERO_EXIT`
- `BUILD_OUTPUT_LIMIT_EXCEEDED`
- `BUILD_SECRET_SCAN_TRIGGERED`
- `BUILD_ARTIFACT_INVENTORY_INVALID`
- `RUNTIME_NETWORK_POLICY_NOT_APPROVED`
- `STARTUP_TIMEOUT`
- `SERVER_NONZERO_EXIT`
- `READINESS_MARKER_MISSING`
- `MULTIPLE_READINESS_MARKERS`
- `LISTENER_BINDING_MISMATCH`
- `PROCESS_IDENTITY_CHANGED`
- `SERVER_EXITED_DURING_STABILIZATION`
- `REQUEST_CONNECTION_FAILURE`
- `REQUEST_RESPONSE_FAILURE`
- `HTTP_STATUS_NOT_SUCCESS`
- `RESPONSE_LIMIT_EXCEEDED`
- `RESPONSE_SECRET_SCAN_TRIGGERED`
- `SERVER_TERMINATION_FAILED`
- `PORT_RELEASE_FAILED`
- `TEMPORARY_CLEANUP_FAILED`
- `ORIGINAL_REPOSITORY_CHANGED`
- `UNEXPECTED_INTERNAL_FAILURE`

No automatic retry is allowed for any code.

## Authorization ledger

The Phase 25IW authorization SHA-256 `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473` remains `CONSUMED_AND_NOT_REUSABLE`.

The Phase 25IZ authorization SHA-256 `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080` remains `CONSUMED_AND_NOT_REUSABLE`.

Phase 25JD creates no new authorization.

A future authorization is invalid until all static implementation, capability, network-policy, and preflight gates are approved.

## Implementation decision

Implementation plan:

`READY_FOR_STATIC_REVIEW`

Harness implementation:

`NOT_AUTHORIZED`

Dependency clone execution:

`NOT_AUTHORIZED`

Build network enforcement test:

`NOT_AUTHORIZED`

Application build:

`NOT_AUTHORIZED`

Production startup:

`NOT_AUTHORIZED`

C01 request:

`NOT_AUTHORIZED`

C02:

`NOT_AUTHORIZED`

Successful runtime validation:

`NOT_ACHIEVED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Safe successor

The safe successor is:

**Phase 25JE — C01 Runtime Network Policy and Opaque Environment Capsule Static Design Gate**

Phase 25JE may define:

- runtime destination derivation;
- loopback and external egress allowlisting;
- DNS and address-change behavior;
- opaque environment-capsule handling;
- startup-time network rules;
- metadata-only connection evidence;
- fail-closed unexpected-destination rules.

Phase 25JE must not:

- inspect or print environment values;
- execute `sandbox-exec`;
- test network access;
- build or start the application;
- invoke C01 or C02;
- access a live database;
- install packages;
- implement the harness;
- modify source code;
- authorize execution;
- begin Batch D;
- authorize operational reactivation or public launch.

A later host-capability preflight must separately prove APFS clone independence and build-network denial before implementation or execution.

## Gemini senior-review questions

Gemini should approve Phase 25JD only if all answers are affirmative:

1. Is Phase 25JD anchored to exact Phase 25JC commit `a90c14ba8f9bde7bb8cdc87878a57532925805ec`?
2. Is the approved Phase 25JC artifact identity preserved?
3. Are host tools, package identities, scripts, Next.js, and readiness-source identities recorded statically?
4. Is the planned implementation split into a parser-safe shell gate and Python supervisor?
5. Is the temporary workspace outside the repository with explicit cleanup?
6. Is the source capsule based on `git archive` of the reviewed commit?
7. Is `cp -cR` selected only as a future APFS clone candidate requiring capability proof?
8. Is automatic fallback to symlinks or an ordinary mutable dependency tree prohibited?
9. Is the environment capsule explicitly unresolved and unauthorized?
10. Is `sandbox-exec` selected as the future build-network mechanism without being executed?
11. Is unsandboxed fallback prohibited?
12. Are the build and startup commands limited to the existing package scripts?
13. Is production startup blocked until a separate C01 runtime network policy is approved?
14. Are exact timeouts, byte limits, process ownership, cleanup, evidence fields, and named failure codes planned?
15. Are raw logs, environment values, response bodies, header values, and database rows prohibited?
16. Are zero retries required?
17. Are both prior authorizations preserved as consumed and non-reusable?
18. Is Phase 25JE limited to static network and environment-capsule design?
19. Are implementation, build, startup, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
20. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD static implementation plan: 100%
- Phase 25JD Gemini review: pending
- Harness implementation: not authorized
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
