# AiFinder Phase 26ZD — Catalog Output Redaction Hardening Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26ZC commit: `1df69045bf8070dc268758eb362aba4602df9f0b`
- Wrapper SHA-256: `b68eefc8bd3d29bf46901570fb96d92e445fb11ed2d2d1525075e29b2cf73fdd`
- Wrapper Git blob: `0551f26cbf650f68c9d4d7aa0320baff20889fd0`
- Manifest SHA-256: `4d5563c3fc7c1c6f3fb387229dff2415e84d788d2893ef0eaa98975e11e20a44`
- Generator SHA-256: `1dc989e15a8e23fd269eb1af52dd060f1682c758fd0c0fadcd53e02eb875f474`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`

## Newly Verified Output-Surface Finding

The SQL candidate's stated output contract allows classifications and counts only.

However, the committed grant inspection currently projects raw catalog identifiers:

- `table_name`
- `grantee`
- `privilege_type`
- `is_grantable`

Raw grant-identifier projection blocks found: `1`.

Although these are catalog metadata rather than application rows, they can expose database role names and privilege structure in terminal output and logs. That conflicts with the redacted evidence contract.

## Consequence

The live wrapper activation revision remains blocked.

The SQL candidate can no longer remain immutable if the output contract is to be enforced. A narrowly scoped SQL hardening revision is required before wrapper activation.

## Required SQL Revision

The future review-only revision may replace only the raw grant-detail projection with classifications and aggregate counts.

The revised query should expose no role name, grantee, table name, privilege string, or grantability value.

Permitted aggregate examples include:

- Total matching grant-row count.
- Count of distinct grantee classifications without names.
- Count of SELECT grants.
- Count of non-SELECT grants.
- Count of grantable privileges.
- Boolean indicating whether unexpected privilege types exist.
- Boolean indicating whether any grant is grantable.
- Boolean indicating whether the finite target relation has at least one matching grant row.

## Required Coupled Identity Updates

Because the SQL candidate identity changes, the future review-only revision must update:

1. SQL candidate.
2. Detached manifest SQL SHA-256.
3. Wrapper embedded SQL SHA-256.
4. Wrapper SHA-256 and Git blob in the manifest.
5. Generator wrapper, manifest, and SQL identity bindings, where present.

The wrapper activation stop must remain active.

Manifest state must remain:

- `WRAPPER_EXIT_93_REQUIRED=YES`
- `LIVE_EXECUTION_AUTHORIZED=NO`

## Required Verification

The review package must prove:

- No raw `grantee`, role name, table name, privilege type, or grantability value is selected.
- Only finite classifications, booleans, and counts are emitted.
- No application tables or rows are read.
- No policy expressions are emitted.
- Transaction remains read-only.
- SQL syntax remains static and unexecuted.
- Wrapper remains inert.
- All identity bindings are synchronized.

## Gate Separation

- Phase 26ZD artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- SQL output-hardening revision: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Wrapper activation: `NOT_AUTHORIZED`
- Token cleanup or issuance: `NOT_AUTHORIZED`
- Descriptor opening: `NOT_AUTHORIZED`
- Database connection or SQL execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26ZD_CATALOG_OUTPUT_REDACTION_HARDENING_PLAN`
- `REQUEST_CHANGES_PHASE_26ZD_CATALOG_OUTPUT_REDACTION_HARDENING_PLAN`
- `REJECT_PHASE_26ZD_CATALOG_OUTPUT_REDACTION_HARDENING_PLAN`
