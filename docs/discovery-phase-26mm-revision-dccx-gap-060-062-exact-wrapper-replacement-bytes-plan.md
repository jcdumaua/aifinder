# AiFinder Phase 26MM — Exact Wrapper Replacement Bytes Plan

Current wrapper SHA-256: `475036a9e9147158344200addd7ecf55bf2b87cac161cc49bfb93d37c482ed5c`.

Planned edits:

1. insert `WRAPPER_TRACE: CANDIDATE_INVOCATION_BEGIN` immediately before the one candidate invocation;
2. insert `WRAPPER_TRACE: CANDIDATE_INVOCATION_RETURNED STATUS=<integer>` immediately after exact candidate-status capture;
3. namespace wrapper-local baseline mismatch as `WRAPPER_BASELINE_MISMATCH`;
4. admit the producer markers through exact sanitizer patterns;
5. reject duplicates and malformed marker variants.

This document is a plan, not an implementation authorization.
