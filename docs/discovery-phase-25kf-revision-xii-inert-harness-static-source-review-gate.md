# Phase 25KF — Revision XII Inert Harness Static Source Review Gate

## Review identity

- Approved Phase 25KE baseline: `a7a94afba06349787617df5aad82e21c6055f5fc`
- Phase 25KE artifact SHA-256: `100fd37bf826d5ed31eabee92fca89efda592bcc932ecc910ea45beb23d97e2b`
- Revision XII core ZIP SHA-256: `5c8877e0764e2de9bb8c21b4da27ccd8e582ce10235f9d29c0e01d5e01b9a502`
- Revision XII core ZIP bytes: `23385`
- Static-package manifest SHA-256: `df379ee7ed146d74788f57054e3fdf94ecad8707cef60f2885d93bafdf8ae0da`
- Review-identities SHA-256: `23ca0a32d0b964c50c81aece0a0f208c1666fcf85faace3a58aad895ca19b53c`
- Core artifacts reviewed: `40`
- Literal false execution sentinels: `6`
- Review method: exact reconstruction plus static text-only inspection
- Operational reactivation: `BLOCKED`

## Decision

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

The Revision XII static package contains `13` implementation blockers: `8` critical and `5` high.

## Findings

### KF-B01 — CRITICAL — Most v13 JSON schemas are internally unsatisfiable

**Static evidence:** The shared schema generator emits `required` and `additionalProperties: false` but no `properties` map. Under JSON Schema, every required field is therefore also forbidden as an additional property, so valid instances cannot satisfy the schema.

**Required correction:** Define every property explicitly, including nested types, enums, bounds, and references, or remove `additionalProperties: false` until a complete property map exists.

### KF-B02 — CRITICAL — Launcher attempts a live broker checkpoint after broker exit was already observed

**Static evidence:** `observe_post_ack_finality` first calls `observe_status_ack_eof_and_broker_exit(...)` and only afterward calls `live_checkpoint_before_wait(broker, ...)`. If broker exit has been observed, the required live process row may no longer exist.

**Required correction:** Take the final live broker checkpoint before observing exit or waiting; after exit use only the wait receipt and group-absence proof.

### KF-B03 — CRITICAL — Post-finalization receipt ordering is not implementable as written

**Static evidence:** `broker_main` calls `close_final_channels_independently(...)`, constructs the post-finalization receipt, and then calls `send_post_finalization_receipt(post)`. The design does not identify a separately retained post-finalization channel, so the receipt may require a channel that was just closed.

**Required correction:** Define a distinct post-finalization descriptor excluded from the first final-channel close set, send and acknowledge the receipt, then close that descriptor and expose its EOF to the launcher.

### KF-B04 — CRITICAL — Late failures can still occur after the post-finalization receipt

**Static evidence:** The broker returns immediately after `send_post_finalization_receipt(post)` without closing or proving closure of the post-finalization channel itself. Any failure while closing that final descriptor is absent from `post` and cannot reach authoritative truth.

**Required correction:** Add a final independently observed closure stage for the post-finalization channel, or move its fallible close into an externally observed parent-side EOF protocol.

### KF-B05 — CRITICAL — Worker descriptor closure remains incomplete

**Static evidence:** `run_worker_exact` registers all worker endpoints, runs the worker, and returns `registry.records` without closing all worker endpoints through the registry. The returned evidence can therefore describe still-owned/open descriptors.

**Required correction:** Close every parent and transferred endpoint independently on normal and exceptional paths before returning evidence; require exact zero-open-descriptor state.

### KF-B06 — CRITICAL — Network-worker implementation source is missing from the 40-file package

**Static evidence:** The process-role model and broker worker dispatcher include `network-worker`, but the package contains only launcher, broker, coordinator, probe, inventory-helper, and repository-helper Python snapshots. No network-worker source snapshot exists.

**Required correction:** Add an inert network-worker snapshot and update the approved inventory, manifests, sentinel count, and trust records, or redesign network observation to use an explicitly named existing component.

### KF-B07 — CRITICAL — Authorization and execution-envelope validation are declared but not implemented

**Static evidence:** Schemas exist for authorization and the execution envelope, but the launcher and broker snapshots contain no exact authorization-byte length/digest validation, one-attempt consumption, envelope binding, or rejection of ambient authority.

**Required correction:** Implement exact launcher and broker validation paths that bind canonical authorization bytes, length, SHA-256, attempt nonce, and consume-once ledger state before any dispatch.

### KF-B08 — CRITICAL — Root/bootstrap integrity coverage is incomplete

**Static evidence:** The root manifest excludes the closure matrix and both manifests, while the bootstrap inventory lists only filenames for all 40 artifacts. The bootstrap does not provide hashes and byte counts for non-root-covered files, so the complete package is not integrity-bound.

**Required correction:** Ensure every core artifact is covered by an immutable digest-and-length record through a non-cyclic manifest structure.

### KF-B09 — HIGH — Source-root traversal does not close intermediate directory descriptors

**Static evidence:** `open_source_root_descriptor_relative` replaces `current_fd` on each component but does not register or close prior intermediate directory descriptors.

**Required correction:** Register every opened directory descriptor and close the previous descriptor after safely acquiring and validating the next component.

### KF-B10 — HIGH — Selector-loop termination and EOF semantics are underspecified

**Static evidence:** `one_selector_loop` relies on abstract `all_required_terminal(...)` and `observe_exit_readiness(...)` without requiring EOF on stdout, stderr, and result channels after process exit. It may terminate before complete drainage.

**Required correction:** Define exact terminal conditions requiring completed frames, EOF or bounded closure on all streams, exit receipt, and no unread registered data.

### KF-B11 — HIGH — Operation-specific RPC validation can fail outside the fail-closed protocol

**Static evidence:** `rpc_call_exact` indexes `RPC_RESULT_VALIDATORS[operation]` directly. An unknown operation can raise a generic key error rather than producing the exact protocol failure code and evidence record.

**Required correction:** Validate operation membership before lookup and map every rejection to a canonical fail-closed response.

### KF-B12 — HIGH — Listener lifecycle behavior is schema-only

**Static evidence:** The package defines listener schemas and RPC operations, but no source snapshot shows listener acquisition, registration-before-bind, release, rebind/absence proof, or exception cleanup.

**Required correction:** Add explicit broker-side listener lifecycle functions and exact evidence construction for every normal and exceptional path.

### KF-B13 — HIGH — Repository helper execution environment is not fully constrained

**Static evidence:** The helper allowlists Git argv but does not specify environment sanitization, disabled pager/config helpers, locale, executable identity, or repository descriptor provenance in the command result.

**Required correction:** Bind executable identity, sanitized environment, disabled pager and external helpers, locale, repository descriptor identity, and exact command cwd/provenance.

## Boundary preservation

- No generated Python source was parsed, imported, compiled, syntax-checked, or executed.
- No schema or sandbox profile was parsed.
- No source was materialized.
- No authorization or execution envelope was created or consumed.
- No C01, C02, database, external service, Batch D, deployment, publishing, operational reactivation, or public launch occurred.
- Application lint and build were intentionally not run.
- No staging, commit, or push occurred.

## Committal boundary

The Phase 25KF review artifact requires independent Gemini review and must not be committed unless Gemini explicitly approves this exact artifact.

## Safe successor

If Gemini confirms this review, the next safe phase is a static Revision XIII correction plan. Syntax validation and materialization remain unauthorized.

## System layer progress report

- Phase 25KE Revision XII static authoring: 100%
- Phase 25KE commit-and-push: 100%
- Phase 25KF Revision XII static source review: 100%
- Phase 25KF Gemini review: pending
- Revision XIII correction planning: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
