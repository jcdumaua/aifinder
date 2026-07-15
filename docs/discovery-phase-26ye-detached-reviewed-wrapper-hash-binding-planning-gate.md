# AiFinder Phase 26YE — Detached Reviewed Wrapper Hash-Binding Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26YD commit: `9c60d97040362834ddb43709db028171fae8b284`
- Wrapper path: `scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh`
- Wrapper SHA-256: `9c86a21111557b5bb26602dbd42e9bc08925bda984d0ba8510d0d3ca9d0913d7`
- Wrapper Git blob identity: `fa0ae518f5d4553fe8dcbc6d0b061599f5c4abda`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Wrapper placeholder remains present: yes
- Wrapper `exit 93` guard remains active: yes

## Problem Statement

A literal requirement to place a file's complete SHA-256 inside that same file and then require the resulting file to hash to the embedded value is self-referential.

Replacing `__PHASE_26YD_REVIEWED_WRAPPER_SHA256__` changes the wrapper bytes, which changes its SHA-256. Replacing the field again changes the bytes again. No ordinary finite update procedure can establish a stable identity by repeatedly inserting the whole-file hash into the file being hashed.

Therefore Phase 26YE must not claim that a literal embedded whole-file SHA-256 can lock the same file's physical identity.

## Approved Binding Model Proposed

Use a detached, committed review manifest as the authoritative identity binding.

The future manifest must bind:

- Wrapper repository path.
- Wrapper SHA-256.
- Wrapper Git blob identity.
- SQL candidate path and SHA-256.
- Approved baseline commit.
- Expected file modes.
- Active fail-closed guards.
- Review determination and timestamp.
- Authorization state: no live execution authorization.

The wrapper must verify its identity against that separately committed manifest rather than against a mutable whole-file hash literal embedded inside itself.

## Proposed Files

A subsequent implementation phase may create exactly one detached manifest, for example:

`scripts/_drafts/discovery-phase-26ye-reviewed-wrapper-identity-manifest.txt`

The manifest should contain fixed key-value records:

```text
MANIFEST_VERSION=1
APPROVED_COMMIT=9c60d97040362834ddb43709db028171fae8b284
WRAPPER_PATH=scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh
WRAPPER_SHA256=9c86a21111557b5bb26602dbd42e9bc08925bda984d0ba8510d0d3ca9d0913d7
WRAPPER_GIT_BLOB=fa0ae518f5d4553fe8dcbc6d0b061599f5c4abda
WRAPPER_MODE=644
SQL_PATH=scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql
SQL_SHA256=b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b
SQL_MODE=644
WRAPPER_EXIT_93_REQUIRED=YES
LIVE_EXECUTION_AUTHORIZED=NO
```

## Wrapper Verification Revision

A future reviewed wrapper revision may:

1. Remove the unresolved self-hash placeholder comparison.
2. Load only the fixed detached manifest path.
3. Require the manifest itself to be committed and unchanged.
4. Recalculate the wrapper and SQL SHA-256 values.
5. Compare them to the detached manifest.
6. Compare the committed wrapper blob identity to the manifest.
7. Fail before credential or network access on any mismatch.
8. Keep `exit 93` active until a separate execution phase is authorized.

The manifest path must be fixed in source and must not be accepted from user input.

## Why This Is Stronger

The detached model provides:

- Stable cryptographic identity.
- Reviewable version-control history.
- No circular dependency.
- Exact path, mode, commit, SHA-256, and Git blob binding.
- Fail-closed verification before credential access.
- Clean rollback through Git.
- Independent review of the wrapper and its identity record.

## Current Locks

- Detached manifest creation: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Wrapper self-hash placeholder replacement: `NOT_AUTHORIZED`
- Wrapper verification revision: `NOT_AUTHORIZED`
- Wrapper `exit 93` removal: `NOT_AUTHORIZED`
- One-use authorization issuance: `NOT_AUTHORIZED`
- Credential access: `NOT_AUTHORIZED`
- Database connection or catalog execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YE_DETACHED_REVIEWED_WRAPPER_HASH_BINDING_PLAN`
- `REQUEST_CHANGES_PHASE_26YE_DETACHED_REVIEWED_WRAPPER_HASH_BINDING_PLAN`
- `REJECT_PHASE_26YE_DETACHED_REVIEWED_WRAPPER_HASH_BINDING_PLAN`
