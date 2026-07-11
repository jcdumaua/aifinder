# Phase 25JT — Revision VI Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JT`
- Batch: `C — Controlled Runtime Validation`
- Phase type: Revision VI inert-source static review
- Approved predecessor phase: `25JS`
- Approved predecessor commit: `bf30fe37ae4b3eb41f91d879d72e2de15cce2664`
- Phase 25JS artifact SHA-256: `416e61c279ff14ac3afda9c3d185d9029f2e1a7b0fc972107f7d2722443e6847`
- Phase 25JS outer package-manifest SHA-256: `e0942081a72b5b537641ce476980120efc3cbfe77f83f714286bac71323042ad`
- Phase 25JS root-trust-manifest SHA-256: `578a22a3b4d9a81b2c8dc8e11a1eaa5aeed5f7b8c70348f69a89270151c04adf`
- Phase 25JS bootstrap-manifest SHA-256: `73e8fc0bf3a5693e5d659a5dca4d6bc501542ea8e630f996268f99d307a12ffd`
- Phase 25JS launcher SHA-256: `67eee15842e5bac66184a9ef0c0903954a24fd14fc1829aaf920ea43264da51c`
- Phase 25JS coordinator SHA-256: `43328b61546dd59ff5d2b78b11befc827cc97c5d804e21098ab7e6ebb632598b`
- Phase 25JS broker SHA-256: `675656fc1be6896deb89f9428681b7cb2008f36217e504a70ef0c09003798593`
- Phase 25JS probe SHA-256: `36b6c2b4de3d57e072983cc75e2cd9f4cd2b1887357d4647cbd48a9b1d57d080`
- Phase 25JS defect-closure matrix SHA-256: `efc98a0fae3c77801ee10263523423ce33ea13dca4f9502f6a99813e18775450`
- Phase 25JS review-identities SHA-256: `5d0ded860efef304a2d18b6b5fe4fdaf4207f9b71c17eb6f5fac983b2a774e06`
- Phase 25JT finding-ledger SHA-256: `3bed01dd4b8fd242ed80276d38788699464d733c1eb74caabe49c720ed996b64`
- Source parsing in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JT performs a text-only integrity, trust-boundary, process-ownership, descriptor-isolation, result-integrity, and fail-closed review of the exact Revision VI package.

The review recomputed the supplied identities and inspected the launcher, coordinator, broker, probe, manifests, contract, schemas, policy, profiles, and closure matrix only as inert text.

No Python source parser, syntax checker, compiler, import, sandbox-profile parser, materializer, authorization action, synthetic fixture, clone operation, sandbox execution, listener, socket, DNS action, application command, database, or external service was invoked.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JS artifact | `416e61c279ff14ac3afda9c3d185d9029f2e1a7b0fc972107f7d2722443e6847` |
| Outer package manifest | `e0942081a72b5b537641ce476980120efc3cbfe77f83f714286bac71323042ad` |
| Root-trust manifest | `578a22a3b4d9a81b2c8dc8e11a1eaa5aeed5f7b8c70348f69a89270151c04adf` |
| Bootstrap manifest | `73e8fc0bf3a5693e5d659a5dca4d6bc501542ea8e630f996268f99d307a12ffd` |
| Launcher | `67eee15842e5bac66184a9ef0c0903954a24fd14fc1829aaf920ea43264da51c` |
| Coordinator | `43328b61546dd59ff5d2b78b11befc827cc97c5d804e21098ab7e6ebb632598b` |
| Broker | `675656fc1be6896deb89f9428681b7cb2008f36217e504a70ef0c09003798593` |
| Probe | `36b6c2b4de3d57e072983cc75e2cd9f4cd2b1887357d4647cbd48a9b1d57d080` |
| Defect-closure matrix | `efc98a0fae3c77801ee10263523423ce33ea13dca4f9502f6a99813e18775450` |
| Review identities | `5d0ded860efef304a2d18b6b5fe4fdaf4207f9b71c17eb6f5fac983b2a774e06` |
| Finding ledger | `3bed01dd4b8fd242ed80276d38788699464d733c1eb74caabe49c720ed996b64` |

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review completeness:

`COMPLETE_WITH_REVISION_REQUIRED`

Syntax and materialization-preflight readiness:

`BLOCKED_PENDING_REVISION_VII`

## Review decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

Revision VI resolves the prior `JR-B01` through `JR-B17` design requirements at the stated documentation level, but the exact source snapshots introduce or retain 17 critical/high blockers.

The most load-bearing blockers are:

1. broker-control descriptors leak into execed roles;
2. nested brokers escape the launcher-owned session;
3. tree broker PASS ignores child/grandchild exit status;
4. process start identity is not revalidated before signaling;
5. launcher group-cleanup failure is suppressed from authoritative PASS;
6. trusted components return to mutable pathname execution;
7. Python startup isolation is missing for nested brokers and probes.

## Finding summary

| Finding | Severity | Status | Assessment |
|---|---|---|---|
| `JT-B01` | `critical` | `OPEN` | Broker-control descriptors leak into execed probe roles |
| `JT-B02` | `critical` | `OPEN` | Tree broker waits for only the parent and ignores descendant exit status |
| `JT-B03` | `critical` | `OPEN` | CAP-10 reaping and independent-enumeration claims are hard-coded without evidence |
| `JT-B04` | `critical` | `OPEN` | Single-probe results are not bound to role, nonce, process group, or broker identity |
| `JT-B05` | `critical` | `OPEN` | Nested brokers escape the launcher-owned process session |
| `JT-B06` | `critical` | `OPEN` | Recorded process start identity is never revalidated before group signaling |
| `JT-B07` | `critical` | `OPEN` | Launcher suppresses broker-group cleanup failure from the authoritative PASS decision |
| `JT-B08` | `critical` | `OPEN` | Nested broker and probe interpreters are not isolated from site initialization |
| `JT-B09` | `critical` | `OPEN` | Coordinator returns to mutable pathname trust after descriptor verification |
| `JT-B10` | `critical` | `OPEN` | Launcher trust reads do not require owner-matched regular files |
| `JT-B11` | `critical` | `OPEN` | Execution baseline is not bound to the approved package predecessor |
| `JT-B12` | `high` | `OPEN` | CAP-07 transport-neutral endpoint claim is supported only by TCP evidence |
| `JT-B13` | `high` | `OPEN` | CAP-08 does not prove localhost-only resolver output or absence of external resolution |
| `JT-B14` | `critical` | `OPEN` | Tree probe identities are not bound to the broker session |
| `JT-B15` | `high` | `OPEN` | Broker status records receive only partial structural and identity validation |
| `JT-B16` | `high` | `OPEN` | Launcher process inventory spawns an unmanaged child outside the broker boundary |
| `JT-B17` | `high` | `OPEN` | Authoritative failure evidence omits launcher-level finalization dispositions |

## Detailed findings

### JT-B01 — Broker-control descriptors leak into execed probe roles

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-broker-v7.py.txt:146-177`
- `aifinder-phase-25js-broker-v7.py.txt:179-205`
- `aifinder-phase-25js-broker-v7.py.txt:317-350`

**Plausible failure**

Parent, child, and grandchild probes can retain the broker status descriptor and startup-gate descriptor. This contradicts the role-exclusive descriptor claim and can keep or spoof the trusted broker channel.

**Closest apparent control**

exec_role closes only the result/release descriptors listed in all_fds.

**Required Revision VII correction**

Mark broker-control descriptors close-on-exec or explicitly close every descriptor except the role's exact result and release endpoints before os.execve.
### JT-B02 — Tree broker waits for only the parent and ignores descendant exit status

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-broker-v7.py.txt:179-218`

**Plausible failure**

The child or grandchild may fail after emitting a record while the parent exits successfully. The broker still emits PASS, so CAP-05 and CAP-10 can accept an incomplete or failed tree.

**Closest apparent control**

Only os.waitpid(parent_pid, 0) determines broker PASS.

**Required Revision VII correction**

Make every role directly reapable by a trusted anchor or deliver authenticated exit receipts for all three roles, and require all exits to be successful before broker PASS.
### JT-B03 — CAP-10 reaping and independent-enumeration claims are hard-coded without evidence

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:1012-1047`
- `aifinder-phase-25js-broker-v7.py.txt:208-218`

**Plausible failure**

The result asserts reaped, descendants_absent, independent_enumeration, and ownership_revalidated_before_signal even though the broker reports only the parent exit.

**Closest apparent control**

No descendant reap receipt or independent process enumeration is compared.

**Required Revision VII correction**

Derive every CAP-10 boolean from explicit broker receipts and independent process-table evidence; reject hard-coded PASS metadata.
### JT-B04 — Single-probe results are not bound to role, nonce, process group, or broker identity

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:644-689`
- `aifinder-phase-25js-coordinator-v7.py.txt:907-969`

**Plausible failure**

CAP-06 and CAP-07 read network.outcome without validating the probe schema, expected nonce, role, PID/PPID, PGID, SID, or equality with the broker session.

**Closest apparent control**

launch_single checks framing and broker state only.

**Required Revision VII correction**

Apply one exact single-probe validator that binds schema, role, nonce, process lineage, PGID, SID, network object shape, and broker status identity.
### JT-B05 — Nested brokers escape the launcher-owned process session

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:304-320`
- `aifinder-phase-25js-launcher-v7.py.txt:717-764`
- `aifinder-phase-25js-launcher-v7.py.txt:802-806`

**Plausible failure**

If the coordinator is force-killed or cannot run its finalizer, command, stream, single, and tree broker sessions are outside the launcher's process group and can survive authoritative finalization.

**Closest apparent control**

Launcher terminates only the outer broker PGID.

**Required Revision VII correction**

Keep all runtime descendants under one launcher-owned cgroup/session equivalent, or give the launcher an authenticated registry of every nested session that it must release and prove absent.
### JT-B06 — Recorded process start identity is never revalidated before group signaling

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:60-69`
- `aifinder-phase-25js-coordinator-v7.py.txt:323-365`
- `aifinder-phase-25js-launcher-v7.py.txt:245-281`
- `aifinder-phase-25js-launcher-v7.py.txt:752-759`

**Plausible failure**

After broker exit and identifier reuse, a stale PGID/SID can refer to an unrelated session. The stored start token is unused, and the launcher does not retain one at all.

**Closest apparent control**

Termination verifies SID membership but not original start identity.

**Required Revision VII correction**

Revalidate the session leader PID, start token, PGID, and SID immediately before each signal; fail closed without signaling when identity continuity is lost.
### JT-B07 — Launcher suppresses broker-group cleanup failure from the authoritative PASS decision

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-launcher-v7.py.txt:492-537`
- `aifinder-phase-25js-launcher-v7.py.txt:800-835`

**Plausible failure**

A PREFINAL_PASS can become authoritative PASS even when the launcher failed to terminate or prove absence of the outer broker group.

**Closest apparent control**

terminate_group exceptions are suppressed and no launcher release state enters authoritative().

**Required Revision VII correction**

Track launcher broker-release state and failure code explicitly, require it to be PASS in authoritative(), and never suppress a failed release proof.
### JT-B08 — Nested broker and probe interpreters are not isolated from site initialization

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:377-430`
- `aifinder-phase-25js-coordinator-v7.py.txt:657-728`
- `aifinder-phase-25js-broker-v7.py.txt:163-177`
- `aifinder-phase-25js-broker-v7.py.txt:292-301`

**Plausible failure**

sitecustomize, user-site, or other uncontrolled startup modules can execute before the broker or probe reaches its gate or sentinel, outside the reviewed component hash.

**Closest apparent control**

Startup gating occurs only after interpreter initialization and imports.

**Required Revision VII correction**

Invoke every trusted Python component with isolated, no-site semantics and a descriptor-authenticated source, and verify the interpreter path and environment.
### JT-B09 — Coordinator returns to mutable pathname trust after descriptor verification

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:828-843`
- `aifinder-phase-25js-coordinator-v7.py.txt:1174-1188`
- `aifinder-phase-25js-coordinator-v7.py.txt:1216-1237`

**Plausible failure**

A same-UID rename, chmod, or replacement of the sealed control path can redirect broker/probe execution or profile reads after verified files were copied.

**Closest apparent control**

The retained control directory descriptor is not used for contract, broker, probe, or profile access.

**Required Revision VII correction**

Open and execute trusted components through retained descriptors, verify device/inode immediately before use, and avoid path-based trust decisions after sealing.
### JT-B10 — Launcher trust reads do not require owner-matched regular files

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-launcher-v7.py.txt:607-617`
- `aifinder-phase-25js-launcher-v7.py.txt:675-689`

**Plausible failure**

A FIFO, device, or non-owner file with mode 0644 can enter the launcher read path, causing blocking, unexpected I/O semantics, or trust-source substitution before the hash check completes.

**Closest apparent control**

Only permission bits and digest are checked.

**Required Revision VII correction**

Require regular-file type, current-user ownership, exact mode, bounded size, no links beyond policy, and descriptor identity for every launcher trust read.
### JT-B11 — Execution baseline is not bound to the approved package predecessor

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-launcher-v7.py.txt:283-307`
- `aifinder-phase-25js-coordinator-v7.py.txt:459-503`
- `aifinder-phase-25js-coordinator-v7.py.txt:1216-1229`

**Plausible failure**

A mutually consistent envelope and authorization can target a different clean repository commit while still using the Revision VI package.

**Closest apparent control**

Values are cross-compared but never required to equal the approved contract baseline.

**Required Revision VII correction**

Bind execution_baseline_commit to one exact review-approved commit in the launcher, contract, envelope, authorization, and repository snapshot.
### JT-B12 — CAP-07 transport-neutral endpoint claim is supported only by TCP evidence

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25js-probe-v7.py.txt:48-59`
- `aifinder-phase-25js-coordinator-v7.py.txt:940-969`
- `aifinder-phase-25js-launcher-v7.py.txt:377-384`

**Plausible failure**

The package claims an exact address/port restriction without transport specificity, but tests only TCP. UDP or other transport behavior remains unproven.

**Closest apparent control**

transport_specific_claimed is set to False.

**Required Revision VII correction**

Either constrain the claim explicitly to TCP or add separately bounded evidence for every transport included in the claim.
### JT-B13 — CAP-08 does not prove localhost-only resolver output or absence of external resolution

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25js-probe-v7.py.txt:75-89`
- `aifinder-phase-25js-coordinator-v7.py.txt:971-999`

**Plausible failure**

The authoritative metadata sets sandboxed_localhost_only=True and external_dns_intent=False without validating every returned address as loopback or capturing evidence that no external resolver path ran.

**Closest apparent control**

Only the number of address families is returned.

**Required Revision VII correction**

Return a canonical, bounded digest and classification of every address and independently prove the resolver's allowed communication boundary.
### JT-B14 — Tree probe identities are not bound to the broker session

**Severity:** `critical`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:735-760`
- `aifinder-phase-25js-coordinator-v7.py.txt:1012-1034`

**Plausible failure**

A detached or forged set of internally consistent records can satisfy the cross-link checks without being proven members of the authenticated broker session.

**Closest apparent control**

Records are compared with one another but not with broker_pid, broker_pgid, or broker_sid.

**Required Revision VII correction**

Require every record PGID/SID and lineage to bind to the authenticated broker status, and verify those PIDs independently before release.
### JT-B15 — Broker status records receive only partial structural and identity validation

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25js-coordinator-v7.py.txt:367-430`
- `aifinder-phase-25js-coordinator-v7.py.txt:681-683`
- `aifinder-phase-25js-coordinator-v7.py.txt:757-759`

**Plausible failure**

Unexpected keys, missing identity parity, malformed diagnostics, contradictory return codes, or mismatched broker PID/PGID/SID can be accepted as evidence.

**Closest apparent control**

broker_status checks only schema_version and callers usually check only state.

**Required Revision VII correction**

Define and enforce exact status schemas and bind every status record to the registered broker identity and expected mode-specific semantics.
### JT-B16 — Launcher process inventory spawns an unmanaged child outside the broker boundary

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25js-launcher-v7.py.txt:230-249`
- `aifinder-phase-25js-launcher-v7.py.txt:251-281`

**Plausible failure**

A supported signal or exception during process-table acquisition can leave a child outside the launcher-owned broker group, contradicting complete process ownership.

**Closest apparent control**

The ps child is not registered, startup-gated, or represented in launcher cleanup state.

**Required Revision VII correction**

Use a descriptor-only OS primitive or a separately registered, startup-gated inventory helper whose release is included in authoritative finalization.
### JT-B17 — Authoritative failure evidence omits launcher-level finalization dispositions

**Severity:** `high`

**Affected locations**

- `aifinder-phase-25js-launcher-v7.py.txt:492-537`
- `aifinder-phase-25js-launcher-v7.py.txt:802-835`

**Plausible failure**

Ledger ambiguity, launcher group-release failure, broker-status closure failure, and other launcher finalization faults are not represented by exact failure codes or dedicated disposition fields.

**Closest apparent control**

failure_codes and release fields are copied only from coordinator prefinal state.

**Required Revision VII correction**

Extend the authoritative schema with launcher broker-release, status-channel, ledger-read, and bootstrap-finalization states and merge their exact failure codes.


## Newly discovered blockers

The 17 findings above are newly discovered Revision VI blockers. No additional critical or high-severity blocker remains untracked in this review package.

## Prior-finding disposition

The Phase 25JS closure matrix for `JR-B01` through `JR-B17` remains preserved as the Revision VI design intent.

Phase 25JT does not rewrite that historical matrix. Instead, it records the exact source-level defects discovered after reviewing the Revision VI snapshots.

## Readiness disposition

Revision VI static review:

`COMPLETE_WITH_REVISION_REQUIRED`

Revision VI package:

`PRESERVED_AS_HISTORICAL_REVIEW_INPUT`

Revision VII corrected inert package:

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

## Required Revision VII package

The next inert package must provide new identities and correct:

1. close-on-exec handling for every broker-control descriptor;
2. authenticated exit and reap evidence for every tree role;
3. evidence-derived CAP-10 metadata;
4. exact identity binding for every single-probe result;
5. launcher ownership or authenticated registration of every nested session;
6. start-token revalidation immediately before signaling;
7. launcher group-release state as an authoritative PASS requirement;
8. isolated/no-site Python startup for every trusted component;
9. descriptor-authenticated control-root execution without pathname fallback;
10. regular-file and owner validation for every launcher trust read;
11. exact execution-baseline binding;
12. TCP-specific CAP-07 claims or complete multi-transport evidence;
13. canonical localhost-address and resolver-boundary evidence;
14. tree-record binding to authenticated broker PGID/SID;
15. exact mode-specific broker-status schemas;
16. managed launcher process inventory;
17. complete launcher-level finalization fields and failure codes.

The Phase 25JS package must not be overwritten.

## Safe successor

The safe successor is:

**Phase 25JU — Corrected Synthetic Capability Harness Inert Source Revision VII Gate**

Phase 25JU may create only a new static non-executable Revision VII package with new hashes that resolves `JT-B01` through `JT-B17`.

Phase 25JU must not overwrite Phase 25JS snapshots, remove execution sentinels, create executable files, parse or execute Python source, run syntax checks, parse or launch sandbox profiles, materialize runtime files, create an execution envelope or authorization, consume authorization, create synthetic fixtures, invoke clone or sandbox operations, open listeners or sockets, perform DNS resolution, inspect environment values, lint, build, or start AiFinder, invoke C01 or C02, access a database or external service, install packages, begin Batch D, or authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JT only if all answers are affirmative:

1. Is Phase 25JT anchored to exact Phase 25JS commit `bf30fe37ae4b3eb41f91d879d72e2de15cce2664`?
2. Are all Phase 25JS identities verified without parsing or execution?
3. Are all four execution sentinels preserved?
4. Do broker status and startup-gate descriptors leak into execed roles?
5. Must all broker-control descriptors be close-on-exec?
6. Does the tree broker wait for only the parent?
7. Must child and grandchild exits be independently authenticated?
8. Are CAP-10 reaped and independent-enumeration claims unsupported?
9. Must every single-probe result bind schema, role, nonce, lineage, PGID, and SID?
10. Do nested start_new_session brokers escape launcher PGID cleanup?
11. Must the launcher own or authenticate every nested session?
12. Is the stored process start token unused before signaling?
13. Must start identity be revalidated immediately before killpg?
14. Can suppressed launcher cleanup failure permit authoritative PASS?
15. Must launcher broker release be a required authoritative state?
16. Are nested Python interpreters missing isolated/no-site startup?
17. Must startup isolation occur before any unreviewed import path executes?
18. Does mutable pathname execution reintroduce trust-root TOCTOU?
19. Must trusted control components be opened and executed by descriptor?
20. Do launcher trust reads omit regular-file and owner checks?
21. Must execution_baseline_commit equal one exact approved commit?
22. Is CAP-07's transport-neutral claim unsupported by TCP-only evidence?
23. Does CAP-08 omit canonical loopback-address and resolver-boundary proof?
24. Are tree record PGID/SID values unbound to broker status?
25. Are broker status schemas and identities incompletely validated?
26. Is launcher process inventory unmanaged?
27. Are launcher-level finalization failures missing from authoritative evidence?
28. Is syntax and materialization-preflight readiness rejected?
29. Is Phase 25JU limited to a new inert Revision VII package?
30. Are parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
31. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JS corrected inert revision VI: 100%
- Phase 25JT Revision VI source review: 100%
- Phase 25JT Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
