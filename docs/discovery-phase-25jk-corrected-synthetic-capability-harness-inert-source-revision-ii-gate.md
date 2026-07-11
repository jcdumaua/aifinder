# Phase 25JK — Corrected Synthetic Capability Harness Inert Source Revision II Gate

## Phase identity

- Phase: `25JK`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert source revision II
- Approved predecessor phase: `25JJ`
- Approved predecessor commit: `73bdadc47d35ecf2c2dbae0aeb1eb32799a7bf49`
- Phase 25JJ artifact SHA-256: `b705bc1150915c79075887b6e0a470bf02c5fdf542e4e5f0094c2c55da84da16`
- Phase 25JK outer package-manifest SHA-256: `f34ea860b915730c3c603c199237a3374fed5f79ed0127e46be8a51e72a96996`
- Phase 25JK inner package-manifest SHA-256: `2fe439fe658f412b5a4dae11833fd0eafd635039b398f4cd4987e1e0dfe2c771`
- Phase 25JK launcher SHA-256: `9eeaf4af8d068207fbd9821500eba76038fd3010d1c138a134952a178bb3a7ea`
- Phase 25JK defect-closure matrix SHA-256: `fb0dd9ed4f53d82e5d49359779b0707621cb56d80cedbd70712eeba7f8ff1be6`
- Source execution in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Authorization creation or consumption in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JK creates a second corrected, non-executable static source package addressing findings `JJ-B01` through `JJ-B17`.

Every component remains a mode-`0644` text snapshot. The Phase 25JI package remains unchanged historical evidence.

The corrected supervisor contains inert implementation logic for CAP-01 through CAP-12. CAP-13 is implemented by the independent exception-safe finalizer. No capability method remains an architecture-only placeholder.

## Package identities

| Revision II inert component | SHA-256 |
|---|---|
| `aifinder-phase-25jk-authorization-schema-v3.json.txt` | `eeff83770f68edfab8e3cd1c80a23480d386b086d9d3df838fee8032ead91a2f` |
| `aifinder-phase-25jk-component-schema-v3.json.txt` | `913c04f1833f8a66b0cd8ab1557dd60005ac3307a555e592c39679a72fbe7aaf` |
| `aifinder-phase-25jk-defect-closure-matrix.md` | `fb0dd9ed4f53d82e5d49359779b0707621cb56d80cedbd70712eeba7f8ff1be6` |
| `aifinder-phase-25jk-deny-all-v3.sb.txt` | `66da92e8cc5e38320d8bb467cf83728c5db96f1f5dc33be38e5e24e72c1880b9` |
| `aifinder-phase-25jk-exact-endpoint-v3.sb.txt` | `c728f29c5e9acc4a15b7eec4152266db8ea99d9573edbe9f5552da4712f1be53` |
| `aifinder-phase-25jk-launcher-v3.sh.txt` | `9eeaf4af8d068207fbd9821500eba76038fd3010d1c138a134952a178bb3a7ea` |
| `aifinder-phase-25jk-ledger-policy-v3.json.txt` | `670d86b43e25b02131a66af8ddeafd97e21011f31cc3f791833b25150cdeb30f` |
| `aifinder-phase-25jk-loopback-v3.sb.txt` | `030c2d7ea90ad028cd37820f6246cb20876d052ff886da010a80c3f87d820085` |
| `aifinder-phase-25jk-package-manifest-v3.json.txt` | `2fe439fe658f412b5a4dae11833fd0eafd635039b398f4cd4987e1e0dfe2c771` |
| `aifinder-phase-25jk-resolver-v3.sb.txt` | `6e153225903d0c48b0d5fa43d2f163a12cdedb884a5eb819ebba3f47b7e98cc3` |
| `aifinder-phase-25jk-supervisor-v3.py.txt` | `e3c7ce2692de8338b6cd79dbc3593480c8fa1e651dd8357adee8bb7ad579718b` |
| `aifinder-phase-25jk-wrapper-v3.sh.txt` | `c321223f0b81a9432fc278ac7b1fb0c47b8fccc53936d5be37b663b33226f24f` |

Outer static package-manifest SHA-256:

`f34ea860b915730c3c603c199237a3374fed5f79ed0127e46be8a51e72a96996`

## Hard execution blocks

Launcher:

`EXECUTION_ENABLED="NO"`

Wrapper:

`EXECUTION_ENABLED="NO"`

Supervisor:

`EXECUTION_ENABLED = False`

Launcher execution-envelope identity:

`UNSET_NOT_AUTHORIZED`

The package cannot execute or materialize runtime files in its current state.

## Trust-chain revision

The corrected trust sequence is:

1. a future operator gate verifies the approved launcher SHA-256;
2. the launcher embeds and verifies the inner package-manifest SHA-256;
3. the launcher verifies and immutably copies every manifest-listed component;
4. the launcher verifies the wrapper SHA-256 after materialization;
5. the wrapper verifies the materialized package and exact repository state;
6. the supervisor verifies the strict package and authorization schemas;
7. authorization is consumed in a durable external ledger before synthetic state.

The launcher is intentionally small and independently identified.

## Fail-closed shell revision

The launcher and wrapper:

- use a minimal fixed `PATH`;
- use absolute command paths;
- clear shell and Python injection variables;
- use explicit checked returns for every guard;
- install cleanup before materialization;
- preserve primary and cleanup status separately;
- verify run-root deletion;
- fail the overall gate when cleanup fails;
- never trust executable permission on the snapshots.

## Immutable materialization revision

The launcher design:

- rejects symlinks and non-regular sources;
- verifies current-user ownership;
- rejects group/world-writable source files;
- opens sources with `O_NOFOLLOW`;
- verifies exact hashes before copying;
- copies the package manifest, every component, the execution envelope, and authorization into one private run root;
- creates destination files with `O_EXCL|O_NOFOLLOW`;
- sets materialized files to mode `0400`;
- fsyncs each file and the run-root directory;
- permits runtime reads only from the private run root.

Profiles and authorization are not read from the external package after materialization.

## Durable authorization revision

The package includes strict authorization and ledger-policy schemas.

The future authorization must bind:

- exact baseline;
- launcher SHA-256;
- inner package-manifest SHA-256;
- exact component hashes;
- exact CAP-01 through CAP-13 order;
- exact limits;
- one attempt;
- zero retries;
- exact allowed actions;
- exact prohibited actions;
- durable ledger root;
- consume-before-first-state semantics.

The ledger must be precreated outside the repository and outside `/private/tmp`, owned by the current user, mode `0700`, non-symlinked, and durable.

Consumption uses `O_EXCL|O_NOFOLLOW`, mode `0600`, file fsync, and directory fsync. Runtime cleanup must not delete a consumed marker.

Current execution-envelope and authorization state:

`UNSET_NOT_AUTHORIZED`

## Process and streaming revision

The supervisor design:

- retains each `Popen` in `OwnedProcess`;
- keeps ownership registered until termination, wait/reap, process-group absence, and descendant absence all succeed;
- uses independent `/bin/ps` enumeration for relationship evidence;
- retains rolling secret-scan overlap across read chunks;
- terminates and reaps on output limit, secret trigger, timeout, or unexpected stream failure;
- records process release independently from capability disposition.

## Network and process evidence revision

The static contract requires:

- atomic probe-result writes;
- individual parent, child, and grandchild results;
- PID, PPID, PGID, and declared-child cross-links;
- independent process enumeration;
- permission-based denial evidence for every descendant;
- exact fixed canary bytes for allowed listeners;
- rejection of missing, truncated, or extra payloads;
- listener release verification by controlled rebind;
- claim labels no broader than tested dimensions.

CAP-06 and CAP-07 remain parent-only unless descendant and alternate-address dimensions are explicitly proven.

## Exception-safe CAP-13 revision

Finalization:

- catches process-release failures independently;
- continues listener cleanup after process failure;
- continues repository preservation checks after earlier cleanup failure;
- records every cleanup failure code;
- never masks cleanup failure with a primary capability result;
- determines overall success only after all independent dispositions pass.

## Defect-closure matrix

The package includes:

`aifinder-phase-25jk-defect-closure-matrix.md`

Matrix SHA-256:

`fb0dd9ed4f53d82e5d49359779b0707621cb56d80cedbd70712eeba7f8ff1be6`

All findings `JJ-B01` through `JJ-B17` have a Revision II static disposition.

## Phase decision

Revision II inert package:

`READY_FOR_STATIC_REVIEW`

Phase 25JI historical package:

`PRESERVED_UNCHANGED`

Launcher trust root:

`DEFINED_BUT_UNEXECUTED`

Execution sentinels:

`HARD_BLOCKED`

Authorization:

`UNSET_NOT_AUTHORIZED`

Syntax validation:

`NOT_PERFORMED`

Sandbox-profile parsing:

`NOT_PERFORMED`

Executable materialization:

`NOT_AUTHORIZED`

Synthetic capability execution:

`NOT_AUTHORIZED`

Host capabilities:

`UNPROVEN`

Application lint or build:

`NOT_AUTHORIZED`

Application startup:

`NOT_AUTHORIZED`

C01:

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

**Phase 25JL — Revision II Inert Harness Static Source Review Gate**

Phase 25JL may review the exact Revision II snapshots, schemas, manifests, launcher, wrapper, supervisor, profiles, and defect-closure matrix.

Phase 25JL must not:

- modify a snapshot;
- remove an execution sentinel;
- set an authorization or execution-envelope value;
- create an executable file;
- run shell or Python syntax checks;
- parse or launch sandbox profiles;
- materialize runtime files;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- lint, build, or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- create or consume authorization;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JK only if all answers are affirmative:

1. Is Phase 25JK anchored to exact Phase 25JJ commit `73bdadc47d35ecf2c2dbae0aeb1eb32799a7bf49`?
2. Is the Phase 25JJ artifact identity preserved?
3. Are all Revision II components new mode-`0644` text snapshots?
4. Are launcher, wrapper, and supervisor hard-blocked?
5. Is the launcher independently identified for future operator verification?
6. Do all shell guards return immediately on failure?
7. Are command paths fixed and injection variables cleared?
8. Is cleanup installed before materialization and fail-closed?
9. Are all runtime components immutably materialized into one private run root?
10. Are symlinks, ownership, mode, hashes, path escapes, and TOCTOU addressed?
11. Is authorization copied immutably and semantically schema-validated?
12. Is the authorization ledger durable, external, owner/mode checked, atomic, fsynced, and excluded from cleanup?
13. Is the component manifest strict and exact?
14. Does process ownership persist until termination, reap, group absence, and descendant absence?
15. Does streaming secret detection handle chunk boundaries?
16. Must CAP-05 validate individual parent, child, and grandchild evidence?
17. Is exact allowed-listener payload validation required?
18. Are CAP-06 and CAP-07 claims no broader than tested evidence?
19. Does CAP-10 require atomic cross-linked records and independent enumeration?
20. Is CAP-13 internally exception-safe with independent dispositions?
21. Does the matrix cover `JJ-B01` through `JJ-B17`?
22. Is Phase 25JL limited to static review?
23. Are syntax validation, profile parsing, materialization, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
24. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD implementation plan: 100%
- Phase 25JE network and environment design: 100%
- Phase 25JF static capability plan: 100%
- Phase 25JG original inert source package: 100%
- Phase 25JH original source review: 100%
- Phase 25JI corrected inert revision I: 100%
- Phase 25JJ revision I source review: 100%
- Phase 25JK corrected inert revision II: 100%
- Phase 25JK Gemini review: pending
- Syntax validation: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
