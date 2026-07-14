# AiFinder Phase 26NM — Amended Zero-Network Synthetic Verification Matrix

| # | Verification | Requirement |
|---:|---|---|
| 1 | `candidate_local_baseline_block_absent` | Required |
| 2 | `candidate_remote_baseline_producer_preserved` | Required |
| 3 | `wrapper_namespace_symbols_distinct` | Required |
| 4 | `wrapper_passive_routing_preserved` | Required |
| 5 | `invocation_marker_admitted_before_malformed_trap` | Required |
| 6 | `status_marker_admitted_before_malformed_trap` | Required |
| 7 | `malformed_diagnostic_trace_still_increments_malformed_prefix` | Required |
| 8 | `superseded_line147_replacement_absent` | Required |
| 9 | `pre_marker_precedes_invocation` | Required |
| 10 | `invocation_precedes_status_capture` | Required |
| 11 | `status_capture_precedes_post_marker` | Required |
| 12 | `set_plus_e_and_set_minus_e_preserved` | Required |
| 13 | `candidate_invocation_count_remains_one` | Required |
| 14 | `bash_syntax_passes_for_both_sources` | Required |
| 15 | `no_network_process_spawned_by_tests` | Required |

## Semantic focus

The amended matrix explicitly proves:

- valid provenance markers are admitted before line 147;
- malformed `DIAGNOSTIC_TRACE:` output still reaches the rejection trap;
- the historical ineffective line-147 replacement is absent;
- no live request, environment read, or external process is required.

Live execution authorization is not implied.
