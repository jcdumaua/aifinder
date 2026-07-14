# AiFinder Phase 26HB — Exact Symbolic Stop-Reason Allowlist

## Source-derived allowlist

The following 22 literal stop reasons were extracted from fail-closed branches before the preflight-success trace in `scripts/discovery-gap-060-062-read-only-metadata-check-candidate.sh`:

- `REPOSITORY_PATH_MISMATCH`
- `ORIGIN_MISMATCH`
- `BRANCH_MISMATCH`
- `FETCH_FAILED`
- `BASELINE_MISMATCH`
- `REMOTE_BASELINE_MISMATCH`
- `AHEAD_OF_ORIGIN`
- `BEHIND_ORIGIN`
- `WORKING_TREE_NOT_CLEAN`
- `RETRY_POLICY_MISMATCH`
- `EXPECTED_COUNT_MISMATCH`
- `TIMEOUT_NOT_REVIEWED`
- `EXECUTION_BASELINE_NOT_REVIEWED`
- `ADAPTER_LABEL_MISMATCH`
- `PLATFORM_CATEGORY_MISMATCH`
- `SINGLE_REQUEST_NOT_AUTHORIZED`
- `TOKEN_REFERENCE_MISSING`
- `PROJECT_SELECTOR_MISSING`
- `TEAM_SELECTOR_MISSING`
- `UNEXPECTED_TEAM_SELECTOR`
- `TEAM_CONTEXT_CONFIRMATION_INVALID`
- `SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED`

## Constraints

- Count: `22`
- Unique: `YES`
- Pattern: `^[A-Z][A-Z0-9_]{2,63}$`
- Dynamic reasons: `PROHIBITED`
- Value-bearing output: `PROHIBITED`
