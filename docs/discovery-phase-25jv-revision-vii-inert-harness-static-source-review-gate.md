# Phase 25JV — Revision VII Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JV`
- Batch: `C — Controlled Runtime Validation`
- Phase type: Revision VII inert-source static review
- Approved predecessor phase: `25JU`
- Approved predecessor commit: `c29d55fa9260ee7dba86b14e4eae97c851a5dacd`
- Phase 25JU artifact SHA-256: `bd4427ee95e1c8385443c9f02de22589805b73ed37ddf51344ae1b80cd1fd355`
- Phase 25JU outer package-manifest SHA-256: `149006ce51afd4091aff5d1108d56dd0258d80bbf26e20bea070ac20a024a1b9`
- Phase 25JU root-trust-manifest SHA-256: `79091b7308d240ad48cf5a68cdeff9792898a916a0418ded9ced3de17c7d93dc`
- Phase 25JU bootstrap-manifest SHA-256: `0808932c7360f3ed041d11eed61c6f29ce2b3b89749d33b41a2a33160a7a8d38`
- Phase 25JU launcher SHA-256: `5f25103e745ee3e0a4b2ae6603377360f267080b832426baa2fff4772b429b16`
- Phase 25JU coordinator SHA-256: `8ed21fe691050994909c4d7a10643a292e3379bf432fcf8dea13ebf64c72d669`
- Phase 25JU broker SHA-256: `b95bae120de39ecfeccc7d182463bd382fec6f03ed2208991fad5a7df46ab127`
- Phase 25JU probe SHA-256: `33644d7d06f6b1f7a6965eb307dd3e0c892659928bc12801091b50a583e2328b`
- Phase 25JU inventory-helper SHA-256: `7c94c97c2ffb7d0cc6faf0391783a22bc9db3d44642c45dc70cbafd316d0fd2f`
- Phase 25JU defect-closure matrix SHA-256: `babe2f88cfd1f7d80cd16b0af44f7276433789ee5d15674575474301c24308b3`
- Phase 25JU review-identities SHA-256: `5b27d6fd7799cf71172fb3987ca4e13869f1b483989183511cd45f47b2aaacc2`
- Phase 25JU core static-review ZIP SHA-256: `c8efaa1d3e3ee9dc691727215a097f6f70a45ba28ea5391bc98a7dd62a3b7f5e`
- Phase 25JV finding-ledger SHA-256: `d13463ed46d71567c159979bb1bf4c76f09edada0f18af1c851f3cb058aaf386`
- Source parsing in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JV performs a text-only trust-chain, process-ownership, descriptor-isolation, cleanup-finality, result-integrity, and fail-closed review of the exact Revision VII package.

The supplied identities were recomputed and verified. The launcher, coordinator, broker, probe, inventory helper, manifests, contract, schemas, policy, profiles, and closure matrix were inspected only as inert text.

No Python parser, syntax checker, import, compiler, sandbox-profile parser, materializer, execution envelope, authorization action, fixture, clone operation, sandbox execution, listener, socket, DNS operation, application command, database, package installation, or external service was invoked.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JU artifact | `bd4427ee95e1c8385443c9f02de22589805b73ed37ddf51344ae1b80cd1fd355` |
| Outer package manifest | `149006ce51afd4091aff5d1108d56dd0258d80bbf26e20bea070ac20a024a1b9` |
| Root-trust manifest | `79091b7308d240ad48cf5a68cdeff9792898a916a0418ded9ced3de17c7d93dc` |
| Bootstrap manifest | `0808932c7360f3ed041d11eed61c6f29ce2b3b89749d33b41a2a33160a7a8d38` |
| Launcher | `5f25103e745ee3e0a4b2ae6603377360f267080b832426baa2fff4772b429b16` |
| Coordinator | `8ed21fe691050994909c4d7a10643a292e3379bf432fcf8dea13ebf64c72d669` |
| Broker | `b95bae120de39ecfeccc7d182463bd382fec6f03ed2208991fad5a7df46ab127` |
| Probe | `33644d7d06f6b1f7a6965eb307dd3e0c892659928bc12801091b50a583e2328b` |
| Inventory helper | `7c94c97c2ffb7d0cc6faf0391783a22bc9db3d44642c45dc70cbafd316d0fd2f` |
| Defect-closure matrix | `babe2f88cfd1f7d80cd16b0af44f7276433789ee5d15674575474301c24308b3` |
| Review identities | `5b27d6fd7799cf71172fb3987ca4e13869f1b483989183511cd45f47b2aaacc2` |
| Core static-review ZIP | `c8efaa1d3e3ee9dc691727215a097f6f70a45ba28ea5391bc98a7dd62a3b7f5e` |
| Phase 25JV finding ledger | `d13463ed46d71567c159979bb1bf4c76f09edada0f18af1c851f3cb058aaf386` |

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review completeness:

`COMPLETE_WITH_REVISION_REQUIRED`

Syntax and materialization-preflight readiness:

`BLOCKED_PENDING_REVISION_VIII`

## Review decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

Revision VII closes the predecessor findings at the package-design level, but exact source inspection identifies 20 new critical/high blockers:

- Critical: `10`
- High: `10`

The most load-bearing blockers are:

1. post-fork failures can re-enter cloned broker control flow;
2. authorization bytes are exposed through broker and coordinator process arguments;
3. inventory-helper initialization is not protected by one outer finalizer;
4. launcher finalization can abort on uncaught raw exceptions;
5. failed single/tree operations do not release all spawned roles;
6. broker subprocess cleanup does not prove descendant absence;
7. coordinator diagnostics are not continuously drained.

## Finding summary

| Finding | Severity | Status | Assessment |
|---|---|---|---|
| `JV-B01` | `critical` | `OPEN` | Fork-child pre-exec failures can re-enter the broker RPC loop |
| `JV-B02` | `critical` | `OPEN` | Authorization and envelope material are exposed through process arguments |
| `JV-B03` | `critical` | `OPEN` | Managed inventory acquisition begins outside its cleanup finalizer |
| `JV-B04` | `critical` | `OPEN` | Launcher failure finalization handles only LauncherFailure exceptions |
| `JV-B05` | `critical` | `OPEN` | Single and tree probe error paths do not terminate or reap spawned roles |
| `JV-B06` | `critical` | `OPEN` | Bounded process cleanup controls only the direct child |
| `JV-B07` | `high` | `OPEN` | CAP-11 and CAP-12 process-release evidence is hard-coded |
| `JV-B08` | `high` | `OPEN` | Coordinator release states are asserted before actual broker release |
| `JV-B09` | `high` | `OPEN` | Broker RPC failures lose their exact failure codes |
| `JV-B10` | `critical` | `OPEN` | Inventory helper process collection is unbounded and has no timeout |
| `JV-B11` | `critical` | `OPEN` | Inventory-helper signaling lacks start-token revalidation |
| `JV-B12` | `high` | `OPEN` | Multi-listener acquisition is not protected by one outer finalizer |
| `JV-B13` | `high` | `OPEN` | Network denial accepts non-permission failures as sandbox evidence |
| `JV-B14` | `high` | `OPEN` | Any IPv6 listener-open error is classified as unsupported |
| `JV-B15` | `critical` | `OPEN` | Tree exit receipts do not bind child identities |
| `JV-B16` | `high` | `OPEN` | CAP-10 descriptor and group-membership claims remain hard-coded |
| `JV-B17` | `critical` | `OPEN` | Coordinator stdout and stderr are not continuously drained during RPC execution |
| `JV-B18` | `high` | `OPEN` | Final broker status can exceed the launcher's framing limit |
| `JV-B19` | `high` | `OPEN` | Gate EOF causes a timed busy loop instead of immediate failure |
| `JV-B20` | `high` | `OPEN` | Authorization ledger write lacks zero-write and post-create metadata validation |

## Detailed findings

### JV-B01 — Fork-child pre-exec failures can re-enter the broker RPC loop

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:489-515`
- `aifinder-phase-25ju-broker-v8.py.txt:599-610`

**Impact**

Forked parent, child, grandchild, or single-probe children call exec_probe without an os._exit guard. If descriptor setup or execve fails, the exception can unwind inside a cloned broker process that still holds broker state and control descriptors, allowing duplicate RPC/status behavior.

**Required Revision VIII correction**

Wrap every post-fork child branch in a minimal try/finally that emits a bounded failure receipt when possible and always terminates with os._exit; no child may return to broker code.
### JV-B02 — Authorization and envelope material are exposed through process arguments

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-launcher-v8.py.txt:856-876`
- `aifinder-phase-25ju-broker-v8.py.txt:830-847`

**Impact**

The complete authorization bytes and envelope are hex-encoded into the broker command line and then forwarded in the coordinator command line. Process arguments are observable and create an unnecessary disclosure and replay window for one-attempt authorization material.

**Required Revision VIII correction**

Transfer envelope and authorization bytes only through inherited, non-seekable or sealed descriptor channels with exact length/digest binding; never place authorization material in argv.
### JV-B03 — Managed inventory acquisition begins outside its cleanup finalizer

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-launcher-v8.py.txt:286-318`

**Impact**

The helper process, gate, sockets, and session identity are created before the function enters its try/finally. Failures during descriptor closing, getpgid/getsid, anchor checks, or gate release can leak a gated helper session and descriptors.

**Required Revision VIII correction**

Initialize all helper resources to sentinels and place Popen, descriptor acquisition, identity capture, registration, and gate release inside one outer finalizer.
### JV-B04 — Launcher failure finalization handles only LauncherFailure exceptions

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-launcher-v8.py.txt:995-1037`

**Impact**

Raw TimeoutExpired, ProcessLookupError, OSError, JSON errors, or helper failures raised during finalization can escape the cleanup block, preventing authoritative result emission and leaving release states incomplete.

**Required Revision VIII correction**

Catch BaseException inside each finalization unit, normalize it to an exact launcher failure code, continue remaining cleanup steps, and always emit a failed-closed authoritative result.
### JV-B05 — Single and tree probe error paths do not terminate or reap spawned roles

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:524-583`
- `aifinder-phase-25ju-broker-v8.py.txt:614-648`

**Impact**

If record framing, validation, release, receipt, or wait logic fails, the finally blocks only close local channels. Spawned probe roles can remain blocked or running until a later launcher-wide kill.

**Required Revision VIII correction**

Track every spawned PID immediately, revalidate broker-group identity, release or terminate every role on all paths, reap all directly owned children, and prove role PID absence before returning RPC.
### JV-B06 — Bounded process cleanup controls only the direct child

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:220-286`

**Impact**

Timeout, output-limit, and secret-scan cleanup sends terminate/kill only to the direct subprocess. Any descendants can survive inside the broker group, inherit pipes or descriptors, and affect later operations before the launcher-wide final check.

**Required Revision VIII correction**

Give each broker operation a registered child process group within the broker session, revalidate its leader identity, terminate the entire operation group, reap the leader, and prove group absence.
### JV-B07 — CAP-11 and CAP-12 process-release evidence is hard-coded

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:742-770`
- `aifinder-phase-25ju-coordinator-v8.py.txt:751-770`

**Impact**

The broker returns process_reaped=True without a descendant-absence proof, and the coordinator does not validate that field before recording process_release=PASS.

**Required Revision VIII correction**

Return authenticated operation-group release evidence and require the coordinator and launcher to validate it before CAP-11 or CAP-12 can pass.
### JV-B08 — Coordinator release states are asserted before actual broker release

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-coordinator-v8.py.txt:841-842`
- `aifinder-phase-25ju-coordinator-v8.py.txt:884-887`

**Impact**

A SHUTDOWN acknowledgment is treated as coordinator_process_release_state=PASS and broker_descendant_release_state=PASS even though the coordinator is still executing and the broker has not completed its launcher-controlled release.

**Required Revision VIII correction**

Use prefinal states such as REQUESTED or PENDING, and let only launcher-observed process and group absence become authoritative PASS release evidence.
### JV-B09 — Broker RPC failures lose their exact failure codes

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:784-795`

**Impact**

Every BrokerFailure is reduced to the class name BrokerFailure and a hash of that class name. Distinct trust, cleanup, identity, and capability failures become indistinguishable.

**Required Revision VIII correction**

Preserve a bounded enumerated failure code from BrokerFailure, validate it against an exact allowlist, and include that exact code in RPC and final-status evidence without raw exception text.
### JV-B10 — Inventory helper process collection is unbounded and has no timeout

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-inventory-helper-v8.py.txt:58-76`

**Impact**

subprocess.run captures the complete ps output with no timeout or byte limit. A hung process or large output can block launcher finalization or consume unbounded memory before the record-size check.

**Required Revision VIII correction**

Use continuously drained bounded capture, an absolute timeout, exact return-code validation, and a fixed maximum row count and encoded-byte budget.
### JV-B11 — Inventory-helper signaling lacks start-token revalidation

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-launcher-v8.py.txt:294-357`

**Impact**

The launcher records only PID/PGID/SID for the helper. In the failure finalizer, poll/getpgid/getsid races can target a reused identifier, and no start token is revalidated before killpg.

**Required Revision VIII correction**

Register the helper through an independent identity source before gate release, retain its start token, and revalidate PID, start token, PGID, and SID immediately before every signal.
### JV-B12 — Multi-listener acquisition is not protected by one outer finalizer

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-coordinator-v8.py.txt:574-577`
- `aifinder-phase-25ju-coordinator-v8.py.txt:620-623`

**Impact**

CAP-06 and CAP-07 open two listeners before entering their try/finally blocks. If the second open fails, the first listener is not registered for cleanup. No global listener registry enforces the configured concurrency limit.

**Required Revision VIII correction**

Register each listener immediately in a global owned-listener ledger, enforce the active limit before creation, and release/rebind every registered listener in the coordinator outer finalizer.
### JV-B13 — Network denial accepts non-permission failures as sandbox evidence

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:334-357`
- `aifinder-phase-25ju-coordinator-v8.py.txt:560-564`
- `aifinder-phase-25ju-coordinator-v8.py.txt:605-609`
- `aifinder-phase-25ju-coordinator-v8.py.txt:664-668`

**Impact**

DENIED is accepted when errno is merely non-null. Routing errors, address-family failures, resource errors, and connection refusal can be misclassified as sandbox policy denial.

**Required Revision VIII correction**

Require exact permitted denial errno values such as EPERM/EACCES and reject all other network errors as inconclusive or failed evidence.
### JV-B14 — Any IPv6 listener-open error is classified as unsupported

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-coordinator-v8.py.txt:545-550`

**Impact**

Permission, resource, descriptor, or transient bind failures are silently converted to ipv6_tree=NOT_SUPPORTED, masking environmental or cleanup defects.

**Required Revision VIII correction**

Classify NOT_SUPPORTED only for an exact allowlist of platform unsupported-family errors; all other errors must fail closed with an explicit code.
### JV-B15 — Tree exit receipts do not bind child identities

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:396-418`
- `aifinder-phase-25ju-broker-v8.py.txt:536-551`

**Impact**

Receipt validation does not require child_pid to equal the actual child or grandchild record PID and does not enforce exact child_exit_code types for leaf, child, and parent roles.

**Required Revision VIII correction**

Bind parent receipt child_pid to the child record PID, child receipt child_pid to the grandchild PID, leaf child_pid to -1, and enforce exact None/zero exit-code semantics by role.
### JV-B16 — CAP-10 descriptor and group-membership claims remain hard-coded

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-coordinator-v8.py.txt:730-749`

**Impact**

role_exclusive_evidence_descriptors and single_broker_group_membership are set to True rather than derived from authenticated descriptor inventories and exact process rows.

**Required Revision VIII correction**

Collect bounded role FD inventories before exec and exact broker-group process rows, then derive each CAP-10 boolean from those records.
### JV-B17 — Coordinator stdout and stderr are not continuously drained during RPC execution

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:842-868`

**Impact**

The broker creates PIPE endpoints, runs the complete RPC loop, and calls communicate only afterward. A coordinator traceback or unexpected output can fill a pipe and block the coordinator before it can send SHUTDOWN, deadlocking the broker.

**Required Revision VIII correction**

Continuously drain coordinator stdout and stderr with independent bounded rolling secret scans while serving RPC, or move prefinal output to a dedicated bounded framed descriptor.
### JV-B18 — Final broker status can exceed the launcher's framing limit

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:860-864`
- `aifinder-phase-25ju-broker-v8.py.txt:882-898`
- `aifinder-phase-25ju-launcher-v8.py.txt:915-919`

**Impact**

Coordinator stdout is allowed up to max_rpc_record_bytes, then hex encoding doubles it inside the broker status JSON. The launcher still reads the final status with max_rpc_record_bytes.

**Required Revision VIII correction**

Define a separate exact final-status bound or transmit coordinator output as a separately framed descriptor record with a digest and a much smaller canonical prefinal maximum.
### JV-B19 — Gate EOF causes a timed busy loop instead of immediate failure

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-broker-v8.py.txt:113-129`
- `aifinder-phase-25ju-broker-v8.py.txt:897-900`

**Impact**

When a gate writer closes without sending G, os.read returns EOF but wait_gate loops until timeout. The broker can spin and delay finalization instead of reporting an exact closed-gate failure.

**Required Revision VIII correction**

Treat EOF as an immediate enumerated failure and use distinct startup-gate and final-release-gate state machines.
### JV-B20 — Authorization ledger write lacks zero-write and post-create metadata validation

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25ju-coordinator-v8.py.txt:249-270`

**Impact**

A zero-byte os.write would loop indefinitely, and the created entry is not reopened or verified for regular-file type, owner, exact mode, link count, and exact bytes before the directory is fsynced.

**Required Revision VIII correction**

Use a write_all helper that rejects zero writes, verify the entry by retained descriptor or reopen-at, and require exact metadata and content before recording authorization as consumed.


## Newly discovered blockers

The 20 findings above are the newly discovered Revision VII critical/high blockers. No additional critical or high-severity blocker remains untracked in this review package.

## Prior-finding disposition

The Phase 25JU closure matrix for `JT-B01` through `JT-B17` remains preserved as the Revision VII design intent.

Phase 25JV does not rewrite that historical matrix. It records the source-level defects found while reviewing the exact Revision VII snapshots.

## Readiness disposition

Revision VII static review:

`COMPLETE_WITH_REVISION_REQUIRED`

Revision VII package:

`PRESERVED_AS_HISTORICAL_REVIEW_INPUT`

Revision VIII corrected inert package:

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

Host capabilities:

`UNPROVEN`

Application lint, build, or startup:

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

## Required Revision VIII package

The next inert package must create new identities and resolve `JV-B01` through `JV-B20` without overwriting Revision VII.

## Safe successor

The safe successor is:

**Phase 25JW — Corrected Synthetic Capability Harness Inert Source Revision VIII Gate**

Phase 25JW may create only a new static non-executable Revision VIII package with new hashes that resolves `JV-B01` through `JV-B20`.

Phase 25JW must not overwrite Phase 25JU snapshots, remove execution sentinels, create executable files, parse or execute Python source, run syntax checks, parse or launch sandbox profiles, materialize runtime files, create an execution envelope or authorization, consume authorization, create synthetic fixtures, invoke clone or sandbox operations, open listeners or sockets, perform DNS resolution, inspect environment values, lint, build, or start AiFinder, invoke C01 or C02, access a database or external service, install packages, begin Batch D, or authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JV only if all answers are affirmative:

1. Is Phase 25JV anchored to exact Phase 25JU commit `c29d55fa9260ee7dba86b14e4eae97c851a5dacd`?
2. Are all Phase 25JU identities verified without parsing or execution?
3. Are all five execution sentinels preserved?
4. Can post-fork exec failures return into cloned broker control flow?
5. Must every fork child terminate through os._exit on every path?
6. Are authorization and envelope bytes exposed in process arguments?
7. Must authorization material move through descriptor channels only?
8. Does managed inventory acquire resources before entering its finalizer?
9. Can raw finalization exceptions prevent authoritative result emission?
10. Do single/tree failure paths omit complete role termination and reaping?
11. Does bounded_process control only the direct child?
12. Are CAP-11 and CAP-12 release claims insufficiently evidenced?
13. Are coordinator release states asserted before actual release?
14. Are exact broker failure codes lost?
15. Is inventory-helper ps capture unbounded and untimed?
16. Is helper start identity missing before group signaling?
17. Can multi-listener acquisition leak the first listener?
18. Are non-permission network errors accepted as denial evidence?
19. Can arbitrary IPv6 listener errors be classified as unsupported?
20. Are tree receipt child identities insufficiently bound?
21. Are CAP-10 descriptor/group claims hard-coded?
22. Are coordinator stdout and stderr undrained during RPC?
23. Can final broker status exceed the launcher framing limit?
24. Does gate EOF spin until timeout?
25. Does authorization ledger writing lack zero-write and metadata verification?
26. Is syntax and materialization-preflight readiness rejected?
27. Is Phase 25JW limited to a new inert Revision VIII package?
28. Are parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
29. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JU corrected inert revision VII: 100%
- Phase 25JV Revision VII source review: 100%
- Phase 25JV Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
