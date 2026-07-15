# Phase 26RY — GAP-001 Authoritative Record Schema and Acceptance Gate

## Required record schema

A candidate authoritative record must contain:

| Field | Requirement |
|---|---|
| `blocker_id` | Exactly `GAP-001` |
| `owner_category` | Explicit non-empty controlled value |
| `decision_family` | Explicit non-empty controlled value |
| `risk_classification` | Explicit non-empty controlled value |
| `batch_id` | Explicit value or explicit `NO_EXACT_BATCH` |
| `blocker_description` | Exact blocker condition |
| `governing_source` | Exact source path or attributable human record |
| `authority` | Named accountable role or approved decision authority |
| `distinguishing_rationale` | Why this metadata applies to GAP-001 specifically |
| `record_version` | Immutable version identity |
| `record_date` | Explicit date |
| `execution_boundary` | Must state governance classification does not authorize execution |
| `quarantine_state` | Must remain active until reviewed application |

## Acceptance gate

A candidate record is acceptable only when all conditions pass:

1. GAP-001 is named directly.
2. Owner, family, and risk are explicit.
3. Batch is explicit or explicitly absent.
4. No value comes from a table header.
5. No value is inherited from another cohort.
6. Provenance is exact and inspectable.
7. Authority is attributable.
8. Distinguishing rationale is specific.
9. No field conflict remains unresolved.
10. Independent Gemini review returns approval.
11. A later application phase records the metadata.
12. A separate governance phase applies standing authorization.
13. Physical execution remains separately blocked.

## Failure behavior

Any missing field, ambiguous attribution, conflicting value, inferred relationship, or corrupt source keeps:

- classification: `NOT_ESTABLISHED`;
- quarantine: `ACTIVE`;
- ledger: `62_CLEARED_1_REMAINING`;
- operational reactivation: `BLOCKED`.
