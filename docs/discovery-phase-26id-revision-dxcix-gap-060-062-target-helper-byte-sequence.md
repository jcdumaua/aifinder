# AiFinder Phase 26ID — Target Helper Byte Sequence

```python
'fail() {\n  local reason="${1-}"\n  case "$reason" in\n    REPOSITORY_PATH_MISMATCH) ;;\n    ORIGIN_MISMATCH) ;;\n    BRANCH_MISMATCH) ;;\n    FETCH_FAILED) ;;\n    BASELINE_MISMATCH) ;;\n    REMOTE_BASELINE_MISMATCH) ;;\n    AHEAD_OF_ORIGIN) ;;\n    BEHIND_ORIGIN) ;;\n    WORKING_TREE_NOT_CLEAN) ;;\n    RETRY_POLICY_MISMATCH) ;;\n    EXPECTED_COUNT_MISMATCH) ;;\n    TIMEOUT_NOT_REVIEWED) ;;\n    EXECUTION_BASELINE_NOT_REVIEWED) ;;\n    ADAPTER_LABEL_MISMATCH) ;;\n    PLATFORM_CATEGORY_MISMATCH) ;;\n    SINGLE_REQUEST_NOT_AUTHORIZED) ;;\n    TOKEN_REFERENCE_MISSING) ;;\n    PROJECT_SELECTOR_MISSING) ;;\n    TEAM_SELECTOR_MISSING) ;;\n    UNEXPECTED_TEAM_SELECTOR) ;;\n    TEAM_CONTEXT_CONFIRMATION_INVALID) ;;\n    SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED) ;;\n    *) reason="UNKNOWN_FAIL_CLOSED_REASON" ;;\n  esac\n  printf \'STOPPED_FAIL_CLOSED\\n\'\n  printf \'stop_reason=%s\\n\' "$reason"\n  return 1\n}\n'
```

This is the complete expected replacement sequence. No manual variation is permitted.
