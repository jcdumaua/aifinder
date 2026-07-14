# AiFinder Phase 26HM — Sanitizer Admission Pattern

A future sanitizer may admit:

```regex
^stop_reason=(?:ALLOWLIST_ALTERNATION|UNKNOWN_FAIL_CLOSED_REASON)$
```

The alternation must be generated from the committed exact 22-token allowlist.
