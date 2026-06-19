# Phase 6Z — Authenticated Metadata-Only Fetch Smoke Test Plan

## Status

Phase 6Z planning draft.

This document is planning-only.

No endpoint integration is approved until this plan is reviewed and approved by Gemini.

## Current Foundation

Completed phases:

- Phase 6X — Fetch-only adapter implementation plan.
- Phase 6Y — Standalone metadata-only fetch adapter implementation.

Current committed adapter:

- lib/discovery-fetch-adapter.ts

Current committed tests:

- testing/discovery-fetch-adapter.test.mjs

Current safety state:

- The adapter exists as a standalone library.
- The claim endpoint does not call the adapter yet.
- The existing smoke script verifies fetch-disabled preflight behavior.
- No endpoint currently performs metadata-only fetch.

## Phase 6Z Goal

Define the safest authenticated smoke path for exercising the standalone metadata-only fetch adapter through the admin manual crawler flow.

Phase 6Z should prove that a single approved manual curated URL can move through:

1. Admin authentication.
2. CSRF protection.
3. Manual source validation.
4. Manual run creation.
5. Claim endpoint execution.
6. Existing request-plan preflight.
7. Metadata-only fetch adapter call.
8. Safe stats and audit recording.
9. Cleanup verification.

## Strict Scope

Phase 6Z may plan limited endpoint integration only for the existing admin manual claim endpoint:

- app/api/admin/discovery/runs/manual/claim/route.ts

Phase 6Z may plan a dedicated authenticated smoke script:

- scripts/smoke-discovery-metadata-fetch.mjs

Phase 6Z must not plan:

- Extraction.
- HTML parsing.
- LLM analysis.
- Scheduler, cron, or worker.
- Recursive crawling.
- Link following.
- Robots fetching.
- Sitemap fetching.
- Browser rendering.
- Screenshot capture.
- discovered_tools insert.
- public.tools insert.
- Automatic candidate approval.
- Public/non-admin access.

## Integration Principle

Endpoint integration must remain narrow.

The claim endpoint may call the metadata-only fetch adapter only after:

- Admin session is verified.
- CSRF is verified.
- Rate limit is checked.
- Run ID is validated.
- Run is atomically claimed from pending to running.
- Source is validated as manual_curated_urls.
- Existing request-plan preflight passes.
- Exactly one request plan is present.

If more than one URL/request plan exists, Phase 6Z should reject or remain unsupported.

## Execution Mode

Phase 6Z should introduce a new explicit execution mode for this limited smoke path.

Recommended stats fields:

    executor_mode: "metadata_fetch_smoke"
    dry_run: false
    execution_enabled: true
    execution_status: "metadata_fetch_smoke_completed"

Safety flags must remain:

    no_extraction_performed: true
    no_llm_analysis_performed: true
    no_candidates_inserted: true
    no_public_tools_inserted: true

The old dry-run path should remain available only if needed for existing Phase 6V smoke tests.

## Fetch Metadata Recording

If metadata-only fetch succeeds or safely fails, discovery_runs.stats may include:

    fetch_metadata: {
      requestedUrl: string,
      normalizedUrl: string,
      hostname: string,
      resolvedIp: string | null,
      resolvedIpFamily: 4 | 6 | null,
      dnsResolutionChecked: boolean,
      dnsRebindingProtectionApplied: boolean,
      connectionPinnedToResolvedIp: boolean,
      method: "GET",
      userAgent: string,
      timeoutMs: number,
      redirectLimit: 0,
      responseSizeLimitBytes: number,
      fetchStartedAt: string,
      fetchFinishedAt: string,
      durationMs: number,
      httpStatus: number | null,
      contentType: string | null,
      contentLengthHeader: string | null,
      bytesRead: number,
      responseTruncated: boolean,
      redirectLocation: string | null,
      errorCode: string | null
    }

Stats must not include:

- Raw HTML.
- Response body.
- Extracted title.
- Extracted description.
- Extracted tool name.
- Candidate data.
- Cookies.
- Auth headers.
- Admin session cookie.
- CSRF token.
- Environment variables.
- Secrets.

## Run Status Policy

For Phase 6Z:

Successful metadata-only fetch:

- run.status = completed
- execution_status = metadata_fetch_smoke_completed
- fetched_urls = 1
- processed_urls = 1
- extracted_candidates = 0
- inserted_discovered_tools = 0
- inserted_public_tools = 0

Safe adapter failure:

- run.status = failed
- execution_status = metadata_fetch_smoke_failed
- reason = adapter status
- fetched_urls = 0 unless a response was reached
- processed_urls = 1
- extracted_candidates = 0
- inserted_discovered_tools = 0
- inserted_public_tools = 0

Preflight rejection:

- keep existing Phase 6U behavior
- run.status = failed
- reason = rejected_preflight
- no_fetch_performed = true

## Audit Events

Phase 6Z may add event types:

- metadata_fetch_smoke_started
- metadata_fetch_smoke_completed
- metadata_fetch_smoke_failed

Audit metadata must include safety flags:

- no_extraction_performed = true
- no_llm_analysis_performed = true
- no_candidates_inserted = true
- no_public_tools_inserted = true

Audit metadata must not include raw response body, HTML, cookies, secrets, CSRF token, admin cookie, or extracted candidate data.

## Smoke Script Plan

Add a new script:

- scripts/smoke-discovery-metadata-fetch.mjs

The script should:

1. Load .env.local and .env.
2. Require AIFINDER_ADMIN_COOKIE.
3. Require Supabase service role env.
4. Create CSRF token.
5. Count discovered_tools before.
6. Count public.tools before.
7. Create one approved manual curated source.
8. Create one pending manual run with one approved URL.
9. Claim the run.
10. Assert run completed for valid fetch case.
11. Assert fetch_metadata exists.
12. Assert no raw body/HTML/extraction fields are present.
13. Assert no_extraction_performed is true.
14. Assert no_llm_analysis_performed is true.
15. Assert no_candidates_inserted is true.
16. Assert no_public_tools_inserted is true.
17. Assert discovered_tools count unchanged.
18. Assert public.tools count unchanged.
19. Assert audit events include metadata fetch start/completion.
20. Cleanup smoke data.

## Smoke URLs

Preferred valid smoke URL:

- https://example.com/

Reason:

- Stable public HTTPS target.
- Small response.
- Publicly routable domain.
- Good for metadata-only smoke.

Rejected smoke cases may include:

- https://100.64.0.1/aifinder-phase-6z-rejected
- a controlled unsupported content-type URL only if safely available
- a controlled redirect URL only if safely available

If reliable public unsupported-content or redirect URLs are not available, those cases should remain adapter unit tests only.

## Required Verification

Before commit, Phase 6Z implementation must run:

    node --import ./testing/register-typescript-test-loader.mjs testing/discovery-url-safety.test.mjs
    node --import ./testing/register-typescript-test-loader.mjs testing/discovery-request-plan.test.mjs
    node --import ./testing/register-typescript-test-loader.mjs testing/discovery-fetch-adapter.test.mjs
    ./node_modules/.bin/tsc --noEmit
    npm run check
    git diff --check

Authenticated smoke command should be:

    node scripts/smoke-discovery-metadata-fetch.mjs

## Required Forbidden Scans

Run:

    grep -RInE "\.from\(['\"]discovered_tools['\"]\)\.insert|\.from\(['\"]tools['\"]\)\.insert|openai|anthropic|gemini|generateText|generateObject|scheduler|cron" app/api/admin/discovery/runs/manual/claim/route.ts scripts/smoke-discovery-metadata-fetch.mjs lib/discovery-fetch-adapter.ts || true

Expected:

- No LLM calls.
- No scheduler/cron/worker logic.
- No discovered_tools insert.
- No public.tools insert.

## Required Gemini Gate

Before Phase 6Z implementation begins, Gemini must approve:

- Whether limited claim endpoint integration is allowed.
- Whether exactly-one-URL restriction is required.
- Whether the old dry-run smoke path must remain unchanged.
- Run status policy for adapter success/failure.
- Stats schema.
- Audit event names.
- Smoke URL selection.
- Smoke test assertions.
- Cleanup requirements.

## Phase 6Z Decision

Phase 6Z is not approved for implementation until Gemini approves this plan.

Still locked until approval:

- Endpoint modification.
- Real fetch through authenticated claim route.
- Smoke script creation.
- Any extraction.
- Any LLM analysis.
- Any scheduler/worker.
- Any discovered_tools insert.
- Any public.tools insert.
