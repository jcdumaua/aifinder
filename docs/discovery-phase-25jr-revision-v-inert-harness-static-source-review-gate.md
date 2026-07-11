# Phase 25JR — Revision V Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JR`
- Batch: `C — Controlled Runtime Validation`
- Phase type: Revision V inert-source static review
- Approved predecessor phase: `25JQ`
- Approved predecessor commit: `8db312319ecc94c05dd962a9f48eb741e40479ec`
- Phase 25JQ artifact SHA-256: `d2e24e6107594245856e441ffdc47fd6fada54855dc1b3ec46663888f48eb0f8`
- Phase 25JQ outer package-manifest SHA-256: `4b90a87981dc82410da6c6e3434e9d16e9c79d99caaee0b9331a6007e1e5718a`
- Phase 25JQ root-trust-manifest SHA-256: `ac38b3a21128b718ac76601bd984f64689b7e9f4fba0f9543fa24cddb9d9d1c9`
- Phase 25JQ bootstrap-manifest SHA-256: `0b89cb5ff863199456f4ecf7294549f053e23160af96630c9c55cadb8f9f5bf5`
- Phase 25JQ launcher SHA-256: `23d526cd1a537d19b14ab473eb8f777afb5934884f00b427b0adfbc8b1a49486`
- Phase 25JQ coordinator SHA-256: `a840cdbd9f00ae2aaee177d345d9187e52ddc0fb5dcb0c2281ce04ea9d7f747f`
- Phase 25JQ probe SHA-256: `75a295549fce1df352b83f5db084f2fd85651103692d200a166185b6df21be14`
- Phase 25JQ defect-closure matrix SHA-256: `f56c359bb1a4bb487fb5e51bc09f77ff40da23df0d3384574ae350090ff89aea`
- Phase 25JQ review-identities SHA-256: `2703b110b3ae7f0ad94b1cbe876874cffef0a8e5ead1d2eff74dc881a156352f`
- Source parsing in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JR performs a text-only integrity and fail-closed review of the exact Revision V package.

All identities were recomputed from the external files. The launcher, coordinator, probe, manifests, contract, schemas, policy, profiles, and matrix were inspected only as inert text.

No source interpreter, syntax checker, compiler, sandbox-profile parser, materializer, authorization action, synthetic fixture, clone operation, listener, socket, DNS action, application runtime, database, or external service was invoked.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JQ artifact | `d2e24e6107594245856e441ffdc47fd6fada54855dc1b3ec46663888f48eb0f8` |
| Outer package manifest | `4b90a87981dc82410da6c6e3434e9d16e9c79d99caaee0b9331a6007e1e5718a` |
| Root-trust manifest | `ac38b3a21128b718ac76601bd984f64689b7e9f4fba0f9543fa24cddb9d9d1c9` |
| Bootstrap manifest | `0b89cb5ff863199456f4ecf7294549f053e23160af96630c9c55cadb8f9f5bf5` |
| Launcher | `23d526cd1a537d19b14ab473eb8f777afb5934884f00b427b0adfbc8b1a49486` |
| Coordinator | `a840cdbd9f00ae2aaee177d345d9187e52ddc0fb5dcb0c2281ce04ea9d7f747f` |
| Probe | `75a295549fce1df352b83f5db084f2fd85651103692d200a166185b6df21be14` |
| Defect-closure matrix | `f56c359bb1a4bb487fb5e51bc09f77ff40da23df0d3384574ae350090ff89aea` |
| Review identities | `2703b110b3ae7f0ad94b1cbe876874cffef0a8e5ead1d2eff74dc881a156352f` |

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review completeness:

`COMPLETE_WITH_REVISION_REQUIRED`

Syntax and materialization-preflight readiness:

`BLOCKED_PENDING_REVISION_VI`

## Review decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

Revision V meaningfully improves construction ordering, path visibility, bounded coordinator capture, endpoint-claim discipline, manifest structure, ledger-policy binding, and result ordering.

It still cannot clean sealed roots, leaves pre-finalizer resource windows, does not provide true role-isolated probe evidence, incompletely releases process groups, can misstate authorization consumption, and validates PASS metadata too weakly.

## Blocking findings

### JR-B01 — Sealed bootstrap and control directories cannot be emptied during cleanup

**Severity:** `critical`

**Source:** launcher remove_bootstrap; coordinator remove_identity

Both directories are sealed to mode 0500 before execution. Their cleanup routines immediately attempt unlink and rmdir operations through the opened directory descriptor without first restoring owner write permission. Directory write permission is required to remove contained entries, so normal bootstrap and control-root cleanup cannot complete as designed.

**Required correction**

After identity revalidation and process release, transition each sealed directory from 0500 to 0700 through the retained descriptor, verify the transition, remove entries descriptor-relatively, then remove and verify the original inode.
### JR-B02 — Launcher resources and bootstrap state are created before protected finalization begins

**Severity:** `critical`

**Source:** launcher main pre-try initialization

Envelope, authorization, launcher, source directory, and bootstrap resources are opened or created before the try/finally region. Any exception or supported signal during these steps bypasses the launcher finalizer and can leak descriptors or bootstrap state.

**Required correction**

Initialize all resources to inert sentinel values first, enter one outer try/finally, and perform every open, decode, and bootstrap creation inside that protected region.
### JR-B03 — Coordinator decoding and namespace creation occur before protected finalization

**Severity:** `critical`

**Source:** coordinator main pre-try initialization

Argument decoding, source-directory opening, and run/control/work directory creation all occur before the coordinator try/finally. Failures or supported signals during partial construction can leave resources and directories without a prefinal record or cleanup.

**Required correction**

Move all decoding, opens, and directory creation under one outer finalizer with nullable resource records and cleanup of every successfully acquired object.
### JR-B04 — Finalization remains interruptible and reentrant under repeated signals

**Severity:** `critical`

**Source:** launcher and coordinator signal handlers plus finally blocks

The signal handlers remain installed while cleanup executes and raise exceptions directly. A second SIGINT, SIGTERM, or SIGHUP during cleanup can interrupt the finalizer despite the FINALIZING flag, because the handler itself does not suppress or defer signals once finalization has begun.

**Required correction**

On first shutdown request, switch supported signals to ignore or record-only handlers, block them during the critical cleanup section where supported, and make the finalizer idempotent without raising from a reentrant handler.
### JR-B05 — Process creation precedes ownership registration and can leak on identity-capture failure

**Severity:** `critical`

**Source:** launcher run_coordinator; coordinator bounded_stream, launch_network_probe, and resolver launch

Each subprocess is created before its PID/PPID/PGID/start identity is captured. If identity capture returns no record or raises, the process is not registered in an ownership table and the surrounding cleanup path has no safe handle for termination.

**Required correction**

Wrap every spawn in an immediate local try/finally that retains the Popen handle, terminates the new session if registration fails, and only then promotes the process into the global ownership table.
### JR-B06 — Launcher does not prove the coordinator process group is empty

**Severity:** `critical`

**Source:** launcher terminate_coordinator

The launcher revalidates and waits for the coordinator parent but never enumerates the coordinator PGID after reaping. If the coordinator exits while a descendant remains, the launcher can continue to result construction without proving complete group release.

**Required correction**

Record the coordinator PGID, enumerate all members before and after termination, and require the entire group to be absent before accepting coordinator completion.
### JR-B07 — Coordinator cannot release descendants when the recorded parent has already exited

**Severity:** `critical`

**Source:** coordinator terminate_group

When process.poll is already non-null, terminate_group skips signaling and only checks for remaining PGID members. If descendants survive their parent, the function raises PROCESS_GROUP_NOT_EMPTY but does not terminate those survivors, and repeated finalization attempts follow the same path.

**Required correction**

Retain a group-level identity model independent of parent liveness and safely terminate verified remaining group members even after the original parent exits.
### JR-B08 — Probe evidence descriptors are not role-isolated

**Severity:** `critical`

**Source:** coordinator launch_network_probe and probe run_network

The parent probe inherits the child and grandchild result descriptors so it can pass them onward, and the child inherits the grandchild descriptor. All roles also share one nonce. An ancestor can therefore emit a syntactically valid record for a descendant, contradicting the claimed per-role descriptor and nonce binding.

**Required correction**

Use role-specific nonces and a handoff design where each role receives only its own write endpoint, such as coordinator-created child launchers, authenticated descriptor passing, or separate trusted spawn stages.
### JR-B09 — Length-prefixed evidence framing assumes a complete four-byte header read

**Severity:** `high`

**Source:** coordinator read_probe_record and CAP-08 resolver read

Both readers call recv(4) once. Stream sockets may return fewer than four bytes without EOF, so a valid record can be rejected or framing can become inconsistent.

**Required correction**

Use one exact-read helper for the four-byte header and payload, with a single absolute deadline and bounded accumulation.
### JR-B10 — Probe release timeout is ineffective because the read is blocking

**Severity:** `high`

**Source:** probe wait_release

The loop calculates a deadline but calls blocking os.read on every iteration. If the release writer remains open without data, the call does not return to recheck the deadline.

**Required correction**

Use nonblocking mode with selectors or poll, or a socket/pipe primitive with a real timeout.
### JR-B11 — Launcher failure handling can falsely report authorization as not consumed

**Severity:** `critical`

**Source:** launcher generic except and default prefinal record

The launcher discards all exceptions after coordinator execution and retains its default NOT_CONSUMED prefinal. If the coordinator durably consumes authorization and then produces malformed, truncated, secret-triggering, or otherwise rejected output, the authoritative failure record can incorrectly claim the authorization was not consumed.

**Required correction**

Use a separately authenticated consumption receipt or a launcher-readable durable ledger check so every post-coordinator failure reports the actual authorization disposition.
### JR-B12 — Authorization semantic state is not fully validated before consumption

**Severity:** `critical`

**Source:** coordinator authorization validation

The coordinator enforces the authorization key set and many cross-bindings but does not require the exact schema_version, authorization_state, or consumption_rule values before creating the durable ledger entry.

**Required correction**

Validate the authorization against one exact canonical object contract, including all fixed values, before any consumption action.
### JR-B13 — PASS capability metadata is key-checked but not semantically validated

**Severity:** `critical`

**Source:** launcher validate_capability

The launcher checks metadata key sets and encoded size only. It does not require exact claim strings, boolean truth values, valid digest formats, expected counts, release values, or allowed enums. A coordinator record with contradictory or false metadata can still be accepted as PASS.

**Required correction**

Define and enforce exact per-capability value schemas, types, ranges, digest formats, and invariant relationships before authoritative PASS.
### JR-B14 — Coordinator secret scanning can miss boundary matches across interleaved output streams

**Severity:** `high`

**Source:** launcher run_coordinator

One rolling tail is shared by stdout and stderr. If a secret is split across two stdout chunks with a stderr event between them, the stderr chunk replaces the stdout tail and the stdout-local boundary match can be missed.

**Required correction**

Maintain independent rolling tails and scans for stdout and stderr.
### JR-B15 — Listener limits and release proof are incomplete

**Severity:** `high`

**Source:** coordinator open_listener and release_listener

The configured max_concurrent_listeners limit is never enforced. Release verification also enables SO_REUSEADDR on the verification socket, which can weaken the claim that the original binding has been exclusively released.

**Required correction**

Enforce the active-listener count before creation and verify release using a fresh exclusive bind without reuse semantics, followed by the required listen step.
### JR-B16 — Manifest predecessor and actual source-mode binding are incomplete

**Severity:** `high`

**Source:** launcher root validation and coordinator root/source validation

The coordinator requires the source_predecessor_commit key but never compares its value with the approved baseline. Manifest records require mode 0644, but source-file reads accept any owner-owned regular file that is not group/world writable rather than verifying the actual mode against the manifest record.

**Required correction**

Bind source_predecessor_commit to the exact approved commit and compare each opened source file's actual permission bits with its manifest mode record.
### JR-B17 — Probe and resolver output pipes are not drained

**Severity:** `high`

**Source:** coordinator launch_network_probe and CAP-08 resolver process

The sandboxed network and resolver processes are launched with stdout pipes merged from stderr, but those pipes are never read. Unexpected interpreter, sandbox, or child diagnostics can fill the pipe and block process completion, defeating the capability deadline and release sequence.

**Required correction**

Route all probe diagnostics through bounded, continuously drained capture or DEVNULL while preserving a bounded metadata-only diagnostic digest.


## Prior-finding disposition

| Prior finding | Phase 25JR disposition | Reason |
|---|---|---|
| `JP-B01` | `reopened` | Construction is fixed, but sealed 0500 directories cannot be emptied without restoring write permission. |
| `JP-B02` | `reopened` | Control construction is fixed, but control cleanup is impossible while sealed 0500. |
| `JP-B03` | `closed for child path visibility` | Real randomized child-visible paths replace non-inherited directory /dev/fd paths. |
| `JP-B04` | `partially closed` | Name and inode checks improve cleanup, but cleanup cannot reach completion for sealed roots. |
| `JP-B05` | `reopened` | Bootstrap cleanup exists only after resources are created; pre-try failures bypass it. |
| `JP-B06` | `reopened` | Coordinator finalization exists, but pre-try construction and sealed control cleanup bypass successful release. |
| `JP-B07` | `reopened` | Supported signals are handled, but repeated signals can interrupt cleanup. |
| `JP-B08` | `partially closed` | Coordinator capture is bounded and timed, but cross-stream secret boundaries are not independently tracked. |
| `JP-B09` | `closed` | Coordinator exit-code and prefinal-result parity are enforced. |
| `JP-B10` | `reopened` | Evidence is pathless, but ancestor processes hold descendant result descriptors and a shared nonce. |
| `JP-B11` | `reopened` | Process groups are registered after spawn, leaving a registration-failure leak window. |
| `JP-B12` | `closed` | CAP-07 no longer claims UDP-specific denial. |
| `JP-B13` | `reopened` | Coordinator groups are checked, but launcher group absence and orphaned-descendant termination remain incomplete. |
| `JP-B14` | `partially closed` | Manifest object shape improved, but predecessor and actual source modes are not fully bound. |
| `JP-B15` | `closed for ledger-policy digest` | Envelope and authorization ledger-policy hashes bind to the root record. |
| `JP-B16` | `reopened` | Coordinator tracks consumption, but launcher fallback can report NOT_CONSUMED after durable consumption. |
| `JP-B17` | `reopened` | Prefinal structure is checked, but PASS metadata semantics remain largely unconstrained. |

## Readiness disposition

Revision V static review:

`COMPLETE_WITH_REVISION_REQUIRED`

Revision V source package:

`PRESERVED_AS_HISTORICAL_REVIEW_INPUT`

Revision VI corrected source package:

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

## Required Revision VI package

The next inert package must provide new hashes for:

1. descriptor-verified unsealing before bootstrap and control cleanup;
2. one outer launcher finalizer covering every acquisition;
3. one outer coordinator finalizer covering every decode, open, and directory creation;
4. non-reentrant cleanup protected from repeated supported signals;
5. safe termination on process-registration failure;
6. complete coordinator PGID absence verification in the launcher;
7. descendant release after parent exit;
8. truly role-exclusive result descriptors and role-specific nonces;
9. exact-read framing for every length prefix and payload;
10. a real nonblocking release deadline;
11. accurate authorization disposition after every launcher-side failure;
12. exact authorization semantic validation;
13. exact per-capability metadata value validation;
14. independent stdout and stderr rolling secret scans;
15. enforced listener limits and exclusive release verification;
16. exact predecessor and actual mode binding;
17. bounded draining of all probe diagnostic pipes.

The Phase 25JQ package must not be overwritten.

## Safe successor

The safe successor is:

**Phase 25JS — Corrected Synthetic Capability Harness Inert Source Revision VI Gate**

Phase 25JS may create only a new static non-executable Revision VI package with new hashes that resolves `JR-B01` through `JR-B17`.

Phase 25JS must not overwrite Phase 25JQ snapshots, remove execution sentinels, create executable files, parse or execute Python source, run syntax checks, parse or launch sandbox profiles, materialize runtime files, create an execution envelope or authorization, consume authorization, create synthetic fixtures, invoke `cp -cR` or `sandbox-exec`, open listeners or sockets, perform DNS resolution, inspect environment values, lint, build, or start AiFinder, invoke C01 or C02, access a database or external service, install packages, begin Batch D, or authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JR only if all answers are affirmative:

1. Is Phase 25JR anchored to exact Phase 25JQ commit `8db312319ecc94c05dd962a9f48eb741e40479ec`?
2. Are all Revision V identities verified without parsing or execution?
3. Are launcher, coordinator, and probe sentinels preserved?
4. Must sealed 0500 roots be descriptor-unsealed before entry removal?
5. Must launcher acquisition begin inside its protected outer finalizer?
6. Must coordinator decoding and construction begin inside its protected outer finalizer?
7. Must repeated supported signals be prevented from interrupting cleanup?
8. Must process registration failure still terminate the newly spawned process group?
9. Must the launcher prove complete coordinator PGID absence?
10. Must surviving descendants be terminated after parent exit?
11. Are ancestor-held descendant result descriptors incompatible with role isolation?
12. Are role-specific nonces required?
13. Must all framed socket reads use exact-read logic?
14. Is the current blocking release read incompatible with its claimed deadline?
15. Must launcher failures preserve actual authorization-consumption disposition?
16. Must exact authorization schema, state, and consumption rule be enforced?
17. Must PASS metadata values and types be validated, not merely their keys?
18. Must stdout and stderr have independent rolling secret-scan state?
19. Must the listener concurrency limit be enforced?
20. Must listener release be verified without reuse semantics?
21. Must source_predecessor_commit equal the exact approved baseline?
22. Must actual source-file modes match manifest mode records?
23. Must every probe diagnostic pipe be bounded and continuously drained?
24. Is syntax and materialization-preflight readiness rejected?
25. Is Phase 25JS limited to a new inert Revision VI package?
26. Are parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
27. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JQ corrected inert revision V: 100%
- Phase 25JR Revision V source review: 100%
- Phase 25JR Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
