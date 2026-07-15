# AiFinder Phase 26ZF — Final Live Preflight Activation Implementation Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26ZE commit: `a53f7748d4bc07107ca8917724f85b082180fe34`
- SQL candidate SHA-256: `32ea49528123a7bbafe6d430fdc637a91da4a6c977ee5cc9e5f912770a907c55`
- Wrapper SHA-256: `ec039e1cf5ec2b40261f3f8f730e2eb2d888296ef006d05c23fd0ebe6e02d10f`
- Wrapper Git blob: `74a1603939b8efd63099aa4618ab8a88bbfa34cc`
- Manifest SHA-256: `b694cfc0cac6bee37cc47f0d4c4f35b2653016d5676375fe09f5d4aeb9183136`
- Generator SHA-256: `69e527ed823d67f6ff1cff5a4866b08c560f33c823ba5f60aa26ade0fa73f564`

## Verified Current State

- SQL output is aggregate/classification only.
- Raw grantee and privilege identifiers are no longer projected.
- Wrapper remains inert.
- Manifest remains `WRAPPER_EXIT_93_REQUIRED=YES`.
- Manifest remains `LIVE_EXECUTION_AUTHORIZED=NO`.
- No runtime execution has occurred.

## Purpose

Authorize drafting of the final three-file activation revision:

1. Wrapper activation and atomic authorization consumption.
2. Detached manifest activation and identity rebinding.
3. Generator identity rebinding.

The SQL candidate is immutable in Phase 26ZF.

## Required Wrapper Implementation

The final draft must:

1. Preserve descriptor-only arguments:
   - `--service-fd <N>`
   - `--authorization-fd <M>`
   - `--environment-class staging`
2. Require the authorization descriptor to be opened read-write.
3. Verify that the authorization descriptor targets a regular file owned by the current user with mode `600`.
4. Acquire one exclusive nonblocking lock before parsing the record.
5. Parse and validate the record while the lock is held.
6. Verify:
   - Exact authorization schema.
   - Exact commit and SQL identities.
   - Staging environment.
   - Valid expiry.
   - `CONSUMED=NO`.
7. Rewrite only `CONSUMED=NO` to `CONSUMED=YES`.
8. Flush the record and re-read it.
9. Verify `CONSUMED=YES` before opening a network connection.
10. Permit no retry after consumption.
11. Replace exactly the active `exit 93` activation stop.
12. Execute exactly one active read-only `psql` chain.
13. Fail closed on any nonzero `psql` result.
14. Emit only redacted counts, booleans, and classifications.
15. Clear in-memory authorization payload and nonce variables before return.

## Approved PSQL Shape

```bash
PGSERVICEFILE="/dev/fd/${service_fd}" PGSERVICE="aifinder_preflight" \
psql --no-psqlrc --set=ON_ERROR_STOP=1 \
  --command="SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;" \
  --command="SET statement_timeout = '10s';" \
  --command="SET lock_timeout = '5s';" \
  --file="${sql_candidate}"
```

The final draft must suppress or capture output so that only the approved redacted evidence contract reaches the persistent log.

## Required Manifest Transition

The final draft must:

- Set `WRAPPER_EXIT_93_REQUIRED=NO`.
- Set `LIVE_EXECUTION_AUTHORIZED=YES`.
- Update wrapper SHA-256.
- Update wrapper Git blob.
- Preserve the exact SQL SHA-256.

## Required Generator Rebinding

The final draft must update:

- Wrapper SHA-256.
- Wrapper Git blob.
- Manifest SHA-256.
- Preserve the exact SQL SHA-256.

## Required Static Review Evidence

The draft review package must include:

- Exact wrapper diff.
- Exact manifest diff.
- Exact generator diff.
- Bash syntax checks.
- Exactly one removed active `exit 93`.
- Exactly one active `psql` invocation.
- Exactly one read-only session assertion.
- Exactly one statement timeout and lock timeout.
- Static evidence of lock acquisition.
- Static evidence of `CONSUMED=NO -> CONSUMED=YES`.
- Static evidence that success output follows successful `psql`.
- Static evidence that SQL identity is unchanged.
- Static evidence that runtime files remain unstaged and unexecuted.

## Current Boundary

- Phase 26ZF artifact commit: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Activation draft: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Runtime execution: `NOT_AUTHORIZED`
- Token cleanup or issuance: `NOT_AUTHORIZED`
- Descriptor opening: `NOT_AUTHORIZED`
- Database connection or SQL execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26ZF_FINAL_ACTIVATION_IMPLEMENTATION_GATE`
- `REQUEST_CHANGES_PHASE_26ZF_FINAL_ACTIVATION_IMPLEMENTATION_GATE`
- `REJECT_PHASE_26ZF_FINAL_ACTIVATION_IMPLEMENTATION_GATE`
