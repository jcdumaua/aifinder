# AiFinder Phase 26ZC — Live Preflight Activation Correction Planning Gate

## Status

`AWAITING_GEMINI_SENIOR_REVIEW`

## Baseline

- Phase 26ZB commit: `625d8b999ec86747367762bfa48d28ddcb069aa8`
- Wrapper SHA-256: `b68eefc8bd3d29bf46901570fb96d92e445fb11ed2d2d1525075e29b2cf73fdd`
- Wrapper Git blob: `0551f26cbf650f68c9d4d7aa0320baff20889fd0`
- Manifest SHA-256: `4d5563c3fc7c1c6f3fb387229dff2415e84d788d2893ef0eaa98975e11e20a44`
- Generator SHA-256: `1dc989e15a8e23fd269eb1af52dd060f1682c758fd0c0fadcd53e02eb875f474`
- SQL candidate SHA-256: `b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b`

## Recovery Context

Phase 26ZB was committed and pushed successfully.

The first Phase 26ZC generator stopped after detecting an active `exit 93` statement. No Phase 26ZC artifact or runtime-file change was created.

## Exact Static Findings

- Active `exit 93` statements: `1`
- Active `psql` invocations: `0`
- Commented `PGSERVICEFILE ... psql` prototypes: `1`
- `CONSUMED=YES` write markers: `0`
- Exclusive-lock markers: `0`
- Manifest `WRAPPER_EXIT_93_REQUIRED`: `YES`
- Manifest `LIVE_EXECUTION_AUTHORIZED`: `NO`

## Corrected Activation Scope

A future review-only revision may modify only:

1. The wrapper.
2. The detached identity manifest.
3. The generator identity bindings.

The SQL candidate must remain unchanged.

## Required Wrapper Revision

The revision must:

1. Replace exactly the active `exit 93` activation stop.
2. Expand the collapsed commented `psql` prototype into one active multiline invocation.
3. Preserve descriptor-only inputs.
4. Add an atomic authorization transition from `CONSUMED=NO` to `CONSUMED=YES` before any database connection.
5. Hold an exclusive lock while validating and rewriting the authorization record.
6. Verify the rewritten record before continuing.
7. Permit no retry after consumption.
8. Execute exactly one database connection and one SQL candidate.
9. Fail closed on any nonzero `psql` result.
10. Emit only redacted evidence.

## Required Authorization-Record Contract

The authorization descriptor must be opened read-write by the final runner.

While holding an exclusive lock, the wrapper must:

- Verify regular-file, owner, and mode-`600` classifications.
- Validate complete schema and exact identities.
- Verify staging scope, unexpired state, and `CONSUMED=NO`.
- Rewrite only the consumed field to `CONSUMED=YES`.
- Flush and re-read the record.
- Verify `CONSUMED=YES`.
- Keep the nonce internal and redacted.

## Required Active PSQL Chain

```bash
PGSERVICEFILE="/dev/fd/${service_fd}" PGSERVICE="aifinder_preflight" \
psql --no-psqlrc --set=ON_ERROR_STOP=1 \
  --command="SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;" \
  --command="SET statement_timeout = '10s';" \
  --command="SET lock_timeout = '5s';" \
  --file="${sql_candidate}"
```

## Required Manifest Transition

After the reviewed wrapper revision:

- `WRAPPER_EXIT_93_REQUIRED=NO`
- `LIVE_EXECUTION_AUTHORIZED=YES`
- Wrapper SHA-256 and Git blob recalculated.
- Manifest SHA-256 recalculated.
- Generator identities rebound.

## Required Final Diff Evidence

- Exact wrapper diff.
- Exact manifest diff.
- Exact generator diff.
- Bash syntax validation.
- One active `exit 93` removed.
- One active `psql` invocation added.
- One lock-protected consumed-state transition added.
- SQL candidate unchanged.
- No credential, nonce, environment value, raw catalog row, or database identifier logged.

## Current Boundary

- Activation revision: `NOT_AUTHORIZED_PENDING_GEMINI_REVIEW`
- Runtime execution: `NOT_AUTHORIZED`
- Token cleanup or issuance: `NOT_AUTHORIZED`
- Descriptor opening: `NOT_AUTHORIZED`
- Database connection and SQL execution: `NOT_AUTHORIZED`
- Migration execution: `PROHIBITED`
- Operational reactivation: `BLOCKED`
- Public launch: `BLOCKED`

## Requested Gemini Determination

Select exactly one:

- `APPROVE_PHASE_26ZC_CORRECTED_ACTIVATION_AND_ATOMIC_CONSUMPTION_PLAN`
- `REQUEST_CHANGES_PHASE_26ZC_CORRECTED_ACTIVATION_AND_ATOMIC_CONSUMPTION_PLAN`
- `REJECT_PHASE_26ZC_CORRECTED_ACTIVATION_AND_ATOMIC_CONSUMPTION_PLAN`
