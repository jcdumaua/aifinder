# Phase 26RO — Reclassified Cohort Standing Authorization Register

## Bound baseline

`d496ebe13de1cde5570a34332224b3c1111bcb49`

## Standing authorization source

The authorized human owner approved all remaining human-governance decisions and instructed the workflow not to pause for individual governance authorization requests.

## Exact blocker set

`GAP-012`, `GAP-013`, `GAP-014`, `GAP-015`, `GAP-025`, `GAP-026`, `GAP-027`, `GAP-028`, `GAP-029`, `GAP-030`, `GAP-031`, `GAP-041`, `GAP-042`, `GAP-043`, `GAP-044`

## Derived coherent cohorts

| Cohort | Owner | Decision family | Risk | Batch | Blockers | Size |
|---|---|---|---|---|---|---|
| `RC-01` | `EVIDENCE_OR_SECURITY_OWNER` | `EVIDENCE_ACQUISITION` | `HIGH_SECURITY_OR_PRODUCTION` | `UNRESOLVED` | `GAP-041`, `GAP-042`, `GAP-043`, `GAP-044` | `4` |
| `RC-02` | `SECURITY_OR_PLATFORM_OWNER` | `RISK` | `SOURCE` | `BLOCKER` | `GAP-012`, `GAP-013`, `GAP-014` | `3` |
| `RC-03` | `SECURITY_OR_PLATFORM_OWNER` | `SECURITY_AND_PLATFORM_ACCESS` | `HIGH_SECURITY_OR_PRODUCTION` | `UNRESOLVED` | `GAP-015`, `GAP-025`, `GAP-026`, `GAP-027`, `GAP-028`, `GAP-029`, `GAP-030`, `GAP-031` | `8` |

## Authorization boundary

Standing authorization applies only to governance-layer dispositions. It does not authorize cleanup, archival, deletion, evidence acquisition, credential or access changes, database mutation, runtime activity, deployment, publishing, staging, commit, push, or operational reactivation.

## Current state

- Standing governance authorization: `ACTIVE`
- Governance application: `PENDING_DOCUMENTATION_APPLICATION`
- Execution authorization: `ABSENT`
- Operational reactivation: `BLOCKED`
