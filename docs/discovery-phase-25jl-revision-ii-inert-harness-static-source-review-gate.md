# Phase 25JL — Revision II Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JL`
- Batch: `C — Controlled Runtime Validation`
- Phase type: Revision II inert-source static review
- Approved predecessor phase: `25JK`
- Approved predecessor commit: `38e9bb973c85a7a7ffed3862902d180fa5429e21`
- Phase 25JK artifact SHA-256: `8608a4262d49362fd5def1ce9599784e00decce3a55072c3c56db840abfbd575`
- Phase 25JK outer package-manifest SHA-256: `f34ea860b915730c3c603c199237a3374fed5f79ed0127e46be8a51e72a96996`
- Phase 25JK inner package-manifest SHA-256: `2fe439fe658f412b5a4dae11833fd0eafd635039b398f4cd4987e1e0dfe2c771`
- Phase 25JK launcher SHA-256: `9eeaf4af8d068207fbd9821500eba76038fd3010d1c138a134952a178bb3a7ea`
- Phase 25JK wrapper SHA-256: `c321223f0b81a9432fc278ac7b1fb0c47b8fccc53936d5be37b663b33226f24f`
- Phase 25JK supervisor SHA-256: `e3c7ce2692de8338b6cd79dbc3593480c8fa1e651dd8357adee8bb7ad579718b`
- Phase 25JK defect-closure matrix SHA-256: `fb0dd9ed4f53d82e5d49359779b0707621cb56d80cedbd70712eeba7f8ff1be6`
- Phase 25JK review-identities SHA-256: `136eba2caacefb7c2efe1a649cfeb42e5c95d54662055f271dcc6ced89398441`
- Source execution in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Authorization creation or consumption in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JL performs a final text-only review of the exact Revision II package.

The review verifies static identities and inspects the launcher, wrapper, supervisor, schemas, profiles, manifests, and closure matrix as text.

No syntax checker, interpreter, shell, sandbox parser, fixture, listener, resolver, capability, application runtime, or external service was invoked.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JK artifact | `8608a4262d49362fd5def1ce9599784e00decce3a55072c3c56db840abfbd575` |
| Outer package manifest | `f34ea860b915730c3c603c199237a3374fed5f79ed0127e46be8a51e72a96996` |
| Inner package manifest | `2fe439fe658f412b5a4dae11833fd0eafd635039b398f4cd4987e1e0dfe2c771` |
| Launcher | `9eeaf4af8d068207fbd9821500eba76038fd3010d1c138a134952a178bb3a7ea` |
| Wrapper | `c321223f0b81a9432fc278ac7b1fb0c47b8fccc53936d5be37b663b33226f24f` |
| Supervisor | `e3c7ce2692de8338b6cd79dbc3593480c8fa1e651dd8357adee8bb7ad579718b` |
| Defect-closure matrix | `fb0dd9ed4f53d82e5d49359779b0707621cb56d80cedbd70712eeba7f8ff1be6` |
| Review identities | `136eba2caacefb7c2efe1a649cfeb42e5c95d54662055f271dcc6ced89398441` |

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review completeness:

`COMPLETE_WITH_REVISION_REQUIRED`

Syntax-validation readiness:

`BLOCKED_PENDING_REVISION_III`

## Review decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_VALIDATION`

The Revision II package contains meaningful structural improvements, including explicit shell returns, fixed tool paths, private-run-root design, process ownership, rolling stream matching, descendant evidence, narrowed network claims, and independent finalizer dispositions.

However, the package still has an impossible future execution path and incomplete trust binding. It must not advance to shell, Python, or sandbox-profile syntax validation as the candidate package for execution readiness.

## Blocking findings

### JL-B01 — Launcher materializer is statically invalid Python source

**Severity:** critical  
**Source:** launcher safe_materialize

The embedded Python command places compound statements such as def and try after semicolons. Python permits only simple statements in a semicolon-separated statement list. The materializer therefore cannot form a valid future execution path, independent of sandbox or host capability.

**Required correction:**

Replace the compressed command with a separately hashed inert Python materializer snapshot. Review it as its own component before any syntax-validation phase.
### JL-B02 — Wrapper package-manifest identity is an unresolved placeholder

**Severity:** critical  
**Source:** wrapper EXPECTED_PACKAGE_MANIFEST_SHA256

The wrapper compares the materialized manifest against the literal value BOUND_BY_LAUNCHER_AT_MATERIALIZATION. The launcher copies the wrapper without injecting or replacing that value. The wrapper must therefore reject the actual reviewed manifest.

**Required correction:**

Create a non-circular binding design in which the wrapper receives the already verified manifest identity through a strict execution envelope or is generated with the exact immutable hash.
### JL-B03 — Package execution-state requirements are contradictory

**Severity:** critical  
**Source:** inner package manifest, component schema, supervisor load_package

The reviewed package and its schema require execution_state UNSET_NOT_AUTHORIZED. The supervisor requires BOUND_BY_APPROVED_EXECUTION_ENVELOPE. The launcher copies the immutable package manifest unchanged, so the supervisor cannot accept the reviewed package.

**Required correction:**

Separate the immutable source-package state from a separately verified execution-envelope state. The supervisor must not require mutation of the hashed package manifest.
### JL-B04 — Repository baseline became unreachable when Phase 25JK was committed

**Severity:** critical  
**Source:** inner package baseline and repository guards

The package is fixed to predecessor commit 73bdadc47d35ecf2c2dbae0aeb1eb32799a7bf49. After the approved Phase 25JK commit, main and origin/main are at 38e9bb973c85a7a7ffed3862902d180fa5429e21. The wrapper and supervisor require both HEAD and origin/main to equal the predecessor, making the approved package unusable on the synchronized post-Phase-25JK repository.

**Required correction:**

Bind execution to a future approved execution baseline through an immutable envelope while preserving the source-package ancestry separately.
### JL-B05 — Authorization launcher and package identities are collected but never enforced

**Severity:** critical  
**Source:** supervisor load_authorization

launcher_sha256 and package_manifest_sha256 are copied into AuthorizationConfig, but they are never compared with the approved launcher or materialized package identities.

**Required correction:**

Pass trusted identities from the independently authenticated launcher into the private run root and require exact equality before authorization consumption.
### JL-B06 — Authorization action boundaries are ignored

**Severity:** critical  
**Source:** supervisor load_authorization

allowed_actions and prohibited_actions are required as keys but their values are never checked. An authorization can therefore pass runtime validation without carrying the reviewed safety boundary.

**Required correction:**

Require exact canonical arrays and reject missing, reordered, additional, or altered action values.
### JL-B07 — Schema artifacts are not applied as runtime trust controls

**Severity:** high  
**Source:** authorization and component schemas versus supervisor loaders

The package includes JSON schemas, but the supervisor does not validate input against them and only duplicates a subset of their constraints. Authorization ID format, ledger path policy, launcher binding, and several exact-value constraints are therefore not enforced.

**Required correction:**

Either implement an audited strict validator without external dependencies or encode every schema constraint explicitly and prove parity through a later static review.
### JL-B08 — Execution envelope has no strict schema and creates dual repository authority

**Severity:** critical  
**Source:** launcher materializer, wrapper envelope reads, supervisor main

The launcher checks only selected envelope fields. The wrapper accepts repository, baseline, branch, and origin from the envelope, while the supervisor ignores that repository value and hardcodes the AiFinder path. The two layers can validate different authorities.

**Required correction:**

Define one strict canonical execution-envelope schema and one repository authority consumed identically by launcher, wrapper, and supervisor.
### JL-B09 — Durable-ledger policy is not enforced by the supervisor

**Severity:** critical  
**Source:** verify_ledger_root and consume_authorization

Runtime accepts any absolute user-owned mode-0700 directory. It does not enforce the reviewed User Library location, precreation policy, non-temporary location class, or ledger-policy artifact identity.

**Required correction:**

Bind the exact canonical ledger root and policy hash in authorization, open the directory by descriptor, and perform all entry operations relative to that trusted descriptor.
### JL-B10 — One-use consumption identity is not bound to the authorization file hash

**Severity:** critical  
**Source:** authorization_id and consume_authorization

The consumed filename is derived from authorization_id, but the supervisor never proves that this ID is the canonical SHA-256 of the authorization bytes. Equivalent authorizations can use different IDs and produce different ledger entries.

**Required correction:**

Derive the consumption key from the launcher-verified authorization SHA-256 and compare any embedded ID to that derived value.
### JL-B11 — Launcher trust checks rely on assertions

**Severity:** critical  
**Source:** launcher embedded materializer

Ownership, mode, hash, and envelope bindings use Python assert statements. Assertions are not a security control and can be disabled by interpreter optimization settings inherited from the environment.

**Required correction:**

Use explicit conditional failures in a dedicated materializer and launch Python with a fully constructed minimal environment.
### JL-B12 — Materialization writes are not complete-write loops

**Severity:** high  
**Source:** launcher materializer and supervisor write helpers

Several regular-file writes call os.write once and assume the full buffer was written. Short writes are legal. Some later hashes would detect corruption, but authorization and intermediate state handling remain inconsistent and the design is not deterministic.

**Required correction:**

Use a bounded write-all helper for every file and ledger write, then rehash the destination through the opened descriptor before release.
### JL-B13 — Capability evidence is discarded from the final result

**Severity:** critical  
**Source:** supervisor main result construction

The engine records per-capability metadata in state.results, but the final JSON omits that collection. A PASS result therefore cannot be tied to the individual CAP-01 through CAP-13 evidence.

**Required correction:**

Include a bounded ordered capability ledger with state, duration, evidence hashes, and final disposition, while retaining metadata-only output.
### JL-B14 — CAP-13 still completes before private run-root cleanup

**Severity:** critical  
**Source:** supervisor finalize_state and launcher cleanup

The supervisor marks cleanup_state without deleting or verifying the synthetic work tree. The private run root is deleted only after the supervisor prints its result and exits to the launcher. CAP-13 can therefore report PASS before the cleanup it is supposed to attest to.

**Required correction:**

Move final result emission to a trusted outer coordinator that combines supervisor dispositions with verified run-root deletion, or use a two-stage signed/hashed completion record.
### JL-B15 — Launcher cleanup failure cannot amend the already emitted result

**Severity:** critical  
**Source:** supervisor output and launcher EXIT trap

The supervisor may emit PASS. The launcher can later detect cleanup failure and exit 70, but the emitted result remains contradictory and lacks the launcher cleanup disposition.

**Required correction:**

Buffer the supervisor result privately and emit the authoritative result only after launcher cleanup succeeds or fails.
### JL-B16 — Source-file trust checks have a metadata/open race

**Severity:** high  
**Source:** launcher read_regular

The materializer checks ownership and mode with lstat, then opens the path separately. It does not fstat the opened descriptor and compare identity and metadata, so the checked object can differ from the opened object during a same-user race.

**Required correction:**

Open with O_NOFOLLOW first, then fstat and validate the opened descriptor; use trusted directory descriptors and openat-style relative access.
### JL-B17 — The claimed trust chain excludes the launcher from enforced component binding

**Severity:** critical  
**Source:** inner manifest, authorization component_hashes, supervisor validation

The inner manifest has no launcher component. Authorization component_hashes are derived only from inner manifest file roles. The separate launcher_sha256 field is ignored, so the runtime trust chain does not actually bind the independently authenticated launcher to the consumed authorization.

**Required correction:**

Create one non-circular root manifest or execution envelope that binds launcher, materializer, wrapper, supervisor, profiles, schemas, authorization hash, and execution baseline, and enforce every identity.


## Prior-finding disposition

| Prior finding | Phase 25JL disposition | Reason |
|---|---|---|
| `JJ-B01` | `reopened` | Wrapper guards improved, but the wrapper cannot accept its actual manifest identity. |
| `JJ-B02` | `partially closed` | Absolute paths exist, but launcher checks use invalid assertion-based materializer source. |
| `JJ-B03` | `partially closed` | Cleanup trap exists, but authoritative output is emitted before cleanup. |
| `JJ-B04` | `reopened` | Launcher identity exists externally but is not enforced by authorization runtime validation. |
| `JJ-B05` | `partially closed` | Private copying is designed, but materializer source is invalid and descriptor identity checks are incomplete. |
| `JJ-B06` | `reopened` | Authorization is copied by hash, but semantic launcher/package/action bindings are not enforced. |
| `JJ-B07` | `reopened` | Ledger is more durable in policy only; runtime accepts any absolute owner-mode directory. |
| `JJ-B08` | `reopened` | Strict authorization schema exists but several mandatory semantic fields are ignored. |
| `JJ-B09` | `reopened` | Manifest schema exists, but execution-state requirements conflict and launcher is excluded. |
| `JJ-B10` | `closed in process tracker` | Owned processes remain registered until termination and reaping. |
| `JJ-B11` | `closed in process tracker` | Popen wait/reap and process-group/descendant checks are represented. |
| `JJ-B12` | `closed` | Rolling overlap is present for boundary-spanning secret matching. |
| `JJ-B13` | `statically improved` | Individual descendant results are represented, subject to later syntax/profile validation. |
| `JJ-B14` | `closed in source intent` | Exact canary length and extra-byte rejection are represented. |
| `JJ-B15` | `closed by narrowed claims` | CAP-06 and CAP-07 labels are explicitly parent-only. |
| `JJ-B16` | `statically improved` | Atomic records, relationship checks, enumeration, and reaping are represented. |
| `JJ-B17` | `reopened` | Supervisor finalizer is independent, but authoritative CAP-13 completion still precedes launcher cleanup. |

## Readiness disposition

Revision II static review:

`COMPLETE_WITH_REVISION_REQUIRED`

Revision II source package:

`PRESERVED_AS_HISTORICAL_REVIEW_INPUT`

Revision III corrected source package:

`REQUIRED`

Shell syntax validation:

`NOT_AUTHORIZED`

Python syntax validation:

`NOT_AUTHORIZED`

Sandbox-profile parsing:

`NOT_AUTHORIZED`

Execution-envelope creation:

`NOT_AUTHORIZED`

Authorization creation or consumption:

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

## Required Revision III package

The next package must provide new hashes for:

1. a small independently authenticated launcher;
2. a separate inert materializer Python snapshot;
3. a wrapper with a real non-circular manifest binding;
4. a supervisor with one repository authority;
5. a canonical execution-envelope schema;
6. an authorization schema and runtime validator with exact semantic parity;
7. a root trust manifest that includes the launcher;
8. a descriptor-relative durable-ledger implementation;
9. authoritative result emission after outer cleanup;
10. a defect-closure matrix covering `JL-B01` through `JL-B17`.

The Phase 25JK package must not be overwritten.

## Safe successor

The safe successor is:

**Phase 25JM — Corrected Synthetic Capability Harness Inert Source Revision III Gate**

Phase 25JM may create only a new static non-executable package with new hashes that resolves `JL-B01` through `JL-B17`.

Phase 25JM must not:

- overwrite Phase 25JK snapshots;
- remove execution sentinels;
- create executable files;
- run shell or Python syntax checks;
- parse or launch sandbox profiles;
- materialize runtime files;
- create an execution envelope or authorization;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- lint, build, or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- consume authorization;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JL only if all answers are affirmative:

1. Is Phase 25JL anchored to exact Phase 25JK commit `38e9bb973c85a7a7ffed3862902d180fa5429e21`?
2. Are all Phase 25JK package identities verified without execution or syntax checking?
3. Are launcher, wrapper, and supervisor sentinels preserved?
4. Is the launcher materializer classified as statically invalid Python source?
5. Is the unresolved wrapper manifest placeholder classified as critical?
6. Is the package execution-state contradiction classified as critical?
7. Is the predecessor baseline recognized as unreachable after the Phase 25JK commit?
8. Are authorization launcher and package identities classified as unenforced?
9. Are allowed and prohibited authorization actions classified as ignored?
10. Is runtime schema parity classified as incomplete?
11. Is the execution envelope classified as insufficiently defined and dual-authority?
12. Is ledger policy enforcement classified as incomplete?
13. Is authorization consumption required to derive its key from the verified authorization hash?
14. Are assertion-based trust checks rejected?
15. Are complete-write loops and descriptor revalidation required?
16. Is omission of per-capability evidence from the final result classified as critical?
17. Is CAP-13 classified as preceding outer run-root cleanup?
18. Is authoritative result emission required to occur after launcher cleanup?
19. Is the launcher required to be included in the enforced root trust manifest?
20. Is syntax-validation readiness rejected?
21. Is Phase 25JM limited to a new inert Revision III package?
22. Are syntax validation, profile parsing, materialization, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
23. Does operational reactivation remain `BLOCKED`?

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
- Phase 25JL Gemini review: pending
- Syntax validation: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
