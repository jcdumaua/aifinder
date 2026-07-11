# Phase 25JJ — Corrected Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JJ`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert-source static review
- Approved predecessor phase: `25JI`
- Approved predecessor commit: `8c0f444d1025767281dc96ad67e6a11ad5a78ebc`
- Phase 25JI artifact SHA-256: `a4f859cbea5a6874b6fc15c4b60d0ad49a47d7da4cc9324a56cbc97da910b6ae`
- Phase 25JI stable package-manifest SHA-256: `87bd8bdbc514fbb28c207c48e18311170d5f6428b9b5cc54b0a2d29fd5557396`
- Phase 25JI component-manifest SHA-256: `0d31ae230cf5c25a916f91ab7ea54fbe38c9a8be04180ca63a2c13167f75c1a5`
- Phase 25JI defect-closure matrix SHA-256: `3e48ec724dcb47d40fd988ff98bd4e55e3fdf49de7b8a21adb4a28d95881c736`
- Phase 25JI review-identities SHA-256: `7b89523e137648e8490b9f000f3c671f1002ad18a95baba2f67e001bbd152431`
- Source execution in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JJ performs the final text-only review of the exact corrected Phase 25JI inert snapshots and determines whether the package is ready for a separately planned syntax-validation phase.

The review verifies package identities and inspects source text only.

It does not:

- modify any snapshot;
- remove an execution sentinel;
- set an authorization value;
- create an executable file;
- run `bash -n`;
- compile or import Python;
- parse or launch a sandbox profile;
- create a fixture;
- invoke `cp -cR` or `sandbox-exec`;
- open a listener or socket;
- perform DNS resolution;
- inspect environment values;
- lint or build AiFinder;
- start a server;
- invoke a route;
- access a database or external service;
- install a package;
- commit or push.

## Reviewed package identity

| Corrected inert component | Verified SHA-256 |
|---|---|
| `aifinder-phase-25ji-component-manifest-v2.json.txt` | `0d31ae230cf5c25a916f91ab7ea54fbe38c9a8be04180ca63a2c13167f75c1a5` |
| `aifinder-phase-25ji-defect-closure-matrix.md` | `3e48ec724dcb47d40fd988ff98bd4e55e3fdf49de7b8a21adb4a28d95881c736` |
| `aifinder-phase-25ji-deny-all-v2.sb.txt` | `66da92e8cc5e38320d8bb467cf83728c5db96f1f5dc33be38e5e24e72c1880b9` |
| `aifinder-phase-25ji-exact-address-v2-template.sb.txt` | `c924e154d1c5f3b762e3924f73fca5299d712fc5d62479f2d2cceef87fe0c89a` |
| `aifinder-phase-25ji-loopback-v2-template.sb.txt` | `030c2d7ea90ad028cd37820f6246cb20876d052ff886da010a80c3f87d820085` |
| `aifinder-phase-25ji-resolver-v2.sb.txt` | `6e153225903d0c48b0d5fa43d2f163a12cdedb884a5eb819ebba3f47b7e98cc3` |
| `aifinder-phase-25ji-shell-wrapper-v2.sh.txt` | `cea586403459e14eba9d33d6f39090241c6cc9419b60335b68a03d680b839368` |
| `aifinder-phase-25ji-supervisor-v2.py.txt` | `61a7988e7038a1c79b760e486de5d4892ba7ce7bf550425f5d9126ab3ec2b992` |

All reviewed source and profile components remain inert text snapshots.

## Review decision

Corrected package identity:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Defect-closure matrix coverage:

`VERIFIED_AS_DOCUMENTATION`

Static implementation quality:

`REVISION_REQUIRED`

Syntax-validation readiness:

`BLOCKED_PENDING_CORRECTED_INERT_REVISION`

Authorization readiness:

`BLOCKED`

Executable-materialization readiness:

`BLOCKED`

The Phase 25JI package must not advance directly to syntax validation.

## Positive findings

The corrected package successfully improves the prior design by:

- removing the command-line expected-authorization hash;
- introducing an immutable component-manifest concept;
- placing authorization consumption before temporary capability state;
- using deny-default sandbox profile candidates;
- adding structured probe-result concepts;
- adding suite and capability deadlines;
- adding active output streaming;
- moving CAP-13 after the primary capability sequence;
- narrowing the APFS claim to logical independence;
- preserving hard execution blocks;
- keeping authorization `UNSET_NOT_AUTHORIZED`.

These improvements do not close the remaining blockers below.

## Blocking findings

### JJ-B01 — Shell guard functions can return success after a failed guard

**Severity:** critical  
**Source:** shell snapshot functions `verify_repository`, `verify_package`, and `materialize_in_temporary_root`

The shell uses forms such as:

`condition || fail "message"`

The `fail` function returns `64`, but the containing function does not immediately return. Later successful commands can overwrite the failure status, allowing the function to return success.

This affects repository identity, synchronization, package hash, file-mode, installation, and materialized-hash checks.

**Required correction:**

Every guard must terminate the containing function immediately through an explicit `return`, `if` block, or a checked helper whose failure cannot be overwritten.

### JJ-B02 — Shell command resolution is not trust-constrained

**Severity:** critical  
**Source:** complete shell snapshot

The wrapper invokes `git`, `python3`, `install`, `mktemp`, `chmod`, and `rm` without an approved fixed command path or verified tool identity.

A modified `PATH`, shell function, alias-compatible environment, or substituted executable can undermine every guard.

**Required correction:**

The next inert snapshot must:

- set and verify a minimal fixed `PATH`;
- use approved absolute command paths;
- prohibit shell-function or alias substitution;
- define required tool identities or a later tool-identity preflight;
- preserve bounded output and metadata-only failure behavior.

### JJ-B03 — Shell cleanup is neither unconditional nor fail-closed

**Severity:** critical  
**Source:** shell `main` temporary-materialization sequence

The wrapper has no cleanup trap.

If `chmod`, materialization, Python startup, interruption, termination, or `rm -rf` fails, the temporary root can remain.

The final `rm -rf` result is ignored, so the wrapper can return a successful supervisor status despite cleanup failure.

**Required correction:**

A corrected wrapper must install cleanup handling before materialization, preserve primary and cleanup dispositions independently, verify deletion, and force overall failure when cleanup fails.

### JJ-B04 — The executable shell would not be independently authenticated

**Severity:** critical  
**Source:** outer package identity model and shell snapshot

The external package manifest records the shell hash, but the proposed execution path begins by trusting that shell.

The shell verifies the supervisor and component manifest, but no separate immutable launcher verifies the shell being executed.

**Required correction:**

The future materialization design must introduce a smaller independently reviewed launcher or operator gate that verifies the shell snapshot hash before materializing or invoking it. The executable shell must not be its own root of trust.

### JJ-B05 — Profiles remain mutable after verification

**Severity:** critical  
**Source:** shell `materialize_in_temporary_root`; Python `verify_repository_guard`; capability profile reads

Only the supervisor is copied into the temporary materialization root.

The supervisor later reads profiles from the external package directory. A profile can change after initial hash verification but before use.

The design also does not reject profile symlinks or verify package-directory ownership and permissions.

**Required correction:**

All reviewed runtime components must be copied from verified regular non-symlink files into one private immutable run root, rehashed there, and used only from that root.

### JJ-B06 — Authorization-file time-of-check/time-of-use is unresolved

**Severity:** critical  
**Source:** `verify_authorization` and later execution flow

The authorization file is hashed, but its path, ownership, mode, regular-file status, symlink status, and stability are not constrained.

The design does not preserve a verified immutable copy of the authorization package before consumption.

**Required correction:**

The authorization package must be a reviewed regular non-symlink file in a protected location, copied or opened immutably after hash verification, and semantically bound to the exact executable package.

### JJ-B07 — The one-use ledger is not durable or trust-verified

**Severity:** critical  
**Source:** `AUTHORIZATION_LEDGER_ROOT` and `consume_authorization_once`

The consumption marker is stored under `/private/tmp`.

It can disappear through reboot, cleanup, or manual deletion. The parent directory can pre-exist with unexpected ownership, permissions, or symlink behavior. The directory entry is not fsynced.

Therefore the same authorization can become reusable.

**Required correction:**

The next design must define a durable, repository-external, ownership-checked ledger with atomic creation, directory synchronization, non-removable governance disposition, and explicit recovery handling.

### JJ-B08 — Authorization semantics are not runtime-validated

**Severity:** high  
**Source:** `verify_authorization`

The supervisor verifies only the authorization file hash.

It does not parse and confirm that the authorization itself names:

- the exact baseline;
- exact executable component hashes;
- exact capability set;
- exact limits;
- one attempt;
- zero retries;
- prohibited application and external-service actions;
- consumption semantics.

**Required correction:**

The authorization package needs a strict canonical schema whose fields are checked before consumption. Free-form text integrity alone is insufficient.

### JJ-B09 — Component-manifest schema and limits are not enforced

**Severity:** high  
**Source:** `load_component_manifest` and global constants

The loader ignores the manifest phase and logical-copy claim.

Manifest limits are loaded but never compared with or used by the runtime constants. The expected exact file set is not enforced.

The inner manifest does not identify the shell or supervisor.

**Required correction:**

A corrected immutable manifest must have a strict schema, exact allowed keys, exact component set, exact limits, exact claim, shell and supervisor identities, and path-containment checks.

### JJ-B10 — Process groups can be removed from tracking before termination

**Severity:** critical  
**Source:** `stream_process_bounded`

The `finally` block always removes the process group from `state.process_groups`.

If selector handling, reading, hashing, or another unexpected operation fails while the subprocess is still running, the process group is no longer available to CAP-13 cleanup.

**Required correction:**

Ownership must remain registered until the process is positively terminated, reaped, and verified absent. Unexpected exceptions must trigger bounded termination before ownership is released.

### JJ-B11 — Process termination does not reap or conclusively verify descendants

**Severity:** critical  
**Source:** `terminate_process_group`, CAP-10, CAP-11, and CAP-12

After `SIGKILL`, the helper does not wait for the parent process or verify that the group disappeared.

CAP-10 does not call `wait` on its `Popen` object before checking PID absence. A terminated parent can remain observable as a zombie and cause ambiguous results.

CAP-11 and CAP-12 treat the triggering exception as proof without an independent process-release disposition.

**Required correction:**

The process supervisor must retain `Popen` ownership, wait and reap, verify descendant absence, and expose an independent termination result for every bounded subprocess.

### JJ-B12 — Streaming secret detection can miss a boundary-spanning canary

**Severity:** high  
**Source:** `stream_process_bounded`

The scanner checks whether the complete canary occurs within each individual read chunk.

A canary split between two chunks is not detected.

**Required correction:**

The scanner must retain a bounded rolling overlap of `pattern_length - 1` bytes or use a true streaming matcher.

### JJ-B13 — CAP-05 does not prove child and grandchild denial

**Severity:** critical  
**Source:** generated `network_probe_text` and CAP-05 tree case

The parent writes one result containing only the immediate child's exit code and the parent's TCP result.

The child and grandchild write separate result files that CAP-05 never reads.

CAP-05 does not validate either descendant's structured network outcome, process identity, or result path.

It can record `child_grandchild: DENIED` without evidence that either descendant attempted and received a sandbox permission denial.

**Required correction:**

Parent, child, and grandchild results must be individually identified, read, schema-validated, linked through PID and parent-PID evidence, and checked for expected permission-based denial.

### JJ-B14 — Positive listener evidence does not validate the payload

**Severity:** high  
**Source:** `listener_accepts_public_canary`, CAP-06, and CAP-07

The listener returns a hash of whatever bytes it receives, but callers ignore the hash.

An empty, truncated, or unexpected payload can be treated as a successful allowed connection.

**Required correction:**

The listener must read exactly the fixed public canary length, compare exact bytes or an expected hash, reject extra or missing data, and retain metadata only.

### JJ-B15 — CAP-06 and CAP-07 still claim more than they test

**Severity:** high  
**Source:** CAP-06 and CAP-07

CAP-06 tests one allowed IPv4 loopback address and one denied port. It does not test:

- another loopback address;
- IPv6 loopback;
- child and grandchild inheritance.

CAP-07 tests the same address with the wrong port and UDP at the allowed port. It does not test:

- an alternate address;
- child and grandchild inheritance.

`EXACT_LOOPBACK_ENDPOINT_ONLY` and `EXACT_ADDRESS_PORT_TCP_ONLY` remain stronger than the evidence.

**Required correction:**

Either implement every claimed dimension with synthetic local endpoints and descendant probes or narrow the result labels further.

### JJ-B16 — CAP-10 does not fully validate the process tree

**Severity:** critical  
**Source:** CAP-10 readiness records and termination sequence

The design verifies reported process-group IDs but does not verify:

- parent record child PID equals the child record PID;
- child record grandchild PID equals the grandchild record PID;
- child PPID equals parent PID;
- grandchild PPID equals child PID;
- independent process enumeration agrees with the records.

Readiness files are detected by existence and can be read while partially written.

The parent process is not reaped before absence checks.

**Required correction:**

Use atomic readiness records, cross-link every relationship, perform independent bounded enumeration, and reap the owned parent before final absence verification.

### JJ-B17 — CAP-13 cleanup failure can escape its own disposition model

**Severity:** critical  
**Source:** `run` finalizer and `finalize_cap_13`

`finalize_cap_13` is called from `finally`, but the finalizer itself is not protected by a sanitation layer.

Permission errors, process-control errors, repository-snapshot errors outside the existing narrow catch, or unexpected cleanup exceptions can escape. The outer `main` then emits only `UNEXPECTED_INTERNAL_FAILURE`, losing independent cleanup, process, listener, and repository dispositions.

Listener release is checked only through `fileno`, not through bounded rebind verification.

**Required correction:**

The finalizer must be internally exception-safe per disposition, never abandon later cleanup steps, preserve each cleanup failure code, and verify listener release through controlled rebind or equivalent evidence.

## Defect-closure matrix disposition

The Phase 25JI matrix is complete as a mapping document, but several closure claims are not supported by the corrected source text.

| Prior finding | Phase 25JJ disposition |
|---|---|
| `JH-B01` | partially closed; runtime authorization source improved, semantic binding still incomplete |
| `JH-B02` | reopened; atomic marker exists but durable one-use enforcement is unproven |
| `JH-B03` | partially closed; parent structured denial improved, descendant and launch-evidence gaps remain |
| `JH-B04` | reopened; child and grandchild outcomes are not validated |
| `JH-B05` | reopened; CAP-06 and CAP-07 claims still exceed tested dimensions |
| `JH-B06` | statically improved; remains unproven pending later profile validation |
| `JH-B07` | reopened; relationship, enumeration, readiness atomicity, and reaping remain incomplete |
| `JH-B08` | partially closed; streaming limit exists, process-release proof remains incomplete |
| `JH-B09` | partially closed; CAP-13 moved later, but finalizer exceptions can still lose dispositions |
| `JH-B10` | partially closed; repository checks improved, trusted-tool and package TOCTOU gaps remain |
| `JH-B11` | reopened; profiles remain mutable after verification and shell root-of-trust is incomplete |
| `JH-B12` | partially closed; deadlines/listener count exist, owned-process release remains incomplete |
| `JH-B13` | reopened; finalizer exceptions can bypass the independent-disposition model |
| `JH-B14` | partially closed; constructor side effects removed, shell and package materialization remain unsafe |
| `JH-B15` | open by design; profiles remain unparsed and unproven |
| `JH-B16` | reopened; shell guard and cleanup logic are fail-open |
| `JH-B17` | closed by terminology |

## Readiness disposition

Static corrected-source review:

`COMPLETE_WITH_REVISION_REQUIRED`

Syntax-validation planning:

`NOT_READY`

Syntax validation:

`NOT_AUTHORIZED`

Sandbox-profile parsing:

`NOT_AUTHORIZED`

Authorization creation:

`NOT_AUTHORIZED`

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

## Required corrected package

The next inert revision must provide new hashes for:

1. an independently authenticated launcher;
2. a fail-closed shell gate;
3. a corrected process supervisor;
4. a strict component and authorization schema;
5. all sandbox profiles;
6. a durable authorization-ledger design;
7. a new defect-closure matrix covering `JJ-B01` through `JJ-B17`.

The Phase 25JI package remains historical and must not be overwritten.

## Safe successor

The safe successor is:

**Phase 25JK — Corrected Synthetic Capability Harness Inert Source Revision II Gate**

Phase 25JK may create a new static non-executable package that resolves `JJ-B01` through `JJ-B17`, assigns new hashes, and preserves all execution blocks.

Phase 25JK must not:

- overwrite Phase 25JI snapshots;
- remove execution sentinels;
- create executable files;
- run shell or Python syntax checks;
- parse or launch sandbox profiles;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- lint, build, or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- create or consume a runtime authorization;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JJ only if all answers are affirmative:

1. Is Phase 25JJ anchored to exact Phase 25JI commit `8c0f444d1025767281dc96ad67e6a11ad5a78ebc`?
2. Are all Phase 25JI package identities verified without syntax checking or execution?
3. Are the corrected execution sentinels preserved?
4. Are fail-open shell guards classified as critical blockers?
5. Are trusted command resolution and independent shell authentication required?
6. Are unconditional cleanup and cleanup-failure propagation required?
7. Are profile, manifest, and authorization TOCTOU risks identified?
8. Is the `/private/tmp` authorization ledger rejected as durable one-use enforcement?
9. Is strict authorization and component schema validation required?
10. Is premature process-group untracking classified as critical?
11. Are wait, reap, and descendant-absence proofs required?
12. Is the streaming chunk-boundary scanner defect identified?
13. Is CAP-05 child/grandchild evidence classified as incomplete?
14. Is exact listener-payload verification required?
15. Are CAP-06 and CAP-07 claims classified as overbroad?
16. Is CAP-10 classified as incomplete?
17. Is CAP-13 classified as insufficiently exception-safe?
18. Are unsupported Phase 25JI matrix closures reopened or narrowed?
19. Is syntax-validation readiness rejected?
20. Is Phase 25JK limited to a new inert revision with new hashes?
21. Are syntax validation, profile parsing, authorization, materialization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
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
- Phase 25JH original source review: 100%
- Phase 25JI corrected inert revision: 100%
- Phase 25JJ corrected source review: 100%
- Phase 25JJ Gemini review: pending
- Syntax validation: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
