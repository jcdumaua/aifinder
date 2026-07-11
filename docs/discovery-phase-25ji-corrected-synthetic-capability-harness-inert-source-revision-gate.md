# Phase 25JI — Corrected Synthetic Capability Harness Inert Source Revision Gate

## Phase identity

- Phase: `25JI`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert source revision
- Approved predecessor phase: `25JH`
- Approved predecessor commit: `8c6f5d6eae481844e0cf49b74ab25d51363f1ce5`
- Phase 25JH artifact SHA-256: `b56091969f55515010b59e4ed479a53f389b86d470acff2c8461e216c02139db`
- Corrected package manifest SHA-256: `87bd8bdbc514fbb28c207c48e18311170d5f6428b9b5cc54b0a2d29fd5557396`
- Corrected source execution in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JI creates a new non-executable static review package that addresses findings `JH-B01` through `JH-B17`.

The original Phase 25JG snapshots remain unchanged historical inputs.

Every corrected component is stored as a mode-`0644` text snapshot. No `.sh`, `.py`, `.sb`, or executable file is created. No execution sentinel is enabled.

## Corrected package identities

| Corrected inert component | SHA-256 |
|---|---|
| `aifinder-phase-25ji-component-manifest-v2.json.txt` | `0d31ae230cf5c25a916f91ab7ea54fbe38c9a8be04180ca63a2c13167f75c1a5` |
| `aifinder-phase-25ji-defect-closure-matrix.md` | `3e48ec724dcb47d40fd988ff98bd4e55e3fdf49de7b8a21adb4a28d95881c736` |
| `aifinder-phase-25ji-deny-all-v2.sb.txt` | `66da92e8cc5e38320d8bb467cf83728c5db96f1f5dc33be38e5e24e72c1880b9` |
| `aifinder-phase-25ji-exact-address-v2-template.sb.txt` | `c924e154d1c5f3b762e3924f73fca5299d712fc5d62479f2d2cceef87fe0c89a` |
| `aifinder-phase-25ji-loopback-v2-template.sb.txt` | `030c2d7ea90ad028cd37820f6246cb20876d052ff886da010a80c3f87d820085` |
| `aifinder-phase-25ji-resolver-v2.sb.txt` | `6e153225903d0c48b0d5fa43d2f163a12cdedb884a5eb819ebba3f47b7e98cc3` |
| `aifinder-phase-25ji-shell-wrapper-v2.sh.txt` | `cea586403459e14eba9d33d6f39090241c6cc9419b60335b68a03d680b839368` |
| `aifinder-phase-25ji-supervisor-v2.py.txt` | `61a7988e7038a1c79b760e486de5d4892ba7ce7bf550425f5d9126ab3ec2b992` |

Outer package manifest SHA-256:

`87bd8bdbc514fbb28c207c48e18311170d5f6428b9b5cc54b0a2d29fd5557396`

## Execution blocks

Corrected shell sentinel:

`EXECUTION_ENABLED="NO"`

Corrected Python sentinel:

`EXECUTION_ENABLED = False`

The corrected Python `main` returns before guarded execution when the sentinel is false.

The corrected shell returns before repository verification or temporary materialization when the sentinel is not `YES`.

A later phase must create a distinct executable artifact with new hashes. Removing only the sentinels from these snapshots is prohibited.

## Authorization corrections

The corrected design:

- removes the caller-supplied expected authorization hash;
- reads authorization path and expected hash only from an immutable reviewed component manifest;
- rejects `UNSET_NOT_AUTHORIZED`;
- verifies repository and component identities before authorization consumption;
- atomically creates a non-secret consumed marker with `O_CREAT|O_EXCL`;
- consumes authorization before temporary-root creation or capability action;
- preserves the consumed marker after run cleanup;
- records only the authorization SHA-256 and disposition.

The current component manifest intentionally contains:

`UNSET_NOT_AUTHORIZED`

Therefore the package is not authorization-ready and cannot execute.

## Sandbox evidence corrections

Expected network denial is accepted only when all are true:

1. the sandbox profile passes a separate launch preflight using `/usr/bin/true`;
2. the sandboxed probe completes its non-network control file;
3. the structured result identifies a denied connection;
4. the denial uses a permission-based errno;
5. the denied listener receives no connection or payload;
6. no generic nonzero process exit is used as enforcement proof.

Allowed cases require positive listener acceptance of a fixed public canary.

Profiles use `(deny default)` and explicit candidate permissions. Their grammar and host enforcement remain `UNPROVEN`.

## Capability corrections

- CAP-05 now represents IPv4, IPv6 when supported, UDP, a non-network control operation, and child/grandchild probes.
- CAP-06 is explicitly limited to `EXACT_LOOPBACK_ENDPOINT_ONLY`.
- CAP-07 is explicitly limited to `EXACT_ADDRESS_PORT_TCP_ONLY`, with UDP denial.
- CAP-08 executes static `localhost` resolution inside a sandbox profile.
- CAP-09 remains documentation-address canonicalization only.
- CAP-10 uses parent, child, and grandchild readiness records, PGID checks, termination, and absence verification.
- CAP-11 uses active streaming limits and immediate process-group termination.
- CAP-12 scans streaming output and retains no matched text.
- CAP-13 is produced only after cleanup and repository-preservation checks.

## Repository and component guards

Before authorization consumption, the corrected design requires:

- exact HEAD and `origin/main` equal to the reviewed baseline;
- branch `main`;
- approved origin;
- clean working tree;
- ahead `0`;
- behind `0`;
- exact Phase 25JH artifact SHA-256;
- exact component-manifest SHA-256;
- exact corrected component hashes;
- non-executable component modes.

Temporary-state creation occurs only after every guard and authorization consumption succeeds.

## Bounds and final dispositions

The corrected supervisor enforces:

- suite-wide monotonic deadline;
- per-capability deadline;
- maximum concurrent listener count;
- immediate listener closure;
- active output-size limit;
- zero retries;
- sanitized unexpected failures;
- independent primary, cleanup, process-release, listener-release, and repository-preservation dispositions.

Cleanup failure cannot be masked by an earlier capability failure.

## APFS claim

The corrected package claims only:

`LOGICALLY_INDEPENDENT_DISPOSABLE_COPY`

It does not claim that copy-on-write allocation was proven.

## Defect-closure matrix

The package includes:

`aifinder-phase-25ji-defect-closure-matrix.md`

Matrix SHA-256:

`3e48ec724dcb47d40fd988ff98bd4e55e3fdf49de7b8a21adb4a28d95881c736`

All 17 findings have a documented corrected design disposition. Finding `JH-B15` remains dependent on a later separately authorized sandbox syntax and profile-launch validation.

## Phase decision

Corrected inert package:

`READY_FOR_STATIC_REVIEW`

Original Phase 25JG snapshots:

`PRESERVED_UNCHANGED`

Execution sentinels:

`HARD_BLOCKED`

Authorization binding:

`UNSET_NOT_AUTHORIZED`

Syntax validation:

`NOT_PERFORMED`

Sandbox profile parsing:

`NOT_PERFORMED`

Executable materialization:

`NOT_AUTHORIZED`

Synthetic capability execution:

`NOT_AUTHORIZED`

Host capabilities:

`UNPROVEN`

Application build:

`NOT_AUTHORIZED`

Production startup:

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

**Phase 25JJ — Corrected Inert Harness Static Source Review Gate**

Phase 25JJ may:

- review the exact corrected source and profile snapshots;
- verify the new package hashes;
- verify the defect-closure matrix;
- identify remaining defects;
- accept or reject readiness for a later syntax-validation planning phase.

Phase 25JJ must not:

- modify a corrected snapshot;
- remove an execution sentinel;
- set authorization values;
- create executable files;
- run `bash -n`;
- compile or import Python;
- parse a sandbox profile;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- build or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- authorize capability execution;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JI only if all answers are affirmative:

1. Is Phase 25JI anchored to exact Phase 25JH commit `8c6f5d6eae481844e0cf49b74ab25d51363f1ce5`?
2. Is the Phase 25JH artifact identity preserved?
3. Are the Phase 25JG historical snapshots preserved without overwrite?
4. Are all corrected components new mode-`0644` text snapshots?
5. Are both corrected execution entry points hard-blocked?
6. Is caller-controlled expected authorization hashing removed?
7. Is authorization atomically consumed before temporary-state or capability action?
8. Are repository and component identities verified before consumption?
9. Are sandbox denials proven through profile preflight, control operation, structured result, permission errno, and listener evidence?
10. Does CAP-05 include IPv4, IPv6 when supported, UDP, control, and child/grandchild probes?
11. Are CAP-06 and CAP-07 claims narrowed to the evidence they test?
12. Is CAP-08 sandboxed and limited to `localhost`?
13. Does CAP-10 prove parent-child-grandchild readiness, process-group membership, termination, and absence?
14. Are output and secret scans streaming and actively terminating?
15. Is CAP-13 finalized after cleanup with independent dispositions?
16. Are total deadlines, listener limits, exception sanitation, and side-effect ordering corrected?
17. Do profiles use deny-default candidates while remaining explicitly unproven?
18. Is APFS terminology limited to logical independence?
19. Does the defect-closure matrix cover JH-B01 through JH-B17?
20. Is Phase 25JJ limited to static review?
21. Are syntax validation, profile parsing, executable materialization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
22. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD implementation plan: 100%
- Phase 25JE network and environment design: 100%
- Phase 25JF static capability plan: 100%
- Phase 25JG original inert source package: 100%
- Phase 25JH fail-closed source review: 100%
- Phase 25JI corrected inert package: 100%
- Phase 25JI Gemini review: pending
- Syntax validation: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
