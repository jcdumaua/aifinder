# AiFinder Phase 26JM — Sanitizer Compatibility Review Plan

A future execution wrapper must admit exactly:

- `STOPPED_FAIL_CLOSED`;
- `stop_reason=` followed by one of the 22 committed symbols or the fixed unknown symbol;
- the three approved diagnostic traces.

All other output remains excluded or fail-closed.
