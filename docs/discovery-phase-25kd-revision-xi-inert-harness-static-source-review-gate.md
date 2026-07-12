# Phase 25KD — Revision XI Inert Harness Static Source Review Gate

## Review identity

- Phase: `25KD`
- Reviewed revision: `XI` / `v12`
- Approved Phase 25KC baseline: `5d8b9423c34664f9b9cb0e3c7d9b54cce7d4c217`
- Phase 25KC artifact SHA-256: `942005bd8f410eda0b6c34a6a2c244ef537f7588ab6dac620f648b292b2011c8`
- Revision XI core ZIP SHA-256: `795a6beae873204aa26e82fe0181aac8b7a0644bfc703a78f759e5ac52c23c0a`
- Revision XI core ZIP bytes: `54785`
- Core artifacts reviewed: `33`
- Literal false execution sentinels: `6`
- Review method: exact reconstruction plus static text-only inspection
- Operational reactivation: `BLOCKED`

## Decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

The Revision XI static package contains `15` implementation blockers: `10` critical and `5` high.

The prior static-design approval does not authorize parsing, syntax validation, materialization, or execution. This fresh implementation review found internally inconsistent process-finality, identity, frame-drain, trust, and final-status paths.

## Findings

### KD-B01 — CRITICAL — Coordinator identity checks occur after the coordinator has already been reaped

**Static evidence:** `broker-v12.py.txt` calls `coordinator.wait(...)` immediately after the event loop and then invokes fresh inventory observations for `before-term` and `before-reap-decision`. A reaped coordinator cannot appear in the later inventory.

**Required correction:** Observe and compare identity before each wait/reap decision while the target exists; after reap, use the wait receipt and group-absence proof.

### KD-B02 — CRITICAL — Repository, probe, and network identity role validation is guaranteed to fail

**Static evidence:** The broker requests roles `repository-helper`, `probe`, and `network-worker`, but validates returned identities as `repository-helper-start`, `probe-start`, `network-worker-start`, and corresponding `*-reap` roles. Exact role equality therefore fails.

**Required correction:** Keep process role stable and carry checkpoint identity separately.

### KD-B03 — CRITICAL — Worker target identities are re-observed only after process exit

**Static evidence:** `run_repository_helper`, `run_probe_worker`, and `run_network_worker` wait for the worker and then ask inventory to find the exited PID.

**Required correction:** Perform final live identity comparison before reap; afterward require a wait receipt and group absence without a live row.

### KD-B04 — CRITICAL — Coordinator event loop stops concurrent drainage during full-frame reads

**Static evidence:** After RPC or prefinal readability, the outer selector loop enters `read_frame_deadline`, a separate full-frame loop that can starve stdout/stderr drainage.

**Required correction:** Maintain incremental frame state inside the single selector loop.

### KD-B05 — CRITICAL — Launcher fabricates broker group absence from overall PASS

**Static evidence:** The authoritative result sets `broker_group_absent` to `passed`, not the observed `group_absent` value, and normal-path absence lacks a fresh identity checkpoint.

**Required correction:** Carry actual nonce-bound group-absence evidence into the result.

### KD-B06 — CRITICAL — Launcher final-status validation remains shallow

**Static evidence:** `validate_final_status` does not exact-validate nested prefinal evidence, coordinator release observations, descriptor counts/failures, listener schemas, diagnostics bounds/hashes, or cross-level consistency.

**Required correction:** Apply exact nested validators and compare all evidence with launcher-held observations.

### KD-B07 — CRITICAL — Root and bootstrap validation omits required identity fields

**Static evidence:** Launcher and broker omit complete checks for manifest schema versions and bootstrap phase, revision, package state, predecessor, names, uniqueness, exclusions, and self-hash marker.

**Required correction:** Exact-validate every root/bootstrap field independently in launcher and broker.

### KD-B08 — CRITICAL — Source-directory trust follows symlinks before no-follow open

**Static evidence:** `open_source_directory` calls `Path.resolve(strict=True)` before `O_NOFOLLOW`, following path-chain symlinks.

**Required correction:** Open and validate each path component descriptor-relatively without pre-resolving symlinks.

### KD-B09 — CRITICAL — Final-status acknowledgement cannot prove final-channel closure

**Static evidence:** Broker sends status with final channels open, receives acknowledgement, and closes them only in `finally`; no post-ack closure receipt reaches the launcher.

**Required correction:** Add parent-observed EOF/exit or a second validated final-closure receipt.

### KD-B10 — CRITICAL — Late finalization failures are absent from transmitted status

**Static evidence:** Descriptor-close or acknowledgement-close failures discovered after status transmission cannot affect the already-sent status.

**Required correction:** Move fallible finalization before the last evidence boundary or send a validated post-finalization receipt.

### KD-B11 — HIGH — RPC response validation is not result-schema specific

**Static evidence:** `validate_rpc_response` checks the generic envelope around locally constructed responses but not each operation's nested result schema.

**Required correction:** Invoke exact result validators for every operation.

### KD-B12 — HIGH — Probe and network evidence validation is incomplete

**Static evidence:** Worker JSON is accepted after limited schema/attempt checks and then indexed without canonical-byte, exact-key, request/operation, profile, descriptor, identity, diagnostic, and release validation.

**Required correction:** Exact-validate canonical worker observations before constructing broker evidence.

### KD-B13 — HIGH — Worker pipe descriptors bypass the broker registry

**Static evidence:** Repository, probe, network, inventory, expectation, binding, and result pipes are created and manually closed outside centralized registry evidence.

**Required correction:** Register every endpoint at acquisition and close through independent registry units.

### KD-B14 — HIGH — Worker result reads precede continuous diagnostic drainage

**Static evidence:** Repository, probe, network, and inventory paths read complete result frames before draining stdout/stderr, allowing diagnostic backpressure to consume the shared deadline.

**Required correction:** Use one selector loop per worker for result, stdout, stderr, and exit readiness.

### KD-B15 — HIGH — Repository observation validation does not prove exact command results

**Static evidence:** Broker accepts repository-helper output without canonical-byte checks, exact command raw-output digests/lengths, exact path equality, format checks, or direct status-byte digest consistency.

**Required correction:** Bind every allowlisted command, raw output, byte count, digest, return code, and derived field in exact nested evidence.

## Boundary preservation

- No Python parsing, import, compilation, syntax validation, or AST inspection occurred.
- No schema or sandbox-profile parsing occurred.
- No generated source was materialized or executed.
- No authorization or execution envelope was created or consumed.
- No subprocess from the generated package was started.
- No repository command from generated code, capability, C01, C02, database, external service, Batch D, deployment, publishing, operational reactivation, or public launch occurred.
- Application lint and build were intentionally not run.
- No staging, commit, or push occurred.

## Committal boundary

The Phase 25KD review artifact requires independent Gemini review and must not be committed without explicit authorization.

## Safe successor

If Gemini confirms this review, the next safe phase is a new static Revision XII correction plan. Python syntax validation and all operational layers remain unauthorized.

## System layer progress report

- Phase 25KC Revision XI static authoring: 100%
- Phase 25KC commit-and-push: 100%
- Phase 25KD Revision XI static source review: 100%
- Phase 25KD Gemini review: pending
- Revision XII correction: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
