# Phase 25JP — Revision IV Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JP`
- Batch: `C — Controlled Runtime Validation`
- Phase type: Revision IV inert-source static review
- Approved predecessor phase: `25JO`
- Approved predecessor commit: `fbc14f5bb70cee7562ee7213a69c07b8e58335bd`
- Phase 25JO artifact SHA-256: `9a34f2dc2033f7740e5dbe8a9eeff8d3d4d0033d2fe06549d0b258ef6c844811`
- Phase 25JO outer package-manifest SHA-256: `456a75d7fb3bf2224502ae51df7d3c6494a8643828d6ba3b068c5835a54d5213`
- Phase 25JO root-trust-manifest SHA-256: `7e6b180a36c4f9764c5a7bd013a00da3d1d8abd7e055ef2801a085f93036b37c`
- Phase 25JO bootstrap-manifest SHA-256: `fbe40d9b4043b66d04b9b152e24d879f1db2b527d693ce378e4ac5daa6e0620e`
- Phase 25JO launcher SHA-256: `c172612bbf39a016f9ddf3ef825059be04e1c7fdb8dbcd53b5e904cf50195e21`
- Phase 25JO coordinator SHA-256: `cd0ca96a5e1d9eb9c874475bb7c900593170b3ecde44d25465293584059e7800`
- Phase 25JO defect-closure matrix SHA-256: `67e33a5b881a0fec92d42b269a6652df0ba46f9fe46a880c1fe65fc5035cf23b`
- Phase 25JO review-identities SHA-256: `c330d5e835d682afd940d35af287097f232bf8a667807d8c62f4d63ddd0adf7f`
- Source execution in this phase: `NONE`
- Language-parser or syntax-check execution in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JP performs the final text-only review of the exact Revision IV package.

All package identities were recomputed from the external review files. The launcher, coordinator, manifests, contract, schemas, policy, profiles, and closure matrix were inspected only as inert text.

No Python interpreter, compiler, syntax checker, sandbox-profile parser, materialization path, authorization action, synthetic fixture, listener, resolver, capability, application runtime, or external service was invoked.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JO artifact | `9a34f2dc2033f7740e5dbe8a9eeff8d3d4d0033d2fe06549d0b258ef6c844811` |
| Outer package manifest | `456a75d7fb3bf2224502ae51df7d3c6494a8643828d6ba3b068c5835a54d5213` |
| Root-trust manifest | `7e6b180a36c4f9764c5a7bd013a00da3d1d8abd7e055ef2801a085f93036b37c` |
| Bootstrap manifest | `fbe40d9b4043b66d04b9b152e24d879f1db2b527d693ce378e4ac5daa6e0620e` |
| Launcher | `c172612bbf39a016f9ddf3ef825059be04e1c7fdb8dbcd53b5e904cf50195e21` |
| Coordinator | `cd0ca96a5e1d9eb9c874475bb7c900593170b3ecde44d25465293584059e7800` |
| Defect-closure matrix | `67e33a5b881a0fec92d42b269a6652df0ba46f9fe46a880c1fe65fc5035cf23b` |
| Review identities | `c330d5e835d682afd940d35af287097f232bf8a667807d8c62f4d63ddd0adf7f` |

All outer-manifest component hashes were verified against the exact external files.

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review completeness:

`COMPLETE_WITH_REVISION_REQUIRED`

Syntax and materialization-preflight readiness:

`BLOCKED_PENDING_REVISION_V`

## Review decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

Revision IV successfully removes both cryptographic cycles, eliminates wrapper/supervisor duplication, separates control and work concepts, derives the account home from the user database, and introduces stronger process identity and result-ordering concepts.

It still has impossible protected-directory construction paths, non-inherited `/dev/fd` work paths, incomplete failure cleanup, unbounded coordinator capture, path-based capability evidence, and unresolved contract and process-release defects.

The package must not advance to syntax validation, sandbox-profile parsing, materialization preflight, execution-envelope creation, authorization creation, or capability execution.

## Blocking findings

### JP-B01 — Launcher bootstrap directory is non-writable before coordinator creation

**Severity:** critical

**Source:** launcher create_bootstrap and write_bootstrap_file

The launcher creates the bootstrap directory, immediately changes it to mode 0500, and then attempts O_CREAT inside that directory. The owner lacks directory write permission, so coordinator.py cannot be created through the documented future path.

**Required correction:**

Create and verify files while the private directory is mode 0700, fsync it, then transition the directory to 0500 before opening the executable descriptor.
### JP-B02 — Coordinator control root is non-writable before component materialization

**Severity:** critical

**Source:** coordinator create_identity_directory and write_regular_at

The control root is created and changed to mode 0500 before the coordinator copies the contract, schemas, policy, and profiles into it. Every O_CREAT operation in the control root is therefore denied.

**Required correction:**

Materialize into a 0700 staging control root, verify all bytes and identities, fsync, then seal it to 0500 before capability work begins.
### JP-B03 — Child processes cannot resolve coordinator /dev/fd directory paths

**Severity:** critical

**Source:** control_path, work_path, subprocess.run, stream_process, and launch_probe_tree

The coordinator represents control and work roots as /dev/fd directory paths. Child processes are launched with close_fds enabled and without passing those directory descriptors. Paths such as /dev/fd/N/clone/source, probe files, profiles, and result directories therefore disappear in the child process.

**Required correction:**

Retain real identity-checked private paths for child arguments or explicitly pass narrowly scoped file descriptors and invoke exact files through those inherited descriptors.
### JP-B04 — Rename-and-replacement cleanup race remains open

**Severity:** critical

**Source:** remove_identity_directory and remove_bootstrap

Cleanup removes the directory name from the parent after operating through the original directory descriptor. A same-user process can rename the original directory and place a replacement at the old name. Cleanup can remove the replacement and report success while the original directory survives under another name.

**Required correction:**

Use a parent-owned private namespace inaccessible to capability processes, retain link-count and identity evidence, and verify that the original inode has no surviving directory entry.
### JP-B05 — Launcher failure paths do not remove bootstrap state

**Severity:** critical

**Source:** launcher except and finally blocks

The launcher removes the bootstrap directory only on the normal success path. Its finally block closes descriptors but performs no cleanup. Any exception after bootstrap creation leaves the bootstrap directory and coordinator copy behind.

**Required correction:**

Move identity-bound bootstrap cleanup into one unconditional non-reentrant finalizer and make cleanup disposition part of every authoritative result.
### JP-B06 — Coordinator failure paths leak control and work roots

**Severity:** critical

**Source:** coordinator main exception and finally handling

Control and work roots are removed only after all capabilities complete. CoordinatorFailure paths emit a failed prefinal record without deleting either root, while unexpected BaseException paths escape without a prefinal result and still only close descriptors.

**Required correction:**

Install an unconditional coordinator finalizer that releases processes and listeners, performs identity-bound control/work cleanup, records each disposition, and catches unexpected failures.
### JP-B07 — Finalization is not unconditional for termination signals

**Severity:** critical

**Source:** launcher and coordinator signal handling

Neither Python entry point installs handlers for SIGTERM or SIGHUP. Default signal termination can bypass Python finally blocks, contradicting the claimed unconditional finalization property.

**Required correction:**

Install minimal signal handlers that request shutdown and route all supported termination paths through one idempotent finalizer. SIGKILL remains explicitly outside the guarantee.
### JP-B08 — Coordinator execution has no timeout or bounded output capture

**Severity:** critical

**Source:** launcher subprocess.run capture_output

The launcher captures coordinator stdout and stderr without a timeout or byte limit. A hung or unexpected coordinator can block indefinitely or exhaust memory before result validation.

**Required correction:**

Use streaming bounded capture, a suite deadline, rolling secret scanning, and verified termination and reaping of the coordinator process group.
### JP-B09 — Launcher ignores coordinator exit status

**Severity:** critical

**Source:** launcher completed returncode handling

The launcher validates stdout but never requires completed.returncode to agree with the prefinal result. An inconsistent coordinator output and exit status can still reach authoritative result construction.

**Required correction:**

Require return code zero only for PREFINAL_PASS and a nonzero code for PREFINAL_FAILED_CLOSED, with any mismatch treated as a launcher failure.
### JP-B10 — Per-capability result evidence remains path-based and sandbox-writable

**Severity:** critical

**Source:** parse_result and capability result directories

Probe results are checked with separate is_symlink, is_file, stat, and read_text path operations while sandboxed processes still control the directory. The checked object can be replaced between checks and reads, and a role can precreate or alter another role's result.

**Required correction:**

Precreate one parent-owned result descriptor per role, pass only that descriptor, and validate bounded bytes from the same opened object with a coordinator nonce.
### JP-B11 — Probe-tree exceptions can leave owned processes running

**Severity:** critical

**Source:** launch_probe_tree validation sequence

After readiness, failures in JSON parsing, cross-link validation, process enumeration, or release file creation raise before terminate_owned is called. The process tree is not registered in a coordinator-wide finalizer.

**Required correction:**

Register every process immediately in a global ownership table and terminate, reap, and verify absence in a finally block regardless of evidence-validation outcome.
### JP-B12 — CAP-07 UDP-denial expectation is unsupported by the exact-endpoint profile

**Severity:** critical

**Source:** exact-endpoint sandbox profile and CAP-07

The profile permits outbound traffic to an IP-and-port endpoint but contains no transport-protocol restriction. CAP-07 nevertheless requires UDP to the same endpoint to be denied. The static profile does not establish that property.

**Required correction:**

Either narrow the claim to endpoint authorization independent of transport or use a reviewed mechanism that can distinguish TCP from UDP before testing transport-specific denial.
### JP-B13 — Process release does not prove complete process-group absence

**Severity:** high

**Source:** terminate_owned

The coordinator revalidates and signals the parent, then checks only the explicitly supplied child and grandchild PIDs. It does not enumerate the complete process group after reaping, so unrecorded descendants can survive.

**Required correction:**

Enumerate the full PGID before and after termination, bind every member to the owned tree, and require zero remaining group members.
### JP-B14 — Manifest schema and mode records are not strictly validated

**Severity:** high

**Source:** launcher root handling and coordinator validate_manifest_set

The code requires exact file-name sets and matching records but does not require exact manifest schema versions, phase, package state, record key sets, 0644 source modes, or valid SHA-256 formats.

**Required correction:**

Validate both manifests as exact canonical objects and require every record to contain only sha256 and mode with exact approved values.
### JP-B15 — Ledger-policy identity is not bound to the trusted package record

**Severity:** critical

**Source:** validate_authorization and consume_authorization

Envelope and authorization ledger_policy_sha256 values are compared with each other, but the value is never required to equal the ledger-policy component hash in the root manifest.

**Required correction:**

Bind the envelope and authorization ledger-policy digest to the exact root-manifest file record before authorization consumption.
### JP-B16 — Authorization consumption disposition becomes inaccurate after downstream failure

**Severity:** high

**Source:** coordinator consume_authorization and failure prefinal

Authorization is consumed before repository and capability validation. If a later operation fails, the generic failed prefinal reports NOT_CONSUMED_OR_UNKNOWN even though the durable ledger entry may already exist.

**Required correction:**

Track consumption as explicit state and report CONSUMED_AND_NOT_REUSABLE on every path after the ledger fsync succeeds.
### JP-B17 — PREFINAL_PASS validation permits contradictory authoritative PASS state

**Severity:** critical

**Source:** launcher validate_prefinal and authoritative_result

For PREFINAL_PASS, the launcher does not require primary_state PASS, primary_failure_code null, failure_codes empty, or bounded canonical capability metadata. A contradictory record can satisfy the current checks and still produce authoritative PASS.

**Required correction:**

Validate the complete prefinal object against one exact canonical result contract, including state, failure fields, metadata schemas, value bounds, and coordinator return-code parity.


## Prior-finding disposition

| Prior finding | Phase 25JP disposition | Reason |
|---|---|---|
| `JN-B01` | `closed` | The launcher no longer embeds the execution-envelope hash. |
| `JN-B02` | `closed` | The authorization no longer contains an embedded self-hash. |
| `JN-B03` | `closed structurally` | Wrapper and supervisor layers were removed. |
| `JN-B04` | `partially closed` | Bootstrap hashes are compared, but manifest canonical validation remains incomplete. |
| `JN-B05` | `reopened` | The coordinator is descriptor-invoked, but protected-directory construction and child /dev/fd paths are not viable. |
| `JN-B06` | `partially closed` | Control/work roots are separated, but writable probe-result evidence remains path-based. |
| `JN-B07` | `closed for the coordinator summary` | The former inner-result file was removed. |
| `JN-B08` | `reopened` | Prefinal validation omits contradictory state and metadata constraints. |
| `JN-B09` | `reopened` | Descriptor cleanup still permits original-directory rename survival. |
| `JN-B10` | `reopened` | Finally blocks exist but do not perform unconditional cleanup and signals can bypass them. |
| `JN-B11` | `closed` | Trusted home is derived through pwd.getpwuid. |
| `JN-B12` | `closed for generated writes` | Complete-write loops are present in generated probe and regular-file writes. |
| `JN-B13` | `closed for the contract object` | The coordinator compares the contract to one canonical object. |
| `JN-B14` | `partially closed` | File-name sets are exact, but manifest schema and record semantics are not. |
| `JN-B15` | `partially closed` | Trust source reads use descriptors, but probe evidence reads are path-based. |
| `JN-B16` | `partially closed` | Parent ownership is revalidated before signaling, but full process-group absence is not proven. |
| `JN-B17` | `reopened` | CAP-13 includes three labels only on the normal path; cleanup is not guaranteed on failure paths. |

## Readiness disposition

Revision IV static review:

`COMPLETE_WITH_REVISION_REQUIRED`

Revision IV source package:

`PRESERVED_AS_HISTORICAL_REVIEW_INPUT`

Revision V corrected source package:

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

## Required Revision V package

The next inert package must provide new hashes for:

1. writable-then-sealed bootstrap construction;
2. writable-then-sealed control-root construction;
3. child-visible, identity-safe control and work paths or explicitly inherited descriptors;
4. cleanup that cannot be defeated by rename-and-replacement;
5. unconditional bootstrap cleanup on every launcher path;
6. unconditional control/work cleanup on every coordinator path;
7. explicit supported-signal shutdown routing;
8. bounded and timed coordinator output capture;
9. coordinator exit-code/result parity;
10. descriptor-bound per-role capability evidence;
11. coordinator-wide process and listener ownership;
12. a transport-consistent CAP-07 claim;
13. complete process-group absence verification;
14. exact canonical manifest validation;
15. ledger-policy digest binding;
16. accurate authorization-consumption disposition;
17. an exact canonical prefinal validator.

The Phase 25JO package must not be overwritten.

## Safe successor

The safe successor is:

**Phase 25JQ — Corrected Synthetic Capability Harness Inert Source Revision V Gate**

Phase 25JQ may create only a new static non-executable Revision V package with new hashes that resolves `JP-B01` through `JP-B17`.

Phase 25JQ must not:

- overwrite Phase 25JO snapshots;
- remove execution sentinels;
- create executable files;
- parse or execute Python source;
- run syntax checks;
- parse or launch sandbox profiles;
- materialize runtime files;
- create an execution envelope or authorization;
- consume authorization;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- lint, build, or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JP only if all answers are affirmative:

1. Is Phase 25JP anchored to exact Phase 25JO commit `fbc14f5bb70cee7562ee7213a69c07b8e58335bd`?
2. Are all Phase 25JO identities verified without language parsing or execution?
3. Are both execution sentinels preserved?
4. Is bootstrap creation in a pre-sealed 0500 directory classified as impossible?
5. Is control-root materialization in a pre-sealed 0500 directory classified as impossible?
6. Are non-inherited `/dev/fd` child paths classified as critical?
7. Is the rename-and-replacement cleanup race classified as unresolved?
8. Must launcher bootstrap cleanup occur on every failure path?
9. Must coordinator control/work cleanup occur on every failure path?
10. Are supported termination signals required to route through finalization?
11. Are coordinator timeout and bounded output capture required?
12. Must coordinator exit status match its prefinal result?
13. Must capability evidence use descriptor-bound, role-isolated channels?
14. Must every probe-tree exception release the complete owned process tree?
15. Is the CAP-07 UDP-denial claim unsupported by the current profile?
16. Must complete process-group absence be verified?
17. Must root and bootstrap manifests be exact canonical objects?
18. Must the ledger-policy hash bind to the root-manifest component record?
19. Must authorization consumption state remain accurate after downstream failure?
20. Must PREFINAL_PASS enforce primary state, failure fields, metadata schemas, bounds, and exit-code parity?
21. Is syntax and materialization-preflight readiness rejected?
22. Is Phase 25JQ limited to a new inert Revision V package?
23. Are parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
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
- Phase 25JL Revision II source review: 100%
- Phase 25JM corrected inert revision III: 100%
- Phase 25JN Revision III source review: 100%
- Phase 25JO corrected inert revision IV: 100%
- Phase 25JP Revision IV source review: 100%
- Phase 25JP Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
