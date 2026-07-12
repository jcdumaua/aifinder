# Phase 25JX — Revision VIII Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JX`
- Batch: `C — Controlled Runtime Validation`
- Phase type: Revision VIII inert-source static review
- Approved predecessor commit: `f27817911daf465a87391895e17a74a3a54758cc`
- Phase 25JW artifact SHA-256: `0bec370096e82e40047c49f3b460920f64c9f38ece72e79977e5abf4afb2c3c2`
- Revision VIII core static-review ZIP SHA-256: `e94f4ede100e5a4450ad2e7b05b1f866c8e286387a57c2974b5768cfeaa050b8`
- Phase 25JW review-identities SHA-256: `1397c577557f555d771817f4fa3daca242c94383354876b525c83d8d6a96931d`
- Phase 25JX finding-ledger SHA-256: `05adcf1956492319f20dd5a1915c0189621e220f40884dbdb6701980b45aff41`
- Source parsing in this phase: `NONE`
- Python syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JX performs a text-only integration, trust-root, descriptor ownership, RPC reachability, evidence provenance, timeout, cleanup-finality, and authoritative-result review of the exact Phase 25JW Revision VIII package.

No Python parser, import, compiler, syntax checker, schema parser, sandbox-profile parser, materializer, execution envelope, authorization action, fixture, clone operation, listener, socket, DNS operation, application command, database, package installation, external service, C01, C02, Batch D, deployment, publishing, operational reactivation, or public launch was invoked.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JW artifact | `0bec370096e82e40047c49f3b460920f64c9f38ece72e79977e5abf4afb2c3c2` |
| Revision VIII core static-review ZIP | `e94f4ede100e5a4450ad2e7b05b1f866c8e286387a57c2974b5768cfeaa050b8` |
| Phase 25JW review identities | `1397c577557f555d771817f4fa3daca242c94383354876b525c83d8d6a96931d` |
| Root Manifest | `dbb13da94e9fc6b7fadc1028523718e69d4ef9baa3ede7a7f6baa98d2547e63b` |
| Bootstrap Manifest | `699cdc63fc43aa451e6c582da2b0aae302197c6dbd49fca369664d6993690cca` |
| Launcher | `90404d5a94a7a9e61e637fe4b586c2f5b38be014ced5039da95ad2a37c08a660` |
| Coordinator | `1b82b7b64c3ac76bd9752adbf2ab54d98865b7068ccefab95823317769cfe333` |
| Broker | `b66804fc5fbc670d0650aa2cf856060de5901ec68b97fb18f007b67cb4e75ce0` |
| Probe | `2cd4417c36f9d3e8b01acf203dac1d2be3a3b3de15e72e9cc1607b5ff435809e` |
| Inventory | `b3f63ff9d426d5bb619110f40016053ac120a16e3c050abf1138259a12666cdb` |
| Contract | `433dea6c9c0169871b673a7fbd5d8f2be9d323b70ffcc7fe3bc8777ba7449b90` |

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review completeness:

`COMPLETE_WITH_REVISION_REQUIRED`

Syntax and materialization-preflight readiness:

`BLOCKED_PENDING_REVISION_IX`

## Review decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

Exact text inspection identified `16` new critical/high blockers:

- Critical: `9`
- High: `7`

The Phase 25JW closure matrix remains a record of Revision VIII design intent, but several controls are defined without being connected to executable control flow, evidence is accepted from authorization input rather than current-attempt broker observations, and key framed reads and cleanup paths remain unbounded or incomplete.

## Finding summary

| Finding | Severity | Status | Assessment |
|---|---|---|---|
| `JX-B01` | `critical` | `OPEN` | Coordinator source and RPC descriptors are assumed but never acquired |
| `JX-B02` | `critical` | `OPEN` | Broker capability and RPC implementation is disconnected dead code |
| `JX-B03` | `critical` | `OPEN` | CAP-10, CAP-11, and CAP-12 evidence is self-attested by authorization input |
| `JX-B04` | `critical` | `OPEN` | Launcher root trust is selected by the envelope instead of pinned to the approved package |
| `JX-B05` | `critical` | `OPEN` | Authorization fields are used without runtime schema validation or path-component enforcement |
| `JX-B06` | `critical` | `OPEN` | Launcher status and broker prefinal frame reads have no absolute timeout |
| `JX-B07` | `critical` | `OPEN` | Coordinator cleanup controls only the direct PID and proves no descendant absence |
| `JX-B08` | `high` | `OPEN` | Launcher descriptor finalization is incomplete |
| `JX-B09` | `high` | `OPEN` | Managed inventory helper is not integrated into launcher control flow |
| `JX-B10` | `high` | `OPEN` | Start-token collection bypasses bounded helper capture and lacks timeout cleanup |
| `JX-B11` | `critical` | `OPEN` | Probe exit receipts trust caller-supplied child identity and exit status |
| `JX-B12` | `high` | `OPEN` | Probe FD inventory is unstable and not pre-exec authenticated |
| `JX-B13` | `high` | `OPEN` | Repository preservation is asserted without an observed snapshot |
| `JX-B14` | `high` | `OPEN` | Inventory raw-byte evidence field does not contain raw ps byte count |
| `JX-B15` | `critical` | `OPEN` | Launcher accepts broker final status without exact schema or evidence validation |
| `JX-B16` | `high` | `OPEN` | Listener and network-classification controls are not integrated |

## Detailed findings

### JX-B01 — Coordinator source and RPC descriptors are assumed but never acquired

**Severity:** `critical`

**Affected locations**

- `broker-v9.py.txt:561-586`

**Impact**

The broker passes fixed descriptors 12 and 13 to Popen without opening, duplicating, materializing, or receiving them. Coordinator launch cannot be trusted to reach exec, and the descriptor identities are not tied to the reviewed package.

**Required Revision IX correction**

Acquire the coordinator snapshot through the trusted source-directory descriptor, materialize it into a sealed or unlinked read-only descriptor, create an authenticated broker/coordinator RPC channel, bind both descriptors to exact roles, and pass only descriptors proven open.

### JX-B02 — Broker capability and RPC implementation is disconnected dead code

**Severity:** `critical`

**Affected locations**

- `broker-v9.py.txt:361-518`
- `broker-v9.py.txt:550-692`

**Impact**

child_guard, role registration, receipt validation, role release, network classification, rpc_error_response, and bounded_process are defined but never called. No broker RPC read/dispatch loop references args.rpc_fd, so the coordinator cannot request or authenticate capability operations.

**Required Revision IX correction**

Implement one bounded framed RPC loop with exact request schema checks, operation dispatch, per-request identity and nonce binding, exact failure-code preservation, shutdown state, and calls to the reviewed capability helpers.

### JX-B03 — CAP-10, CAP-11, and CAP-12 evidence is self-attested by authorization input

**Severity:** `critical`

**Affected locations**

- `coordinator-v9.py.txt:373-405`

**Impact**

The same authorization document supplies observed FD inventories, allowed FD sets, broker-group rows, and operation-release evidence. Comparing attacker-controlled claims to other attacker-controlled claims does not authenticate current-attempt capability evidence.

**Required Revision IX correction**

Accept capability evidence only from exact broker RPC responses bound to the current attempt nonce, request ID, broker identity, and operation identity. Keep authorization limited to permissions and immutable expected constraints.

### JX-B04 — Launcher root trust is selected by the envelope instead of pinned to the approved package

**Severity:** `critical`

**Affected locations**

- `launcher-v9.py.txt:386-395`

**Impact**

The launcher takes root_manifest_record from envelope bytes and then trusts the referenced root manifest and broker hash. It does not require the exact Phase 25JW root manifest, bootstrap manifest, source predecessor commit, package phase, or reviewed core identity.

**Required Revision IX correction**

Pin exact root and bootstrap identities in immutable launcher inputs or an independently verified authorization record, verify phase and predecessor fields, and reject envelope-selected replacement trust roots.

### JX-B05 — Authorization fields are used without runtime schema validation or path-component enforcement

**Severity:** `critical`

**Affected locations**

- `coordinator-v9.py.txt:371-379`
- `coordinator-v9.py.txt:197-251`

**Impact**

Coordinator json.loads output is indexed directly. ledger_entry_name is passed to openat without an in-process exact-component check; the schema regex is not executed by this code. A slash or parent-relative value could escape the intended ledger directory.

**Required Revision IX correction**

Perform exact in-process key, type, length, enum, digest, and single-path-component validation before any field is used. Reject slash, dot, parent-relative, absolute, NUL, and non-canonical ledger names.

### JX-B06 — Launcher status and broker prefinal frame reads have no absolute timeout

**Severity:** `critical`

**Affected locations**

- `launcher-v9.py.txt:454`
- `broker-v9.py.txt:615-628`

**Impact**

read_exact blocks indefinitely if a peer retains a descriptor without completing a frame. The later process wait timeout cannot run until the blocking read returns, so the advertised bounded finalization can deadlock.

**Required Revision IX correction**

Use selector-driven or dedicated continuously drained framed channels with absolute deadlines, EOF classification, byte limits, and peer termination on timeout.

### JX-B07 — Coordinator cleanup controls only the direct PID and proves no descendant absence

**Severity:** `critical`

**Affected locations**

- `broker-v9.py.txt:641-648`

**Impact**

The coordinator is not started in a dedicated registered process group. Failure cleanup signals only coordinator.pid and does not reap or prove absence of coordinator descendants.

**Required Revision IX correction**

Create a coordinator operation group, capture and revalidate PID/start token/PGID/SID, terminate the group, reap the leader, and prove group absence before broker final status.

### JX-B08 — Launcher descriptor finalization is incomplete

**Severity:** `high`

**Affected locations**

- `launcher-v9.py.txt:372-511`

**Impact**

Broker source, status, release, envelope, and authorization descriptors are created as local variables and are not all sentinel-initialized or closed in the outer finalizer. Exceptions between creation and normal closes can retain descriptors and prevent peer EOF.

**Required Revision IX correction**

Initialize every descriptor before acquisition, register ownership immediately, and close every launcher-owned descriptor in independent finalization units before group-absence proof.

### JX-B09 — Managed inventory helper is not integrated into launcher control flow

**Severity:** `high`

**Affected locations**

- `launcher-v9.py.txt:235-332`
- `launcher-v9.py.txt:360-548`

**Impact**

run_inventory_helper is defined but never invoked. Broker and helper identity decisions therefore bypass the reviewed bounded inventory evidence path.

**Required Revision IX correction**

Invoke the authenticated helper at defined pre-release and pre-signal checkpoints, bind request nonces and helper identity, validate its exact result schema, and use its rows for identity decisions.

### JX-B10 — Start-token collection bypasses bounded helper capture and lacks timeout cleanup

**Severity:** `high`

**Affected locations**

- `launcher-v9.py.txt:192-206`
- `broker-v9.py.txt:173-187`

**Impact**

Both launcher and broker call ps with communicate(timeout=2.0) but provide no TimeoutExpired kill/reap finalizer and no stdout byte bound. A timeout can leak the ps subprocess.

**Required Revision IX correction**

Use the authenticated bounded inventory helper or a shared bounded capture primitive with continuous drain, absolute deadline, output budget, exact return code, kill, reap, and absence proof.

### JX-B11 — Probe exit receipts trust caller-supplied child identity and exit status

**Severity:** `critical`

**Affected locations**

- `probe-v9.py.txt:74-91`
- `probe-v9.py.txt:124`

**Impact**

build_receipt validates values supplied through command-line arguments, not values observed from fork/wait operations. A caller can construct internally consistent but false child_pid and child_exit_code evidence.

**Required Revision IX correction**

Construct receipts only from locally observed fork return values and waitpid results. Do not accept child identity or exit status as probe CLI inputs.

### JX-B12 — Probe FD inventory is unstable and not pre-exec authenticated

**Severity:** `high`

**Affected locations**

- `probe-v9.py.txt:57-72`

**Impact**

Enumerating /dev/fd can include the enumeration directory descriptor itself and captures state after interpreter startup. It does not prove the broker-assigned pre-exec descriptor set or exclusivity.

**Required Revision IX correction**

Capture expected descriptor identities in the parent before exec, pass a digest-bound expectation, exclude the inventory mechanism's own descriptor deterministically, and compare exact role inventories.

### JX-B13 — Repository preservation is asserted without an observed snapshot

**Severity:** `high`

**Affected locations**

- `coordinator-v9.py.txt:414`

**Impact**

repository_state becomes PASS after authorization and evidence-field checks. No broker repository snapshot or pre/post identity comparison is requested or validated.

**Required Revision IX correction**

Obtain bounded authenticated repository state from the broker before and after operations and derive PASS only from exact expected HEAD, origin, branch, and working-tree records.

### JX-B14 — Inventory raw-byte evidence field does not contain raw ps byte count

**Severity:** `high`

**Affected locations**

- `inventory-helper-v9.py.txt:166-175`

**Impact**

raw_ps_bytes is calculated from canonical JSON encodings of parsed rows instead of len(raw ps output). The evidence label and value do not represent the captured byte budget.

**Required Revision IX correction**

Retain the bounded raw capture length separately, report raw_ps_bytes=len(raw), and report canonical_rows_bytes under a distinct field.

### JX-B15 — Launcher accepts broker final status without exact schema or evidence validation

**Severity:** `critical`

**Affected locations**

- `launcher-v9.py.txt:454-458`
- `launcher-v9.py.txt:513-538`

**Impact**

The launcher accepts any dictionary whose prefinal_result is PREFINAL_PASS. It does not validate exact keys, failure-code consistency, coordinator prefinal schema, diagnostic bounds, attempt binding, or broker-produced release evidence before authoritative PASS.

**Required Revision IX correction**

Apply an exact in-process final-status validator and derive each authoritative field from validated evidence and launcher-observed process absence.

### JX-B16 — Listener and network-classification controls are not integrated

**Severity:** `high`

**Affected locations**

- `coordinator-v9.py.txt:53-94`
- `coordinator-v9.py.txt:256-266`
- `coordinator-v9.py.txt:361-435`

**Impact**

ListenerLedger and network classification helpers are defined but no coordinator operation calls listener_ledger.open or the classification functions. The closure claims are not connected to capability execution paths.

**Required Revision IX correction**

Integrate listener and network operations through authenticated broker RPC, register each listener before the next acquisition, classify exact errno values, and emit bounded evidence used by capability results.

## Newly discovered blockers

The findings above are the newly discovered Revision VIII integration and trust-chain blockers. They do not invalidate the historical Phase 25JW authoring record; they prevent syntax validation and materialization preflight from starting.

## Readiness disposition

Revision VIII static review:

`COMPLETE_WITH_REVISION_REQUIRED`

Revision VIII package:

`PRESERVED_AS_HISTORICAL_REVIEW_INPUT`

Revision IX corrected inert package:

`REQUIRED`

Python syntax validation:

`NOT_AUTHORIZED`

Sandbox-profile parsing:

`NOT_AUTHORIZED`

Materialization preflight:

`NOT_AUTHORIZED`

Execution-envelope creation:

`NOT_AUTHORIZED`

Authorization creation or consumption:

`NOT_AUTHORIZED`

Synthetic capability execution:

`NOT_AUTHORIZED`

Application lint, build, or startup:

`NOT_AUTHORIZED`

C01 and C02:

`NOT_AUTHORIZED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Safe successor

**Phase 25JY — Corrected Synthetic Capability Harness Inert Source Revision IX Gate**

Phase 25JY may create only a new static non-executable Revision IX package with new identities that resolves `JX-B01` through `JX-B16`.

Phase 25JY must not overwrite Phase 25JW snapshots, remove execution sentinels, create executable files, parse or execute Python source, run syntax checks, parse or launch sandbox profiles, materialize runtime files, create or consume an execution envelope or authorization, create synthetic fixtures, invoke clone or sandbox operations, open listeners or sockets, perform DNS resolution, inspect environment values, lint, build, or start AiFinder, invoke C01 or C02, access a database or external service, install packages, begin Batch D, deploy, publish, authorize operational reactivation, or launch publicly.

## Gemini senior-review questions

Gemini should approve Phase 25JX only if all answers are affirmative:

1. Is Phase 25JX anchored to exact Phase 25JW commit `f27817911daf465a87391895e17a74a3a54758cc`?
2. Are the exact Revision VIII package identities verified without parsing or execution?
3. Are all five execution sentinels preserved?
4. Are fixed unopened coordinator and RPC descriptors a critical launch defect?
5. Are the broker capability helpers disconnected from any RPC dispatch loop?
6. Does authorization self-supply CAP-10, CAP-11, and CAP-12 evidence?
7. Is the launcher trust root selected by envelope data rather than pinned to the approved package?
8. Are authorization fields used without runtime schema and path-component validation?
9. Can blocking frame reads prevent timeout and cleanup logic from running?
10. Does coordinator cleanup omit process-group and descendant-absence proof?
11. Are launcher-owned descriptors incompletely finalized?
12. Is the managed inventory helper unintegrated?
13. Do start-token ps calls lack bounded timeout cleanup?
14. Are probe receipt identities caller supplied rather than locally observed?
15. Is probe FD evidence unstable and post-exec rather than parent-authenticated?
16. Is repository preservation asserted without a broker snapshot?
17. Is raw_ps_bytes semantically incorrect?
18. Does launcher final-status validation accept insufficient evidence?
19. Are listener and network helpers unintegrated?
20. Must syntax and materialization-preflight readiness remain rejected?
21. Is Phase 25JY limited to a new inert Revision IX package?
22. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Phase 25JW Revision VIII inert package: 100%
- Phase 25JX Revision VIII source review: 100%
- Phase 25JX Gemini review: pending
- Revision IX correction: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
