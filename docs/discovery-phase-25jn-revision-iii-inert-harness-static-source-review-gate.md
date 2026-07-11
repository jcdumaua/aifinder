# Phase 25JN — Revision III Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JN`
- Batch: `C — Controlled Runtime Validation`
- Phase type: Revision III inert-source static review
- Approved predecessor phase: `25JM`
- Approved predecessor commit: `a2448d63467c415a3c7c1d4daf5aaf522b535415`
- Phase 25JM artifact SHA-256: `40383ef2225808ab41185f43fc304cfca934681c6a7b1405ef0bc59951b7b7c8`
- Phase 25JM outer package-manifest SHA-256: `bca83ccce09c6d36dfb66cca513b5afeba1e8e70485c969fbdaf9324c6ca7686`
- Phase 25JM root-trust-manifest SHA-256: `ef4cd3296fda350bdc244f4fe78c7646bbfa125cecbc00444669ee781bb42f68`
- Phase 25JM bootstrap-manifest SHA-256: `4f752fb79bfdd71176344efafd82c8837a652ede62c1ed01583737525a65a5d1`
- Phase 25JM launcher SHA-256: `d52de7e488468b7afc61ff4a7fa1169467f81a7430c4d14b5cf610523efb0c5d`
- Phase 25JM materializer SHA-256: `459acbe43819cc0602d8d7a3f42d8d718c89a3f074579a91ef2d5af194121ec3`
- Phase 25JM wrapper SHA-256: `3c5519cf367ac148718a862b57eee71ca4f3608f6779af90032675a87e0b2489`
- Phase 25JM supervisor SHA-256: `fdd31432c10b677c337a6c32e115fd7c89b897cbd8b0392e00006e4bce7c4754`
- Phase 25JM defect-closure matrix SHA-256: `7dd75499dad76e52c12a4d75abeaa052a1be10a24ffce804ad6dd6829c757d02`
- Phase 25JM review-identities SHA-256: `70914b55b8ffb3baf49bd791057e4ef879a93ac7f5183ebe851d68d3db3cf0d8`
- Source execution in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JN performs the final text-only review of the exact Revision III package.

The review verifies static identities and inspects the launcher, materializer, wrapper, supervisor, manifests, contract, schemas, policies, profiles, and closure matrix as text.

No source was parsed by a language interpreter or compiler. No shell or Python syntax check, sandbox-profile parse, materialization, authorization action, fixture, listener, resolver, capability, application runtime, or external-service action occurred.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JM artifact | `40383ef2225808ab41185f43fc304cfca934681c6a7b1405ef0bc59951b7b7c8` |
| Outer package manifest | `bca83ccce09c6d36dfb66cca513b5afeba1e8e70485c969fbdaf9324c6ca7686` |
| Root-trust manifest | `ef4cd3296fda350bdc244f4fe78c7646bbfa125cecbc00444669ee781bb42f68` |
| Bootstrap manifest | `4f752fb79bfdd71176344efafd82c8837a652ede62c1ed01583737525a65a5d1` |
| Launcher | `d52de7e488468b7afc61ff4a7fa1169467f81a7430c4d14b5cf610523efb0c5d` |
| Materializer | `459acbe43819cc0602d8d7a3f42d8d718c89a3f074579a91ef2d5af194121ec3` |
| Wrapper | `3c5519cf367ac148718a862b57eee71ca4f3608f6779af90032675a87e0b2489` |
| Supervisor | `fdd31432c10b677c337a6c32e115fd7c89b897cbd8b0392e00006e4bce7c4754` |
| Defect-closure matrix | `7dd75499dad76e52c12a4d75abeaa052a1be10a24ffce804ad6dd6829c757d02` |
| Review identities | `70914b55b8ffb3baf49bd791057e4ef879a93ac7f5183ebe851d68d3db3cf0d8` |

All outer-manifest component hashes were also verified against the exact external package files.

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review completeness:

`COMPLETE_WITH_REVISION_REQUIRED`

Materialization-preflight readiness:

`BLOCKED_PENDING_REVISION_IV`

## Review decision

`REVISION_REQUIRED_NOT_READY_FOR_MATERIALIZATION_OR_SYNTAX_VALIDATION`

Revision III significantly improves source separation, manifest coverage, descriptor-safe materializer reads, complete materializer writes, authorization ordering, evidence retention, and result buffering.

However, two core identities remain cryptographically circular, the supervisor contains incompatible copied helper calls, and mutable run-root, result-channel, cleanup, ledger-root, schema-parity, and process-ownership defects remain.

The package must not advance to syntax validation, profile parsing, materialization preflight, authorization creation, or capability execution.

## Blocking findings

### JN-B01 — Launcher and execution-envelope identities are cryptographically circular

**Severity:** critical

**Source:** launcher expected-envelope constant and execution-envelope launcher_sha256

A future authorized launcher must embed the exact execution-envelope SHA-256. The execution envelope must simultaneously contain that launcher's SHA-256. Changing either value changes the other artifact's hash, so the two exact identities cannot be generated through an ordinary finite construction.

**Required correction:**

Remove one direction of the cycle. A separately authenticated operator envelope may bind the launcher without being embedded in that launcher, or a fixed launcher may verify a detached signature or operator-supplied digest through a separately governed trust root.
### JN-B02 — Authorization ID is circularly defined as the hash of the file containing that ID

**Severity:** critical

**Source:** materializer and supervisor authorization_id checks

The authorization file must contain authorization_id, while both runtime layers require that field to equal the SHA-256 of the complete authorization file bytes. This is a cryptographic fixed-point requirement and is not a practical authorization construction.

**Required correction:**

Derive the consumption key externally from the verified authorization bytes and remove the embedded self-hash, or define the ID as a hash of a precisely specified canonical payload that excludes the ID field.
### JN-B03 — Supervisor result helpers use incompatible copied APIs

**Severity:** critical

**Source:** read_probe_result and validate_denial

The supervisor defines load_regular_json and strict_object with a keys keyword. The copied probe helpers call an undefined load_json_regular function and pass required to strict_object. CAP-05 and later result validation therefore has no coherent future path.

**Required correction:**

Use one reviewed helper API consistently and add a later non-executing source review that verifies every helper reference and keyword contract before syntax validation.
### JN-B04 — Envelope bootstrap identity is not bound to the launcher-verified bootstrap identity

**Severity:** critical

**Source:** materializer validate_execution_envelope and validate_root_manifest

The launcher passes its embedded bootstrap hash and the root manifest is checked against it. The envelope's bootstrap_manifest_sha256 is never compared with that value. Authorization and trusted identity can therefore carry a different bootstrap identity while all current checks pass.

**Required correction:**

Require exact equality among the launcher-verified bootstrap hash, envelope bootstrap hash, root-manifest bootstrap hash, authorization bootstrap hash, and trusted-identity bootstrap hash.
### JN-B05 — Wrapper and supervisor are executed before their immutable identities are authenticated

**Severity:** critical

**Source:** launcher wrapper invocation and wrapper supervisor invocation

The launcher invokes the wrapper by path after materialization without re-verifying it. The wrapper then invokes the supervisor before the supervisor can validate component hashes. Because the run-root directory remains owner-writable, same-user replacement between materialization and invocation can execute unreviewed bytes.

**Required correction:**

Place immutable components in a locked non-writable component directory, verify opened descriptors immediately before invocation, and separate writable capability state into a distinct directory.
### JN-B06 — Sandbox profiles expose the trust root to capability processes

**Severity:** critical

**Source:** all Revision III sandbox profiles

The profiles allow file-read and file-write operations across the entire private run root. That scope contains authorization, trusted identity, manifests, wrapper, supervisor, profiles, and the future inner-result path. Synthetic probes can therefore inspect, unlink, replace, or precreate trust and result artifacts under the same user identity.

**Required correction:**

Use separate immutable control and writable work roots. Profiles must read only explicitly required probe inputs and write only dedicated per-capability result directories.
### JN-B07 — The inner-result channel can be precreated or spoofed

**Severity:** critical

**Source:** supervisor O_EXCL result write and materializer inner-result read

A sandboxed process with run-root write access can create inner-result.json before the supervisor. The supervisor's O_EXCL write then fails, its fallback write also fails, and the materializer later accepts the precreated file as the inner result.

**Required correction:**

Create the result channel in a non-sandbox-writable coordinator directory, retain its directory descriptor, and bind the result to the supervisor through a nonce or coordinator-created descriptor.
### JN-B08 — Authoritative finalization does not validate the inner-result contract

**Severity:** critical

**Source:** materializer finalize

Finalization does not enforce the inner-result key set, schema version, authorization hash, CAP-01 through CAP-12 order, capability states, process/listener/repository PASS dispositions, or bounded metadata shape. It can produce PASS from any object claiming INNER_PASS with twelve list items.

**Required correction:**

Implement a strict inner-result validator before cleanup disposition is combined with CAP-13. Reject every unknown key, missing evidence item, reordered capability, non-PASS disposition, authorization mismatch, and oversized metadata value.
### JN-B09 — Run-root and bootstrap cleanup are path-based rather than identity-bound

**Severity:** critical

**Source:** materializer safe_remove_tree and launcher cleanup_path

Both cleanup layers verify only that the original pathname no longer exists. A same-user process can rename the original directory and replace the path, allowing cleanup to remove the replacement and report success while the real capability or bootstrap state survives elsewhere.

**Required correction:**

Retain parent and directory descriptors plus device/inode identity, stop all owned processes, remove entries descriptor-relatively, and verify that the originally opened object was deleted.
### JN-B10 — Launcher cleanup is not protected by an unconditional non-reentrant EXIT trap

**Severity:** high

**Source:** launcher signal traps and explicit finish call

The launcher traps INT, TERM, and HUP but not EXIT. Fatal shell conditions such as an unbound variable can bypass the explicit finish call. The signal handler also calls finish without first disabling traps, allowing re-entry during cleanup.

**Required correction:**

Install one EXIT trap before temporary-state creation, disable all traps on entry to the finalizer, and make finalization idempotent and non-reentrant.
### JN-B11 — Canonical ledger location is caller-controlled through HOME

**Severity:** critical

**Source:** materializer Path.home and launcher environment

The expected User Library ledger path is derived with Path.home. The launcher neither clears nor sets HOME before invoking isolated Python. A caller-controlled HOME value can redefine the supposedly canonical ledger root, after which envelope and authorization values can be made to match it.

**Required correction:**

Resolve the current user's home directory from a trusted account database or separately approved absolute value, clear HOME, and bind the resolved path into the operator trust record.
### JN-B12 — Complete-write guarantees are not applied throughout the supervisor and generated probes

**Severity:** high

**Source:** write_private_file, atomic_json_write, network probe, and resolver probe

Several capability files and structured results still use one os.write call and assume the entire buffer was written. These paths include rendered profiles, probe sources, atomic probe results, resolver results, and synthetic fixtures.

**Required correction:**

Use one bounded write-all helper for every regular-file and probe-result write, followed by fsync and destination-byte or hash verification.
### JN-B13 — Canonical contract and schema parity remains incomplete

**Severity:** high

**Source:** materializer and supervisor contract validators

The materializer does not compare the allowed-actions, prohibited-actions, or ledger-relative-directory values to fixed canonical values. The supervisor checks even fewer canonical contract fields. The included schema artifacts are not consumed as validators.

**Required correction:**

Enforce every exact contract value independently in both coordinator and supervisor, or use one audited shared validator whose hash and output are included in the trust chain.
### JN-B14 — Bootstrap manifest validation accepts an incomplete subset

**Severity:** high

**Source:** materializer validate_bootstrap_manifest

Validation confirms only that each listed bootstrap file appears identically in the root manifest. It does not require the exact approved bootstrap file set, so mandatory components may be omitted without this validator rejecting the manifest.

**Required correction:**

Require the exact approved bootstrap component-name set and exact count, then verify every file's hash and mode against both manifests.
### JN-B15 — Supervisor trust inputs are re-read through path-based TOCTOU-prone operations

**Severity:** critical

**Source:** load_regular_json and sha256_file in validate_runtime_contract

After descriptor-safe materialization, the supervisor checks is_symlink, is_file, stat, read_text, and read_bytes through separate pathname operations. Same-user replacement inside the writable run root can change the object between checks and reads.

**Required correction:**

Pass trusted directory descriptors into the supervisor and perform O_NOFOLLOW open, fstat, bounded read, and hash validation on the same opened descriptor.
### JN-B16 — Process-group termination can signal a reused process-group ID

**Severity:** critical

**Source:** terminate_reap_verify

The supervisor sends signals to the recorded process-group number without first proving that the currently owned Popen process still exists in that group. If the original process exits and the ID is reused, termination can target an unrelated process group.

**Required correction:**

Before signaling, revalidate the live parent PID, start identity, and PGID; retain a stronger process identity record and fail closed rather than signaling when ownership cannot be proven.
### JN-B17 — CAP-13 evidence excludes launcher bootstrap-cleanup disposition

**Severity:** high

**Source:** materializer CAP-13 record and launcher finish

CAP-13 records only private run-root cleanup. Bootstrap cleanup occurs later in the launcher. A bootstrap cleanup failure produces a generic launcher failure result with no complete CAP-13 evidence ledger, so the stated ordered CAP-01 through CAP-13 trace is lost on this failure path.

**Required correction:**

Make the final coordinator append or amend CAP-13 only after both run-root and bootstrap-root cleanup are complete, preserving the full capability ledger on both PASS and failed-closed paths.


## Prior-finding disposition

| Prior finding | Phase 25JN disposition | Reason |
|---|---|---|
| `JL-B01` | `reopened` | A separate materializer exists, but the candidate package remains non-runnable because of helper and trust-chain defects. |
| `JL-B02` | `partially closed` | The wrapper placeholder is removed, but wrapper and supervisor invocation are not authenticated immediately before execution. |
| `JL-B03` | `closed in source-state model` | Source state and envelope runtime authority are separated. |
| `JL-B04` | `closed in authority model` | Execution baseline is envelope-only. |
| `JL-B05` | `reopened` | Launcher and package values are present but launcher-envelope circularity and bootstrap mismatch remain. |
| `JL-B06` | `partially closed` | Action arrays are compared to the contract but the contract arrays are not independently fixed to canonical values. |
| `JL-B07` | `reopened` | Explicit validators exist, but helper incompatibilities and incomplete exact-value parity remain. |
| `JL-B08` | `closed conceptually` | One envelope repository authority is copied to trusted identity. |
| `JL-B09` | `reopened` | Ledger mechanics improved, but HOME still controls the allegedly canonical root. |
| `JL-B10` | `reopened` | The verified authorization hash is used as a ledger key, but the authorization embeds an impossible self-hash ID. |
| `JL-B11` | `closed` | No assert statement is used as a trust control. |
| `JL-B12` | `reopened` | Materializer writes use loops, but supervisor and probe writes still assume complete single writes. |
| `JL-B13` | `reopened` | Evidence is retained by the supervisor, but the materializer does not validate it before authoritative PASS. |
| `JL-B14` | `reopened` | CAP-13 follows run-root cleanup but not launcher bootstrap cleanup. |
| `JL-B15` | `reopened` | Output is buffered until bootstrap cleanup on the normal path, but failure paths lose the complete capability ledger. |
| `JL-B16` | `reopened` | Materializer source reads are descriptor-safe, but supervisor trust reads revert to path-based TOCTOU-prone operations. |
| `JL-B17` | `partially closed` | The root manifest includes the launcher, but the launcher and envelope hashes are mutually circular. |

## Readiness disposition

Revision III static review:

`COMPLETE_WITH_REVISION_REQUIRED`

Revision III source package:

`PRESERVED_AS_HISTORICAL_REVIEW_INPUT`

Revision IV corrected source package:

`REQUIRED`

Shell syntax validation:

`NOT_AUTHORIZED`

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

## Required Revision IV package

The next inert package must provide new hashes for:

1. a fixed launcher with no envelope-hash cycle;
2. an authorization format with no self-hash cycle;
3. a corrected supervisor helper layer;
4. an exact bootstrap and envelope binding;
5. immutable control and narrowly writable work directories;
6. an authenticated non-sandbox-writable result channel;
7. a strict inner-result validator;
8. descriptor-identity-bound cleanup;
9. a non-reentrant unconditional launcher finalizer;
10. a trusted canonical home and ledger-root resolver;
11. complete writes for all supervisor and probe files;
12. exact canonical contract validation;
13. exact bootstrap-set validation;
14. descriptor-based supervisor trust reads;
15. process identity revalidation before group signaling;
16. CAP-13 evidence covering every outer cleanup layer;
17. a defect-closure matrix covering `JN-B01` through `JN-B17`.

The Phase 25JM package must not be overwritten.

## Safe successor

The safe successor is:

**Phase 25JO — Corrected Synthetic Capability Harness Inert Source Revision IV Gate**

Phase 25JO may create only a new static non-executable Revision IV package with new hashes that resolves `JN-B01` through `JN-B17`.

Phase 25JO must not:

- overwrite Phase 25JM snapshots;
- remove execution sentinels;
- create executable files;
- run shell or Python syntax checks;
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

Gemini should approve Phase 25JN only if all answers are affirmative:

1. Is Phase 25JN anchored to exact Phase 25JM commit `a2448d63467c415a3c7c1d4daf5aaf522b535415`?
2. Are all Phase 25JM package identities verified without parsing or execution?
3. Are all four execution sentinels preserved?
4. Is the launcher-to-envelope SHA-256 cycle classified as critical?
5. Is the authorization self-hash construction classified as critical?
6. Are the supervisor helper-name and keyword mismatches identified?
7. Is bootstrap identity required to match across launcher, envelope, root, authorization, and trusted identity?
8. Must wrapper and supervisor bytes be authenticated immediately before execution?
9. Must sandbox write access exclude trust and result artifacts?
10. Is the inner-result precreation/spoofing path classified as critical?
11. Is strict authoritative inner-result validation required?
12. Is cleanup required to be descriptor- and identity-bound?
13. Is an unconditional non-reentrant EXIT finalizer required?
14. Is caller-controlled HOME rejected as a canonical ledger source?
15. Are complete-write loops required throughout supervisor and generated probe code?
16. Is exact canonical contract parity required?
17. Is the exact bootstrap file set required?
18. Must supervisor trust reads use opened descriptors?
19. Must process ownership be revalidated before process-group signaling?
20. Must CAP-13 include run-root and bootstrap-root cleanup evidence?
21. Is materialization-preflight and syntax-validation readiness rejected?
22. Is Phase 25JO limited to a new inert Revision IV package?
23. Are syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
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
- Phase 25JN Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
