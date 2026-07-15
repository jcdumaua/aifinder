# Phase 26VH — Live RLS Execution Command Contract

## Required preparation

The operator must provide the approved connection value only through:

`AIFINDER_RLS_METADATA_DATABASE_URL`

The value must not be pasted into the command line, printed, logged, hashed, measured, or copied to the clipboard.

## Proposed execution command

The committed wrapper remains mode `100644`. For one reviewed invocation, execute it explicitly through Bash:

```bash
bash scripts/discovery-live-rls-metadata-execution-wrapper-candidate.sh
```

No `chmod` is required.

## Committed wrapper invocation

The wrapper invokes:

```bash
psql \
  "${!CONNECTION_ENV_NAME}" \
  -w \
  --no-psqlrc \
  --set=ON_ERROR_STOP=1 \
  --set=VERBOSITY=terse \
  --pset=pager=off \
  --pset=footer=off \
  --file="$QUERY_FILE" \
  > "$RAW_OUTPUT" 2>&1
```

## Approved transaction posture

The immutable SQL file includes:

```sql
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = 5000;
...
ROLLBACK;
```

## Approved output columns

- `schema_name`
- `relation_name`
- `relation_kind`
- `rls_enabled`
- `rls_forced`
- `policy_name`
- `policy_is_permissive`
- `policy_command`
- `policy_roles`
- `using_expression`
- `with_check_expression`
- `policy_count`

## Execution count

Exactly one execution is authorized per approval token. A retry after connection, syntax, timeout, or output failure requires review of the failure and a new authorization.

## Corrected baseline-binding rule

The wrapper now requires a clean synchronized `HEAD == origin/main` and verifies that approved package baseline `bcdc55495061592e1d60af6ed3f16ca0256db0ae` is an ancestor of current `HEAD`. This permits execution after the authorization documents are committed without weakening package provenance.
