# Phase 25KH - Revision XIII Inert Harness Static Source Review Gate

## Review identity

- Approved Phase 25KG baseline: `e34af2436557e0401f539b56e0f62af51f115c63`
- Phase 25KG artifact SHA-256: `7cd0e0d9e68bf53968e9fb8fb0b6bc932af7b3b0de24ebbd9731c034c895784d`
- Revision XIII core ZIP SHA-256: `834c7a50af11a2c2ae9a66a071f5faae0800a74c42ea50687143b46c5ecd6b06`
- Revision XIII core ZIP bytes: `25902`
- Static-package manifest SHA-256: `66396d802b52c37e34ac38fd35871b2dfe2feefe509cf6df1ff11bb60a0b058e`
- Review-identities SHA-256: `2eda5e85a6e8a886b18b35f836de6f2a994ba7b06294cdb7f3d93a071b5d7f73`
- Core artifacts reviewed: `44`
- Literal false execution sentinels: `7`
- Review method: exact reconstruction plus static text-only inspection
- Operational reactivation: `BLOCKED`

## Decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

The Revision XIII static package contains `11` implementation blockers: `6` critical and `5` high.

## Findings

### KH-B01 - CRITICAL - Several v14 schemas are satisfiable but semantically incompatible with emitted values

**Static evidence:** The generic property builder types unrecognized boolean and integer fields as strings. In `selector-terminal-state-schema-v14.json.txt`, fields including `required_frames_complete`, `stdout_eof`, `stderr_eof`, `result_eof`, `control_eof`, `exit_receipt_observed`, `unread_registered_bytes`, and `terminal` are strings, while `selector_terminal_state` emits booleans and an integer.

**Required correction:** Define each schema property individually with the exact runtime type, enum, bound, and nested structure; add static cross-checks between constructors and schemas.

### KH-B02 - CRITICAL - The package index does not bind all 44 actual core artifacts

**Static evidence:** `package-index-v14.json.txt` records only the 41 non-trust artifacts plus hashes of root/bootstrap templates. It does not contain digest-and-length records for the actual root manifest, actual bootstrap manifest, or the package index itself, despite declaring `final_core_count: 44`.

**Required correction:** Use a non-cyclic structure that gives every actual core artifact exactly one immutable digest-and-length record, including both manifests and the index.

### KH-B03 - CRITICAL - Descriptor close failures are treated as successful zero-open state

**Static evidence:** `DescriptorRegistry.require_zero_open` excludes both `closed` and `close-failed` states from the open set. A failed `close_fd` therefore satisfies zero-open validation even though the descriptor may remain open.

**Required correction:** Treat every `close-failed` record as a blocking failure and require all descriptors to reach exactly `closed`.

### KH-B04 - CRITICAL - Worker close failures are absent from returned evidence

**Static evidence:** `run_worker_exact` constructs and returns worker evidence before the `finally` block closes descriptors. The returned object contains no registry closure evidence, and later close failures are not merged into the authoritative worker result.

**Required correction:** Complete descriptor closure first, collect exact closure evidence and failures, then construct the final worker evidence.

### KH-B05 - CRITICAL - Broker authority validation remains abstract and unverified

**Static evidence:** `broker_main` calls `validate_descriptor_carried_authority(authority_fd, envelope_fd)`, but the broker snapshot does not implement canonical byte reading, digest/length checks, nonce binding, ledger consumption, or ambient-authority rejection.

**Required correction:** Implement the exact broker-side validation path in the inert snapshot rather than delegating the security boundary to an undefined helper.

### KH-B06 - CRITICAL - Post-finalization channel never has an explicit close or closure-error boundary

**Static evidence:** `broker_main` reserves the post-finalization channel, sends the receipt, awaits acknowledgement, and returns. It never closes the reserved descriptor through the registry or records a close failure.

**Required correction:** Define parent-owned closure semantics explicitly or close the channel through the registry before process exit, with every failure reflected in authoritative evidence.

### KH-B07 - HIGH - Listener acquisition lacks exception-safe cleanup

**Static evidence:** `acquire_listener_exact` creates and registers the listener and then binds it without a `try/finally` cleanup path. A bind or evidence-construction failure can leave the listener registered and open.

**Required correction:** Wrap acquisition and bind in exception-safe registry cleanup and return evidence only after complete lifecycle validation.

### KH-B08 - HIGH - Source-root traversal leaks descriptors on validation failure

**Static evidence:** After opening and registering `next_fd`, `validate_directory_identity(next_fd)` can fail before either `next_fd` or the previous intermediate descriptor is closed.

**Required correction:** Use a per-component `try/finally` transfer protocol that closes the newly opened descriptor on validation failure and closes the prior descriptor only after successful transfer.

### KH-B09 - HIGH - Network-worker evidence omits process finality and descriptor closure

**Static evidence:** `run_network_observation` returns socket and diagnostic evidence but does not include worker identity, wait receipt, group-absence proof, selector terminal state, or descriptor closure evidence required by the network observation contract.

**Required correction:** Construct network evidence only after complete worker lifecycle, finality, and registry closure records are available.

### KH-B10 - HIGH - Authorization schemas do not constrain phase, revision, operations, or canonical encoding values

**Static evidence:** Although properties now exist, key security fields such as `phase`, `revision`, `canonical_encoding`, `allowed_operations`, and process `role` are generic strings or arrays without constants, enums, item schemas, uniqueness, or bounds.

**Required correction:** Add exact constants, enums, item schemas, uniqueness rules, patterns, and numeric bounds for all authority-bearing fields.

### KH-B11 - HIGH - Repository environment policy still permits inherited variables

**Static evidence:** The snapshot supplies `SANITIZED_ENVIRONMENT` to an abstract runner but does not require replacement rather than merge, clear inherited variables, disable global config via `GIT_CONFIG_GLOBAL`, or bind the exact environment digest in the result.

**Required correction:** Require an empty-base environment, explicit allowlist-only construction, disabled system/global configuration, and canonical environment digest evidence.

## Boundary preservation

- No generated Python source was parsed, imported, compiled, syntax-checked, or executed.
- No schema or sandbox profile was parsed.
- No source was materialized.
- No authorization or execution envelope was created or consumed.
- No C01, C02, database, external service, Batch D, deployment, publishing, operational reactivation, or public launch occurred.
- Application lint and build were intentionally not run.
- No staging, commit, or push occurred.

## Committal boundary

The Phase 25KH review artifact requires independent Gemini review and must not be committed unless Gemini explicitly approves this exact artifact.

## Safe successor

If Gemini confirms this review, the next safe phase is a static Revision XIV correction plan. Syntax validation and materialization remain unauthorized.

## System layer progress report

- Phase 25KG Revision XIII static authoring: 100%
- Phase 25KG commit-and-push: 100%
- Phase 25KH Revision XIII static source review: 100%
- Phase 25KH Gemini review: pending
- Revision XIV correction planning: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
