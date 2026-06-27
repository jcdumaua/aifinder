# Discovery Phase 10L — Candidate Extraction Staging Pipeline Live Smoke Result

## Status

Passed.

## Phase

Phase 10L — Candidate Extraction Staging Pipeline Live Smoke Result Documentation.

## Date

June 27, 2026.

## Related Execution Phase

Phase 10K — Candidate Extraction Staging Pipeline Live Smoke Execution.

## Latest Commit at Execution Time

```text
5d6ab3b Add candidate extraction staging smoke harness
```

## Purpose

This document records the approved Phase 10K live smoke execution result for the Candidate Extraction Staging Pipeline.

The smoke verified the controlled live path from candidate extraction mapper output through the staging pipeline and staging helper into `discovery_candidate_tools`.

The smoke also verified that the staged candidate preserved source/run/audit lineage, public table isolation remained intact, anonymous access was denied, and all controlled fixtures were cleaned up by exact ID.

## Human Approval Record

James explicitly approved the live smoke execution with:

```text
Approve run Phase 10K live smoke
```

## Exact Command Executed

The live smoke was run exactly once with:

```bash
AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1 node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
```

The command was not rerun automatically.

## Result

Passed.

Observed pass output:

```text
[Phase 10I] Candidate extraction staging pipeline smoke passed.
```

## Smoke Marker

```text
phase-10i-extraction-staging-pipeline-smoke:9e4d2817
```

## Fixture IDs

The live smoke created controlled fixtures only.

Discovery source ID:

```text
12f7bb30-2ca2-412e-ba9b-6291d7a48522
```

Discovery run ID:

```text
ce32ea02-2f48-4046-ba0b-4d18445c33fa
```

Staged candidate ID:

```text
7062e9ec-f4a0-4e2f-b9df-f72dabb65000
```

## Assertions Passed

The smoke confirmed:

- mapper success;
- staging success;
- service-role readback;
- `discovery_source_id === sourceId`;
- `discovery_run_id === runId`;
- `audit_correlation_id === expectedCorrelation`;
- `candidate_status === "staged"`;
- `public.tools` count unchanged;
- `discovered_tools` count unchanged;
- anonymous exact-ID denial with `permission_denied`;
- anonymous list denial with `permission_denied`;
- guessed exact candidate ID denial with `permission_denied`;
- no payload leakage.

## Cleanup Verification

Exact-ID cleanup completed successfully.

Candidate cleanup verified:

```text
7062e9ec-f4a0-4e2f-b9df-f72dabb65000
```

Run cleanup verified:

```text
ce32ea02-2f48-4046-ba0b-4d18445c33fa
```

Source cleanup verified:

```text
12f7bb30-2ca2-412e-ba9b-6291d7a48522
```

No manual cleanup was required.

## Boundary Confirmations

Phase 10K confirmed:

- live smoke was run exactly once;
- no automatic rerun occurred;
- no `public.tools` writes occurred;
- no `discovered_tools` writes occurred;
- no audit event writes occurred;
- no API integration was added;
- no UI integration was added;
- no crawler automation was added;
- no LLM behavior was added;
- no live executor integration was added;
- `supabase db push` was not run;
- migrations were not run;
- Supabase types were not regenerated;
- code, docs, tests, and package scripts were not changed during execution.

## Non-Blocking Notes

A non-blocking Node typeless ESM parsing warning appeared during execution.

The warning did not block the live smoke pass.

No fix was made in this phase.

## Final Repo State After Execution

Latest commit remained:

```text
5d6ab3b Add candidate extraction staging smoke harness
```

Final git status after execution:

```text
## main...origin/main
```

## Conclusion

The Candidate Extraction Staging Pipeline live smoke passed.

This confirms the mapper-to-staging path can create a staged candidate with correct source, run, audit-correlation, and staged-status lineage while preserving public table isolation, RLS denial behavior, and exact-ID cleanup.

The pipeline remains staging-only and is not wired into API, UI, crawler automation, LLM execution, or live executor production flow.

## Recommended Next Phase

Phase 10M — Candidate Extraction Staging Pipeline Post-Smoke Review / Production Integration Readiness Gate.
