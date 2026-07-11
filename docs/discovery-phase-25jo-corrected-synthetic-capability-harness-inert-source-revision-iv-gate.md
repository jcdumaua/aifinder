# Phase 25JO — Corrected Synthetic Capability Harness Inert Source Revision IV Gate

## Phase identity

- Phase: `25JO`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert source revision IV
- Approved predecessor phase: `25JN`
- Approved predecessor commit: `ed75bde9aee91f741c437dfa9925a6c2d96df432`
- Phase 25JN artifact SHA-256: `8bfc8e849c239f4a5c91d7842d4bb44281e75aed53bba47dc759dd17c64fd9ee`
- Phase 25JO outer package-manifest SHA-256: `456a75d7fb3bf2224502ae51df7d3c6494a8643828d6ba3b068c5835a54d5213`
- Phase 25JO root-trust-manifest SHA-256: `7e6b180a36c4f9764c5a7bd013a00da3d1d8abd7e055ef2801a085f93036b37c`
- Phase 25JO bootstrap-manifest SHA-256: `fbe40d9b4043b66d04b9b152e24d879f1db2b527d693ce378e4ac5daa6e0620e`
- Phase 25JO launcher SHA-256: `c172612bbf39a016f9ddf3ef825059be04e1c7fdb8dbcd53b5e904cf50195e21`
- Phase 25JO coordinator SHA-256: `cd0ca96a5e1d9eb9c874475bb7c900593170b3ecde44d25465293584059e7800`
- Phase 25JO defect-closure matrix SHA-256: `67e33a5b881a0fec92d42b269a6652df0ba46f9fe46a880c1fe65fc5035cf23b`
- Source execution in this phase: `NONE`
- Source parsing in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JO creates a new static non-executable Revision IV package addressing findings `JN-B01` through `JN-B17`.

Every component remains a mode-`0644` text snapshot. The Phase 25JM Revision III package remains unchanged historical evidence.

## Revision IV architecture

Revision IV removes the wrapper and supervisor layers.

The runtime design is reduced to:

1. a small Python launcher;
2. one Python coordinator;
3. immutable manifests, contract, schemas, policy and profiles.

This removes duplicated helper APIs, intermediate result files and unauthenticated wrapper-to-supervisor transitions.

## Package identities

| Inert component | SHA-256 |
|---|---|
| `aifinder-phase-25jo-authorization-schema-v5.json.txt` | `0021d6cd39f7d998931aac4527f508753e416761ef94652735e779298532249c` |
| `aifinder-phase-25jo-bootstrap-manifest-v5.json.txt` | `fbe40d9b4043b66d04b9b152e24d879f1db2b527d693ce378e4ac5daa6e0620e` |
| `aifinder-phase-25jo-contract-v5.json.txt` | `4ad7c40ebf25007f291fcb62bc9afdf3c8ba4d7405ad91d0edd082ae2bfa2eb2` |
| `aifinder-phase-25jo-coordinator-v5.py.txt` | `cd0ca96a5e1d9eb9c874475bb7c900593170b3ecde44d25465293584059e7800` |
| `aifinder-phase-25jo-defect-closure-matrix.md` | `67e33a5b881a0fec92d42b269a6652df0ba46f9fe46a880c1fe65fc5035cf23b` |
| `aifinder-phase-25jo-deny-all-v5.sb.txt` | `04751710d8d0c997b6c1be0a24387ae283270d4a626e4f3379fdb60f7615eab4` |
| `aifinder-phase-25jo-exact-endpoint-v5.sb.txt` | `25e189bacf38a39ed1646ab13901ac39614b3abac2fa0c3e3ffd133644f3725f` |
| `aifinder-phase-25jo-execution-envelope-schema-v5.json.txt` | `2b1baf0e0c340f35b4a165017ad81d2843545cf31615e5c296e3d462eb87b3ba` |
| `aifinder-phase-25jo-launcher-v5.py.txt` | `c172612bbf39a016f9ddf3ef825059be04e1c7fdb8dbcd53b5e904cf50195e21` |
| `aifinder-phase-25jo-ledger-policy-v5.json.txt` | `52fb0b98004f068b980c3efd683d09c3b2e165314a5efc12fc1f8c73e169d053` |
| `aifinder-phase-25jo-loopback-v5.sb.txt` | `031cd88a5d6425d2cabbaff25ebf101249eda5aaca92d8bba3b7348da237171e` |
| `aifinder-phase-25jo-resolver-v5.sb.txt` | `cce26d20ac8b3f8571c905de4b96250d7de30fcd9eb1a5b852cbaa330503ddb1` |
| `aifinder-phase-25jo-result-schema-v5.json.txt` | `25863cc20723a74c0b8656ce5a4e21368be4168dfe564b9d269cf03bc320db8d` |
| `aifinder-phase-25jo-root-trust-manifest-v5.json.txt` | `7e6b180a36c4f9764c5a7bd013a00da3d1d8abd7e055ef2801a085f93036b37c` |

Outer package-manifest SHA-256:

`456a75d7fb3bf2224502ae51df7d3c6494a8643828d6ba3b068c5835a54d5213`

## Hard execution blocks

Launcher:

`EXECUTION_ENABLED = False`

Coordinator:

`EXECUTION_ENABLED = False`

Execution envelope:

`NOT_CREATED`

Authorization:

`NOT_CREATED`

No source can execute or materialize in its current state.

## De-circularized identities

The launcher does not embed an execution-envelope hash.

A future separately approved operator gate must authenticate the fixed launcher and the execution envelope before invocation.

The execution envelope binds the already fixed:

- launcher SHA-256;
- root-manifest SHA-256;
- bootstrap-manifest SHA-256;
- coordinator SHA-256;
- authorization SHA-256.

The launcher verifies those one-direction bindings. No envelope identity is embedded back into the launcher.

The authorization contains no self-hash field. Its complete verified file SHA-256 is calculated externally and used directly as the durable-ledger consumption key.

## Descriptor-authenticated coordinator execution

The launcher:

- opens and hashes itself;
- opens and hashes the execution envelope and authorization;
- opens and verifies the root manifest and coordinator;
- creates a private bootstrap directory;
- copies the coordinator with complete-write verification;
- opens the coordinator by descriptor;
- invokes `/usr/bin/python3` through `/dev/fd`;
- captures coordinator stdout directly;
- strictly validates the prefinal result.

No wrapper or supervisor path is executed.

## Control/work isolation

The coordinator creates:

- an immutable control root, mode `0500`;
- a writable work root, mode `0700`.

Trust artifacts and profiles reside only in the control root.

Synthetic fixtures, probe sources, rendered profiles and per-capability results reside only in the work root.

Sandbox profiles:

- cannot read the control root;
- can read only an explicit probe file;
- can write only a dedicated capability result directory;
- cannot access the launcher result channel.

## Strict result channel

There is no `inner-result.json` path.

The coordinator retains CAP-01 through CAP-12 evidence in memory and writes one prefinal JSON object to stdout captured directly by the launcher.

The launcher requires:

- exact prefinal keys;
- exact schema version;
- zero retries;
- exact CAP-01 through CAP-12 order;
- every capability state `PASS`;
- process, listener and repository disposition `PASS`;
- control and work cleanup `PASS`;
- consumed authorization disposition.

Only after strict validation and bootstrap cleanup does the launcher append CAP-13 and emit the authoritative result.

## Identity-bound cleanup

Control, work and bootstrap roots retain:

- parent directory descriptors;
- opened directory descriptors;
- device/inode identity.

Cleanup:

- revalidates the opened object;
- removes entries descriptor-relatively;
- removes the original directory name through its trusted parent descriptor;
- verifies that the original inode is no longer linked at that name.

CAP-13 includes control-root, work-root and bootstrap-root cleanup states.

## Trusted ledger root

The launcher clears `HOME` for child execution.

The coordinator resolves the current account home through:

`pwd.getpwuid(os.getuid()).pw_dir`

The canonical ledger is derived only from that trusted account record:

`Library/Application Support/AiFinder/authorization-ledger`

The envelope and authorization must match that exact absolute path.

Ledger entry creation uses the SHA-256 of the complete authorization bytes, directory-relative `O_EXCL|O_NOFOLLOW`, complete writes, and fsync.

## Process ownership

The coordinator records:

- PID;
- PPID;
- PGID;
- process start token.

Immediately before each process-group signal, it re-reads those values and refuses to signal if ownership cannot be proven.

## Defect-closure matrix

The package includes:

`aifinder-phase-25jo-defect-closure-matrix.md`

Matrix SHA-256:

`67e33a5b881a0fec92d42b269a6652df0ba46f9fe46a880c1fe65fc5035cf23b`

All findings `JN-B01` through `JN-B17` have a Revision IV static disposition.

## Phase decision

Revision IV inert package:

`READY_FOR_STATIC_REVIEW`

Revision III package:

`PRESERVED_UNCHANGED`

Execution sentinels:

`HARD_BLOCKED`

Execution envelope:

`NOT_CREATED`

Authorization:

`NOT_CREATED`

Source parsing:

`NOT_PERFORMED`

Syntax validation:

`NOT_PERFORMED`

Sandbox-profile parsing:

`NOT_PERFORMED`

Materialization:

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

**Phase 25JP — Revision IV Inert Harness Static Source Review Gate**

Phase 25JP may review only the exact Revision IV launcher, coordinator, manifests, contract, schemas, policy, profiles and defect-closure matrix.

Phase 25JP must not:

- modify a snapshot;
- remove an execution sentinel;
- create an execution envelope or authorization;
- create executable files;
- parse Python source;
- run syntax checks;
- parse or launch sandbox profiles;
- materialize runtime files;
- consume authorization;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- lint, build or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JO only if all answers are affirmative:

1. Is Phase 25JO anchored to exact Phase 25JN commit `ed75bde9aee91f741c437dfa9925a6c2d96df432`?
2. Is the Phase 25JN artifact identity preserved?
3. Are all Revision IV components new mode-`0644` text snapshots?
4. Are launcher and coordinator hard-blocked?
5. Is the launcher-envelope hash cycle removed?
6. Is the authorization self-hash field removed?
7. Is the wrapper/supervisor architecture removed?
8. Does every bootstrap identity match across launcher, envelope, root and coordinator?
9. Is coordinator execution descriptor-authenticated immediately before launch?
10. Are immutable control and writable work roots separated?
11. Are sandbox profiles unable to access trust and result artifacts?
12. Is the result channel pathless and launcher-captured?
13. Does the launcher strictly validate the entire prefinal contract?
14. Are cleanup operations descriptor- and inode-bound?
15. Is launcher finalization unconditional and non-reentrant?
16. Is trusted home resolved from the account database rather than `HOME`?
17. Do all file and probe writes use complete-write loops?
18. Is the contract checked against one exact canonical object?
19. Are exact bootstrap and root file sets required?
20. Are all trust reads descriptor-based?
21. Is process ownership revalidated before signaling?
22. Does CAP-13 include control, work and bootstrap cleanup?
23. Does the defect matrix cover `JN-B01` through `JN-B17`?
24. Is Phase 25JP limited to static review?
25. Are source parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation and public launch unauthorized?
26. Does operational reactivation remain `BLOCKED`?

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
- Phase 25JL Revision II source review: 100%
- Phase 25JM corrected inert revision III: 100%
- Phase 25JN Revision III source review: 100%
- Phase 25JO corrected inert revision IV: 100%
- Phase 25JO Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
