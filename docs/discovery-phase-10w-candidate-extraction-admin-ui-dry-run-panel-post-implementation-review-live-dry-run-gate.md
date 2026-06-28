# Discovery Phase 10W — Candidate Extraction Admin UI Dry-Run Panel Post-Implementation Review / Live Dry-Run Gate

## 1. Title and Phase Summary

Phase 10W is a docs-only post-implementation review and live dry-run gate for the Candidate Extraction admin UI dry-run panel implemented in Phase 10V.

This phase reviews the implemented panel, records the completed local/manual UI QA evidence, and defines the approval boundary for any future live UI-triggered dry-run request.

This phase does not implement code, modify tests, change API routes, change helpers, run a real UI dry-run request, rerun live verification, run live smoke, run database commands, or add production wiring.

## 2. Current State Recap

Phase 10V implemented the admin dry-run panel.

Latest pushed commit:

```text
7695d90 Add extraction dry-run admin panel
```

Files implemented:

```text
components/admin/discovery/discovery-runs-table.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
testing/discovery-candidate-extraction-dry-run-panel.test.mjs
```

Current implemented boundary:

- The panel is wired into the existing Discovery Runs expanded review context.
- The panel uses trusted `run.id` and `run.source_id` from the existing Discovery Runs data.
- Missing `source_id` blocks invocation by disabling the dry-run action.
- The panel is dry-run-only.
- The panel does not enable `dry_run: false`.
- The panel does not add public UI.
- The panel does not add crawler, LLM, live executor, scheduled, background, or production write wiring.

## 3. Implementation Review Summary

Phase 10V implemented the required safety controls:

- The request builder always sends `dry_run: true`.
- The UI never sends `dry_run: false`.
- The UI never collects or sends `invoked_by_admin_user_id`.
- The request uses fixed schema version `candidate_extraction_invocation.v1`.
- The request uses bounded `max_candidates: 1`.
- The panel generates a valid UUID `audit_correlation_id` client-side.
- Human-readable marker text remains in `invocation_reason`, not in `audit_correlation_id`.
- The panel requires a confirmation step before a final request can be sent.
- The panel performs no automatic retries.
- The panel performs no polling.
- The panel performs no scheduled or background triggering.
- The panel does not add crawler automation.
- The panel does not add LLM automation.
- The panel does not add public UI.
- The panel does not add production write wiring.
- The panel renders only sanitized response summary fields.
- The response normalizer filters unsafe raw payload, raw HTML, secret-like, token-like, service-role, stack, credential, cookie, CSRF, and Supabase-like text.

## 4. Manual UI QA Summary

Phase 10V manual/browser UI QA completed before this gate.

Responsive QA results:

- Desktop `1440x1000`: passed.
- Tablet `768x1024`: passed.
- Mobile `390x844`: passed.

Manual UI QA confirmed:

- The panel appeared in the intended expanded Discovery Runs review context.
- The “Dry run only” badge was visible.
- Source/run context was visible.
- The confirmation step appeared before submit.
- The final confirmation button was not clicked.
- No POST to `/api/admin/discovery/candidate-extraction/invoke` was sent.
- `totalInvocationPosts: 0`.
- Missing `source_id` disabled invocation.
- No clipping or horizontal overflow appeared on desktop, tablet, or mobile.
- No raw payload appeared.
- No raw HTML appeared.
- No secret-like text appeared.
- No stack trace appeared.
- No service-role detail appeared.
- No environment value appeared.
- No DB credential appeared.

The QA run used mocked admin API responses for session, runs, sources, CSRF, submissions, and audit logs so the browser inspection did not require live DB reads or writes.

## 5. Automated Verification Summary

Phase 10V verification completed with:

```text
node testing/discovery-candidate-extraction-dry-run-panel.test.mjs: passed, 6/6
node testing/discovery-candidate-extraction-invocation-route.test.mjs: passed, 12/12
node testing/discovery-candidate-extraction-invocation.test.mjs: passed, 10/10
npm run check: passed
node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs: safe opt-out, skipped
npm run smoke:discovery-candidate-staging:rls: safe opt-out, skipped
git diff --check: passed
```

Safe opt-out smoke confirmations:

- `AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1` was not set.
- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.
- No environment values were loaded by either smoke command.
- No DB client was created by either smoke command.
- No DB operation was performed by either smoke command.

## 6. Live UI Dry-Run Gate Decision

The system is ready to define a future live UI dry-run verification procedure.

The system is not yet authorized to run that live UI dry-run.

No live UI invocation should be performed until James gives the exact approval phrase:

```text
Approve run Phase 10W live UI dry-run verification
```

Until that explicit approval is given:

- do not click the final dry-run confirmation button against the real route;
- do not send a real POST to `/api/admin/discovery/candidate-extraction/invoke`;
- do not rerun live route verification;
- do not run live smoke;
- do not run DB commands or remote SQL;
- do not enable production writes.

## 7. Proposed Future Live UI Dry-Run Verification Procedure

If James later approves the future live UI dry-run verification with the exact approval phrase, use this bounded procedure:

1. Use the local app/admin UI in a controlled environment.
2. Use one existing trusted Discovery Run row with both `run.id` and `run.source_id`.
3. Open the existing Discovery Runs admin area.
4. Expand the selected Discovery Runs review context.
5. Confirm the dry-run panel shows the expected source/run context.
6. Confirm the panel displays “Dry run only” and no-production-write copy.
7. Click the prepare action to show the confirmation step.
8. Only after the exact approval phrase, click the final dry-run confirmation once.
9. Verify one and only one POST is sent to:

```text
/api/admin/discovery/candidate-extraction/invoke
```

10. Verify the request contains:

- `dry_run: true`;
- `max_candidates: 1`;
- fixed `schema_version: "candidate_extraction_invocation.v1"`;
- valid UUID `audit_correlation_id`;
- no `invoked_by_admin_user_id`;
- no `dry_run: false`.

11. Verify the response is safe and sanitized.
12. Verify the UI shows safe summary fields only.
13. Verify no raw payload, HTML, secrets, stack traces, service-role details, environment values, DB credentials, cookies, tokens, or CSRF values appear.
14. Verify no `public.tools` writes occur.
15. Verify no `discovered_tools` writes occur.
16. Verify no production publishing occurs.
17. Verify no crawler automation occurs.
18. Verify no LLM automation occurs.
19. Verify no repeated requests, retries, polling, scheduled jobs, or background execution occur.

If the selected Discovery Run lacks `source_id`, stop. Do not create fixture rows or manually enter source/run IDs in this live UI verification phase.

## 8. Future Live UI Dry-Run Limits

The future live UI dry-run verification must obey these limits:

- exactly one final invocation click;
- no repeated clicking;
- no retry loop;
- no live smoke environment variables;
- no production write enablement;
- no `dry_run: false`;
- no route changes;
- no helper changes;
- no DB commands unless separately approved as read-only verification;
- no candidate row creation outside whatever the dry-run route itself safely reports;
- no discovery source row creation;
- no discovery run row creation;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no audit event writes;
- no public publishing.

Because the UI route is dry-run-only, the expected safe result remains zero staged candidates and safe no-write confirmations.

## 9. Post-Live-Verification Documentation Requirement

After any future approved live UI dry-run verification, create a separate result documentation phase.

Recommended future phase after approved live UI dry-run:

```text
Phase 10X — Candidate Extraction Admin UI Live Dry-Run Verification Result Documentation
```

The result document should include:

- approval phrase;
- route and UI panel tested;
- selected source/run context summary without secrets;
- timestamp;
- request summary without cookies, tokens, CSRF values, or raw credentials;
- response summary;
- assertion pass/fail list;
- no-write confirmation evidence;
- final repo status;
- whether follow-up fixes are required.

## 10. Optional Follow-Up Item

Minor optional UI follow-up from QA:

```text
Make the missing-context idle status copy explicitly say source context is required before button click.
```

This is not a blocker for the live dry-run gate because missing `source_id` already disables invocation and displays the missing source context. It may be handled in a future polish phase if desired.

## 11. Non-Goals

Phase 10W explicitly forbids:

- UI implementation;
- source code changes;
- test changes;
- API route changes;
- helper changes;
- package changes;
- migrations;
- generated type changes;
- dependency changes;
- live UI invocation;
- live verification rerun;
- live smoke;
- DB commands;
- remote SQL;
- `supabase db push`;
- candidate row creation;
- discovery source row creation;
- discovery run row creation;
- `public.tools` writes;
- `discovered_tools` writes;
- audit event writes;
- crawler automation;
- LLM automation;
- live executor wiring;
- production write wiring;
- public UI changes;
- homepage changes;
- public submit flow changes;
- enabling `dry_run: false`;
- commits;
- pushes.

## 12. Recommended Next Step

Recommended next step: Gemini review of Phase 10W.

If Gemini approves and James approves commit/push, the next operational step can be the exact approval-gated live UI dry-run verification:

```text
Approve run Phase 10W live UI dry-run verification
```

Do not run the live UI dry-run verification in Phase 10W.
