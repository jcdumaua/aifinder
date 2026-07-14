# AiFinder Phase 26HI — Exact Fail Helper Patch Design

Before emitting `stop_reason`, validate `$1` through this source-derived allowlist:

```bash
case "$1" in
    REPOSITORY_PATH_MISMATCH) ;;
    ORIGIN_MISMATCH) ;;
    BRANCH_MISMATCH) ;;
    FETCH_FAILED) ;;
    BASELINE_MISMATCH) ;;
    REMOTE_BASELINE_MISMATCH) ;;
    AHEAD_OF_ORIGIN) ;;
    BEHIND_ORIGIN) ;;
    WORKING_TREE_NOT_CLEAN) ;;
    RETRY_POLICY_MISMATCH) ;;
    EXPECTED_COUNT_MISMATCH) ;;
    TIMEOUT_NOT_REVIEWED) ;;
    EXECUTION_BASELINE_NOT_REVIEWED) ;;
    ADAPTER_LABEL_MISMATCH) ;;
    PLATFORM_CATEGORY_MISMATCH) ;;
    SINGLE_REQUEST_NOT_AUTHORIZED) ;;
    TOKEN_REFERENCE_MISSING) ;;
    PROJECT_SELECTOR_MISSING) ;;
    TEAM_SELECTOR_MISSING) ;;
    UNEXPECTED_TEAM_SELECTOR) ;;
    TEAM_CONTEXT_CONFIRMATION_INVALID) ;;
    SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED) ;;
    *) printf "STOPPED_FAIL_CLOSED\n"; printf "stop_reason=UNKNOWN_FAIL_CLOSED_REASON\n"; return 1 ;;
esac
```

The final implementation must be reconstructed against exact baseline bytes before application.
