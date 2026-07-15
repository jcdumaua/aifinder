# Phase 26VX — Live RLS Metadata Sanitized Result

## Bound execution baseline

`a5aa37abcf79d5ed4cdf92fc30c53507f1157f5c`

## Execution result

`CATALOG_ONLY_LIVE_RLS_METADATA_INSPECTION_PASSED_WITH_WRAPPER_SCANNER_DEFECT`

The approved catalog-only inspection completed inside a read-only transaction and ended with `ROLLBACK`.

## Safety result

- Application rows read: `NONE`
- Database mutation: `NONE`
- Environment values printed: `NO`
- Automatic retry: `NO`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`

## Live RLS-enabled relations

The inspection returned 15 public relations with RLS enabled and RLS forced disabled:

1. `admin_audit_archives`
2. `admin_audit_logs`
3. `discovered_tools`
4. `discovery_audit_events`
5. `discovery_candidate_preview_artifacts`
6. `discovery_candidate_tools`
7. `discovery_duplicate_candidates`
8. `discovery_evidence`
9. `discovery_runs`
10. `discovery_sources`
11. `homepage_control_audit_events`
12. `homepage_control_checklist_runs`
13. `homepage_control_configs`
14. `submitted_tools`
15. `tools`

## Live policy-count summary

| Relation | Policy count |
|---|---:|
| `admin_audit_archives` | 0 |
| `admin_audit_logs` | 0 |
| `discovered_tools` | 1 |
| `discovery_audit_events` | 1 |
| `discovery_candidate_preview_artifacts` | 1 |
| `discovery_candidate_tools` | 1 |
| `discovery_duplicate_candidates` | 1 |
| `discovery_evidence` | 1 |
| `discovery_runs` | 1 |
| `discovery_sources` | 1 |
| `homepage_control_audit_events` | 2 |
| `homepage_control_checklist_runs` | 2 |
| `homepage_control_configs` | 2 |
| `submitted_tools` | 1 |
| `tools` | 2 |

## Policy posture observed

- Discovery relations use explicit deny-all policies.
- Homepage control relations use admin-oriented read/write policies.
- `submitted_tools` permits public inserts constrained to pending status.
- `tools` contains public read policies.
- `admin_audit_archives` and `admin_audit_logs` have RLS enabled with zero policies.

## Interpretation boundary

Zero policies on an RLS-enabled relation generally results in no access for ordinary roles, but this package does not independently establish the intended static contract for the two audit relations. They remain reconciliation items, not findings requiring mutation.
