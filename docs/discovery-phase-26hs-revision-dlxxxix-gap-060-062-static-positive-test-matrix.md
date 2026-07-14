# AiFinder Phase 26HS — Static Positive Test Matrix

- `REPOSITORY_PATH_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `ORIGIN_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `BRANCH_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `FETCH_FAILED` must be accepted exactly once and emitted unchanged as a symbolic token.
- `BASELINE_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `REMOTE_BASELINE_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `AHEAD_OF_ORIGIN` must be accepted exactly once and emitted unchanged as a symbolic token.
- `BEHIND_ORIGIN` must be accepted exactly once and emitted unchanged as a symbolic token.
- `WORKING_TREE_NOT_CLEAN` must be accepted exactly once and emitted unchanged as a symbolic token.
- `RETRY_POLICY_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `EXPECTED_COUNT_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `TIMEOUT_NOT_REVIEWED` must be accepted exactly once and emitted unchanged as a symbolic token.
- `EXECUTION_BASELINE_NOT_REVIEWED` must be accepted exactly once and emitted unchanged as a symbolic token.
- `ADAPTER_LABEL_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `PLATFORM_CATEGORY_MISMATCH` must be accepted exactly once and emitted unchanged as a symbolic token.
- `SINGLE_REQUEST_NOT_AUTHORIZED` must be accepted exactly once and emitted unchanged as a symbolic token.
- `TOKEN_REFERENCE_MISSING` must be accepted exactly once and emitted unchanged as a symbolic token.
- `PROJECT_SELECTOR_MISSING` must be accepted exactly once and emitted unchanged as a symbolic token.
- `TEAM_SELECTOR_MISSING` must be accepted exactly once and emitted unchanged as a symbolic token.
- `UNEXPECTED_TEAM_SELECTOR` must be accepted exactly once and emitted unchanged as a symbolic token.
- `TEAM_CONTEXT_CONFIRMATION_INVALID` must be accepted exactly once and emitted unchanged as a symbolic token.
- `SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED` must be accepted exactly once and emitted unchanged as a symbolic token.

Each accepted token must produce exactly the fixed marker plus its own symbolic `stop_reason` line in an isolated non-network test harness.
