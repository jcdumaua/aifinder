# AiFinder Phase 26MO — Exact Sanitizer Replacement Bytes Plan

The sanitizer change must:

- admit each producer marker at most once;
- admit integer return status only;
- preserve existing fixed marker, 22 candidate reasons, unknown fallback, and diagnostic traces;
- add `WRAPPER_BASELINE_MISMATCH` as wrapper-local output;
- reject duplicate, malformed, denylisted, or unrecognized lines.
