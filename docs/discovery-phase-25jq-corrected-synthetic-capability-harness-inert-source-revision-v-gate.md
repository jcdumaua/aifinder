# Phase 25JQ — Corrected Synthetic Capability Harness Inert Source Revision V Gate

## Phase identity

- Phase: `25JQ`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert source revision V
- Approved predecessor phase: `25JP`
- Approved predecessor commit: `5f86522eb76a4fa0c7faa468f249f9618e0433ae`
- Phase 25JP artifact SHA-256: `180da4b94145ee73001d6a949723e895f6449700a65937fb359d07ac9e2b4c01`
- Phase 25JQ outer package-manifest SHA-256: `4b90a87981dc82410da6c6e3434e9d16e9c79d99caaee0b9331a6007e1e5718a`
- Phase 25JQ root-trust-manifest SHA-256: `ac38b3a21128b718ac76601bd984f64689b7e9f4fba0f9543fa24cddb9d9d1c9`
- Phase 25JQ bootstrap-manifest SHA-256: `0b89cb5ff863199456f4ecf7294549f053e23160af96630c9c55cadb8f9f5bf5`
- Phase 25JQ launcher SHA-256: `23d526cd1a537d19b14ab473eb8f777afb5934884f00b427b0adfbc8b1a49486`
- Phase 25JQ coordinator SHA-256: `a840cdbd9f00ae2aaee177d345d9187e52ddc0fb5dcb0c2281ce04ea9d7f747f`
- Phase 25JQ probe SHA-256: `75a295549fce1df352b83f5db084f2fd85651103692d200a166185b6df21be14`
- Phase 25JQ defect-closure matrix SHA-256: `f56c359bb1a4bb487fb5e51bc09f77ff40da23df0d3384574ae350090ff89aea`
- Source execution in this phase: `NONE`
- Source parsing in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JQ creates a new mode-`0644`, non-executable Revision V package addressing `JP-B01` through `JP-B17`.

The Phase 25JO Revision IV package remains unchanged historical review evidence.

## Package identities

| Inert component | SHA-256 |
|---|---|
| `aifinder-phase-25jq-authorization-schema-v6.json.txt` | `96ce718dee40f141e9dd656f0dec6a3483ef1e8ff39eb299e66ae0f79ab7cb77` |
| `aifinder-phase-25jq-bootstrap-manifest-v6.json.txt` | `0b89cb5ff863199456f4ecf7294549f053e23160af96630c9c55cadb8f9f5bf5` |
| `aifinder-phase-25jq-contract-v6.json.txt` | `76a7e356c12c9ac367642af6bf20eead71660aff61476cf274cd7109cec38d7b` |
| `aifinder-phase-25jq-coordinator-v6.py.txt` | `a840cdbd9f00ae2aaee177d345d9187e52ddc0fb5dcb0c2281ce04ea9d7f747f` |
| `aifinder-phase-25jq-defect-closure-matrix.md` | `f56c359bb1a4bb487fb5e51bc09f77ff40da23df0d3384574ae350090ff89aea` |
| `aifinder-phase-25jq-deny-all-v6.sb.txt` | `48ca61fe03db9757ade204756c5678d0cb4d93c3062072408b9fb3e82c7caf92` |
| `aifinder-phase-25jq-exact-endpoint-v6.sb.txt` | `8464c5163cde03d03574e6dfa89b0c556fc065a0f85d49bb1a2e5bc8bd1fa607` |
| `aifinder-phase-25jq-execution-envelope-schema-v6.json.txt` | `028a2147e5e9c12c5df9d6797d0d33e4dfe4862b66e6a1a4b3278cb4e4980f69` |
| `aifinder-phase-25jq-launcher-v6.py.txt` | `23d526cd1a537d19b14ab473eb8f777afb5934884f00b427b0adfbc8b1a49486` |
| `aifinder-phase-25jq-ledger-policy-v6.json.txt` | `0868d521ae3fbfed485a42338c7778b77be0d43278532182b602d3e10a3eb2e5` |
| `aifinder-phase-25jq-loopback-v6.sb.txt` | `11b65dbb8e7b93ef1c60243efb9117118b262bff01d7d7563690bea3f0e6d1e2` |
| `aifinder-phase-25jq-probe-v6.py.txt` | `75a295549fce1df352b83f5db084f2fd85651103692d200a166185b6df21be14` |
| `aifinder-phase-25jq-resolver-v6.sb.txt` | `1498a93fa47d178a74fdac6e9edca7089d3548a3fa0f241c2a47d38a964d145c` |
| `aifinder-phase-25jq-result-schema-v6.json.txt` | `df725c6e79dddc63e7ecc987756487ad94b7179eafbb272d24c41b97039fa96c` |
| `aifinder-phase-25jq-root-trust-manifest-v6.json.txt` | `ac38b3a21128b718ac76601bd984f64689b7e9f4fba0f9543fa24cddb9d9d1c9` |

Outer package-manifest SHA-256:

`4b90a87981dc82410da6c6e3434e9d16e9c79d99caaee0b9331a6007e1e5718a`

## Hard execution blocks

Launcher:

`EXECUTION_ENABLED = False`

Coordinator:

`EXECUTION_ENABLED = False`

Probe:

`EXECUTION_ENABLED = False`

Execution envelope:

`NOT_CREATED`

Authorization:

`NOT_CREATED`

## Revision V corrections

### Writable-then-sealed construction

Bootstrap and control directories are created as mode `0700`.

Files are written with complete-write loops, verified, fsynced, and only then are the directories sealed to mode `0500`.

### Child-visible private paths

The coordinator uses randomized real private paths beneath a private run namespace for child arguments.

Only the launcher-to-coordinator transition uses `/dev/fd`, and that exact coordinator descriptor is explicitly inherited with `pass_fds`.

### Rename-resistant cleanup

Every private directory retains:

- parent descriptor;
- opened directory descriptor;
- device;
- inode;
- original name.

Cleanup requires the parent name to still identify the original inode before `rmdir`, then requires the opened original inode to have link count zero.

Capability profiles deny all file writes, so capability processes cannot rename the run, control, work, or bootstrap namespace.

### Unconditional finalization

Launcher and coordinator install handlers for `SIGINT`, `SIGTERM`, and `SIGHUP`.

Every supported completion and failure path routes through one guarded finalizer.

`SIGKILL` is explicitly outside the finalization guarantee.

### Bounded coordinator capture

The launcher:

- streams coordinator stdout and stderr;
- enforces separate byte limits;
- enforces a suite deadline;
- scans rolling boundaries for the synthetic secret canary;
- owns and revalidates the coordinator process group;
- terminates and reaps it before final result construction.

### Exit and result parity

`PREFINAL_PASS` requires coordinator return code zero.

`PREFINAL_FAILED_CLOSED` requires a nonzero return code.

Any mismatch fails closed.

### Descriptor-bound probe evidence

Each probe role receives its own inherited socketpair descriptor and nonce.

Evidence is:

- length-prefixed;
- bounded;
- read from the same descriptor;
- role-specific;
- nonce-bound;
- not stored in a sandbox-writable path.

### Process and listener ownership

Every top-level process group is registered immediately.

Local and coordinator-wide finalizers:

- revalidate PID, PPID, PGID, and start token;
- signal only a proven owned group;
- reap the parent;
- require the entire PGID to be absent.

Listeners are closed and exact address/port rebinding is required.

### CAP-07 claim correction

CAP-07 now asserts:

`EXACT_IPV4_ADDRESS_PORT_PARENT_ONLY`

It does not claim transport-specific enforcement and no longer requires unsupported UDP denial.

### Exact manifests and ledger binding

Root and bootstrap manifests require exact:

- schema versions;
- phase;
- package state;
- component sets;
- record keys;
- mode `0644`;
- SHA-256 format.

The ledger-policy digest in the envelope and authorization must equal the exact root-manifest ledger-policy component digest.

### Accurate authorization state

Authorization consumption is tracked as explicit state.

After durable ledger fsync succeeds, every downstream failure reports:

`CONSUMED_AND_NOT_REUSABLE`

### Canonical prefinal validation

The launcher validates:

- exact prefinal keys;
- exact schema version;
- exact capability prefix and metadata keys;
- bounded metadata;
- PASS/failure consistency;
- cleanup and release states;
- failure-code bounds;
- authorization disposition;
- coordinator exit-code parity.

CAP-13 is added only after run, control, work, and bootstrap cleanup disposition is known.

## Defect-closure matrix

The package includes:

`aifinder-phase-25jq-defect-closure-matrix.md`

Matrix SHA-256:

`f56c359bb1a4bb487fb5e51bc09f77ff40da23df0d3384574ae350090ff89aea`

All findings `JP-B01` through `JP-B17` have Revision V static dispositions.

## Phase decision

Revision V inert package:

`READY_FOR_STATIC_REVIEW`

Revision IV package:

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

**Phase 25JR — Revision V Inert Harness Static Source Review Gate**

Phase 25JR may review only the exact Revision V launcher, coordinator, probe, manifests, contract, schemas, policy, profiles, and defect-closure matrix.

Phase 25JR must not modify a snapshot, remove an execution sentinel, parse or execute Python, run syntax checks, parse or launch sandbox profiles, materialize files, create or consume authorization, create fixtures, invoke clone or sandbox operations, open listeners or sockets, resolve DNS, inspect environment values, lint, build, start AiFinder, invoke C01 or C02, access a database or external service, install packages, begin Batch D, or authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JQ only if all answers are affirmative:

1. Is Phase 25JQ anchored to exact Phase 25JP commit `5f86522eb76a4fa0c7faa468f249f9618e0433ae`?
2. Is the Phase 25JP artifact identity preserved?
3. Are all Revision V components new mode-`0644` inert snapshots?
4. Are launcher, coordinator, and probe hard-blocked?
5. Are bootstrap and control roots writable during construction and sealed only after verification?
6. Are child-visible private paths used instead of non-inherited `/dev/fd` directory paths?
7. Is launcher-to-coordinator `/dev/fd` execution explicitly descriptor-inherited?
8. Does cleanup verify parent-name identity and zero link count on the original inode?
9. Do launcher and coordinator clean up on every supported failure and signal path?
10. Is `SIGKILL` explicitly excluded rather than falsely covered?
11. Is coordinator stdout/stderr capture bounded, timed, and secret-scanned?
12. Is coordinator exit-code/result parity mandatory?
13. Is each probe role bound to a dedicated descriptor and nonce?
14. Are probe results pathless and bounded?
15. Are all process groups globally owned, revalidated, reaped, and proven empty?
16. Are listeners closed and rebound?
17. Is CAP-07 transport-neutral and limited to the supported endpoint claim?
18. Are manifests exact canonical objects with mode and digest validation?
19. Is ledger-policy identity bound to the root-manifest component record?
20. Is authorization consumption disposition accurate after downstream failure?
21. Is prefinal validation exact, bounded, and contradiction-resistant?
22. Does CAP-13 include run, control, work, and bootstrap cleanup?
23. Does the closure matrix cover `JP-B01` through `JP-B17`?
24. Is Phase 25JR limited to static review?
25. Are parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
26. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JO corrected inert revision IV: 100%
- Phase 25JP Revision IV source review: 100%
- Phase 25JQ corrected inert revision V: 100%
- Phase 25JQ Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
