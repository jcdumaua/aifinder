# Phase 9S — Post-Schema RLS Smoke Execution Result

## 1. Phase scope

Phase 9S executed the approved post-schema Candidate Staging RLS smoke once.

This phase verified that the patched RLS smoke harness can stage a controlled candidate through the current helper path, perform service-role readback, assert source lineage through `discovery_source_id`, confirm anonymous/public RLS denial, and clean up exact smoke-created fixtures.

Phase 9S did not modify source code, tests, helpers, smoke scripts, generated types, package scripts, API routes, UI, extraction, crawler, LLM, or audit-write behavior.

## 2. Explicit approval

James explicitly approved Phase 9S live RLS smoke execution.

The live smoke was run once only.

## 3. Exact live command used

The approved live command was:

```bash
AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
```

The execution command captured output to:

```text
/tmp/phase9s-candidate-staging-rls-smoke-output.txt
```

The opt-in variable was used inline for this single command only. It was not exported or persisted.

## 4. Preflight verification

Preflight repository status:

```text
## main...origin/main
```

Latest commit:

```text
488458f Assert candidate staging source readback
```

Preflight checks:

- targeted mocked helper test passed with 9 tests passing;
- `npm run check` passed after rerunning outside the sandbox due to the known Turbopack port-binding restriction;
- safe RLS smoke opt-out passed before live execution and confirmed no environment values loaded, no DB client created, and no DB operation performed.

## 5. Smoke result

Phase 9S live RLS smoke result:

```text
Passed.
```

The smoke exited successfully with code 0.

## 6. Smoke marker and fixture IDs

Smoke marker:

```text
phase-9e-rls-smoke:0cabebef
```

Created and cleaned fixture IDs:

```text
Discovery source:
4683b94c-cc24-4776-a40e-5a4048ae288b

Discovery run:
95a8665d-bcad-4fbf-a506-0a3abc9df48c

Staged candidate:
36861556-7fcf-400d-ab30-e846e4f7d7a5
```

These were controlled smoke fixtures created by the approved harness and cleaned up by exact ID.

## 7. Execution sequence observed

Observed live smoke sequence:

- opt-in guard was satisfied;
- local environment was loaded without printing values;
- smoke marker was generated;
- dedicated RLS smoke discovery source fixture was created;
- dedicated RLS smoke discovery run fixture was created;
- controlled RLS candidate fixture was normalized;
- `stageNormalizedDiscoveryCandidate(...)` was called exactly once;
- staged candidate fixture was created;
- service-role control read ran and passed;
- anonymous exact-ID read denial ran and passed;
- anonymous list denial ran and passed;
- guessed exact candidate ID denial ran and passed;
- authenticated non-admin exact-ID denial remained skipped because no approved non-admin test identity strategy exists;
- no-payload-leak assertion passed;
- Candidate Staging RLS smoke passed;
- exact-ID cleanup ran;
- exact-ID cleanup verification passed for candidate, run, and source fixtures.

## 8. Service-role readback result

Service-role control read result:

```text
pass
```

The patched smoke harness service-role readback selected `discovery_source_id` and asserted:

```js
data.discovery_source_id === sourceId
```

Because Test 1 passed, the post-schema smoke verified that the staged candidate row persisted the expected source fixture ID.

The smoke output did not print a full candidate row.

## 9. RLS denial results

Anonymous exact-ID read denial:

```text
pass (permission_denied)
```

Anonymous list denial:

```text
pass (permission_denied)
```

Guessed exact candidate ID denial:

```text
pass (permission_denied)
```

Authenticated non-admin exact-ID denial:

```text
skipped (no approved non-admin test identity strategy)
```

No-payload-leak result:

```text
pass (denial logs used safe categories only)
```

No full candidate payload, raw Supabase error object, secret, service-role key, anon key, token, connection string, or environment value was printed.

## 10. Cleanup result

Cleanup order:

1. staged candidate fixture;
2. discovery run fixture;
3. discovery source fixture.

Cleanup output:

```text
Cleanup verified for staged candidate fixture: 36861556-7fcf-400d-ab30-e846e4f7d7a5
Cleanup verified for discovery run fixture: 95a8665d-bcad-4fbf-a506-0a3abc9df48c
Cleanup verified for discovery source fixture: 4683b94c-cc24-4776-a40e-5a4048ae288b
Exact-ID cleanup completed.
```

No manual cleanup was required.

## 11. Safety boundaries preserved

Phase 9S preserved these boundaries:

- no source code changes;
- no test changes;
- no helper changes;
- no smoke script changes;
- no generated type changes;
- no package script changes;
- no API/UI/extraction/crawler/LLM integration;
- no `supabase db push`;
- no migrations;
- no Supabase type regeneration;
- no arbitrary remote SQL;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no audit event writes;
- no live smoke rerun beyond the single explicitly approved execution.

The only database rows created were the exact smoke source, run, and candidate fixtures created by the approved smoke harness. They were cleaned up and verified by exact ID.

## 12. Known warnings

Known non-blocking runtime warning:

```text
MODULE_TYPELESS_PACKAGE_JSON
```

Known non-blocking build warning:

```text
Using edge runtime on a page currently disables static generation for that page
```

Neither warning affected the smoke result.

## 13. Risks and follow-up notes

Authenticated non-admin RLS coverage remains skipped because no approved non-admin test identity strategy exists.

Audit action compatibility exists at the schema constraint level, but this smoke intentionally did not write or verify audit events. Audit writes remain deferred to a separate approved phase.

Post-schema candidate staging source lineage is now verified through the service-role readback assertion for `discovery_source_id`.

## 14. Final verdict

Phase 9S post-schema Candidate Staging RLS smoke:

```text
Passed.
```

The live smoke verified staged candidate source lineage, anonymous/public RLS denial, no payload leakage, and exact-ID cleanup after the schema expansion and helper mapping changes.

## 15. Recommended next phase

Recommended next phase:

```text
Phase 9T — Post-Schema RLS Smoke Result Review / Documentation Commit
```

Scope:

- review this Phase 9S result document;
- commit the docs-only result if approved;
- keep API/UI/extraction/crawler/LLM integration deferred.
