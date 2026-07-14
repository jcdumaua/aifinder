# AiFinder Phase 26NG — Zero-Network Synthetic Verification Matrix

| # | Verification | Requirement |
|---:|---|---|
| 1 | `candidate_local_baseline_block_absent` | Required |
| 2 | `candidate_remote_baseline_producer_preserved` | Required |
| 3 | `wrapper_namespace_symbols_distinct` | Required |
| 4 | `wrapper_passive_routing_preserved` | Required |
| 5 | `sanitizer_accepts_invocation_marker` | Required |
| 6 | `sanitizer_accepts_status_marker` | Required |
| 7 | `malformed_diagnostic_trace_still_fail_closed` | Required |
| 8 | `pre_marker_precedes_invocation` | Required |
| 9 | `status_capture_precedes_post_marker` | Required |
| 10 | `set_plus_e_and_set_minus_e_preserved` | Required |
| 11 | `candidate_invocation_count_remains_one` | Required |
| 12 | `bash_syntax_passes_for_both_sources` | Required |
| 13 | `no_network_process_spawned_by_tests` | Required |

## Execution boundary

The synthetic test implementation must:

- operate only on temporary copies or shell functions;
- replace the candidate invocation with a local inert fixture;
- prohibit `curl`, server startup, route invocation, and external services;
- read no environment values;
- print no secrets or response bodies;
- make zero live metadata requests;
- leave repository source files unchanged until the implementation gate explicitly applies reviewed bytes.

Live execution authorization is not implied.
