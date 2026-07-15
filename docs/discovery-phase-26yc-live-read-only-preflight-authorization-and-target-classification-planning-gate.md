# AiFinder Phase 26YC — Live Read-Only Preflight Authorization and Target Classification Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26YB commit: `1e5875dca55f0a20e884e7f1de036e9489e0e3d1`
- SQL candidate: `scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql`
- SQL SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`
- Shell wrapper: `scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh`
- Shell SHA-256: `8ec68dbc48e40e1b4496a82b211849aaeec423ada2a30196bef478aca52b7a58`
- Wrapper guard: `exit 90` present and unchanged
- Branch synchronized with `origin/main`: yes

## Purpose

Define the exact authorization, target-classification, credential-delivery, execution, output-redaction, and recovery contract required before the inert Phase 26YB wrapper may be converted into a bounded live read-only preflight runner.

This gate does not remove the wrapper guard, access credentials, connect to a database, execute catalog queries, run migrations, or authorize mutation.

## Required Authorization Layers

The future live preflight requires separate, explicit approvals for:

1. **Wrapper activation:** permission to replace only the unconditional `exit 90` block with reviewed execution logic.
2. **Credential delivery mechanism:** permission for one bounded mechanism that supplies a database connection to the process without printing or persisting secret values.
3. **Target identity:** positive classification of the intended target environment before any query runs.
4. **Read-only catalog execution:** permission to execute only the committed Phase 26YB SQL candidate.
5. **Result review:** independent review of redacted classifications before any migration execution is considered.

Approval of one layer must not imply approval of another.

## Target Classification Contract

Before catalog inspection, the future runner must classify the target using non-secret properties and compare them to an explicit authorization record.

The authorization record must identify:

- Environment class: local, preview, staging, or production.
- Expected project or database identity represented by a non-secret fingerprint or approved identifier.
- Whether a replica is expected.
- Whether the session must report `transaction_read_only = on`.
- Expected session-role category without printing the role name.
- Allowed network route or connector class.
- Expiration or one-use boundary for the execution authorization.

The runner must fail before executing the SQL candidate if the target cannot be positively classified.

## Credential Delivery Requirements

The future wrapper must:

- Accept only one explicitly reviewed credential-delivery mechanism.
- Never read arbitrary environment files.
- Never print the connection string, password, token, hostname, username, or database name.
- Never include secrets in command arguments visible through process listings when a safer input method is available.
- Never write credentials to repository files or logs.
- Clear temporary secret-bearing variables or descriptors on exit where technically possible.
- Refuse fallback discovery through common variables such as `DATABASE_URL`, `PGPASSWORD`, or unreviewed Supabase configuration.
- Preserve the original database-client exit code.

## Proposed Wrapper Activation Scope

A subsequent implementation phase may modify only the committed shell candidate and must preserve:

- `main` function structure.
- Timestamped log path under `/tmp/aifinder-26yc-...`.
- `tee` logging.
- `PIPESTATUS[0]` capture.
- Clipboard copy of a redacted review package on success.
- Clipboard copy of the raw failure log on failure.
- Original exit-code preservation.
- Repository, branch, baseline-commit, SQL-path, SQL-hash, and file-mode verification.
- Clear `PASSED` or `FAILED` terminal output.
- System-layer progress report on success.

The activation must not modify the SQL candidate unless a separate review identifies a defect.

## Execution Contract

The future runner must:

1. Verify the exact repository baseline and candidate hashes.
2. Verify that the working tree contains no unexpected changes.
3. Receive the separately authorized credential through the approved mechanism.
4. Establish a database session without echoing connection metadata.
5. Apply client-side fail-fast behavior.
6. Execute exactly the committed SQL candidate once.
7. Capture only the expected catalog classification output.
8. Redact database and role identifiers before clipboard packaging.
9. Close the connection immediately.
10. Leave the repository and database unchanged.
11. Return the database client's original exit status.

No forward or rollback migration may be invoked by the preflight runner.

## Expected Result Classes

The preflight result must classify the two domains independently:

### Primary RLS and policy boundary

- `PRIMARY_PREFLIGHT_MATCH`
- `PRIMARY_PREFLIGHT_DRIFT`
- `PRIMARY_PREFLIGHT_INCOMPLETE`

### Secondary relation-grant boundary

- `SECONDARY_PREFLIGHT_MATCH`
- `SECONDARY_PREFLIGHT_DRIFT`
- `SECONDARY_PREFLIGHT_INCOMPLETE`

### Overall result

- `PREFLIGHT_MATCH_EXECUTION_STILL_NOT_AUTHORIZED`
- `PREFLIGHT_DRIFT_FAIL_CLOSED`
- `PREFLIGHT_INCOMPLETE_FAIL_CLOSED`

A matching preflight does not authorize migration execution.

## Mandatory Failure Conditions

The future runner must fail closed if:

- The repository baseline, file paths, modes, or hashes differ.
- The wrapper or SQL candidate has unreviewed changes.
- The target authorization token or record is missing, expired, reused, or mismatched.
- The target environment cannot be positively classified.
- The connection mechanism would expose secret values.
- The session is not read-only when required.
- The database is a replica when a primary is required, or vice versa.
- A statement or lock timeout occurs.
- Output shape differs from the reviewed contract.
- Application-row data, policy expressions, credentials, session secrets, or response bodies could be printed.
- Either remediation domain cannot be independently classified.
- Any mutation command, migration runner, deployment, or publishing path becomes reachable.

## Recovery and Cleanup

On failure, the future runner must:

- Stop immediately.
- Close the client session.
- Preserve the original failure code.
- Copy only the raw local failure log to the clipboard.
- Avoid retries unless a new explicit authorization permits one.
- Leave the inert committed baseline recoverable through version control.
- Make no database, migration, deployment, or repository mutation.

## Gate Separation

- Phase 26YC planning artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Wrapper guard removal: `NOT_AUTHORIZED`
- Credential access: `NOT_AUTHORIZED`
- Live database connection: `NOT_AUTHORIZED`
- Catalog query execution: `NOT_AUTHORIZED`
- Forward migration execution: `PROHIBITED`
- Rollback execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26YC_LIVE_PREFLIGHT_AUTHORIZATION_AND_TARGET_CLASSIFICATION_PLAN`
- `REQUEST_CHANGES_PHASE_26YC_LIVE_PREFLIGHT_AUTHORIZATION_AND_TARGET_CLASSIFICATION_PLAN`
- `REJECT_PHASE_26YC_LIVE_PREFLIGHT_AUTHORIZATION_AND_TARGET_CLASSIFICATION_PLAN`
