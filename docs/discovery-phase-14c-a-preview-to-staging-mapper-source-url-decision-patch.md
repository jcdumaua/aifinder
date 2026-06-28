# Phase 14C-A — Preview-to-Staging Mapper Source URL Decision Patch

## 1. Status

Phase 14C-A is docs-only.

This phase does not implement backend activation.

This phase does not modify UI components, API routes, providers, helpers, tests, package files, migrations, generated types, Supabase schema, environment configuration, or deployment configuration.

This phase does not run database commands, remote SQL, Supabase commands, type generation, live staging, live smoke, POST requests, CSRF fetches, crawler execution, or LLM execution.

This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.

## 2. Why This Patch Exists

Phase 14C inspection found an implementation blocker before backend activation code.

The existing `CandidateExtractionMapperInput` requires:

- `sourceUrl`;
- `candidateName`;
- `candidateWebsiteUrl`;
- `discoveryRunId`;
- `discoverySourceId`.

The current safe preview result provides:

- `candidateName`;
- `candidateWebsiteUrl`;
- `categoryHint`;
- `pricingHint`;
- `confidenceBucket`;
- `evidenceSummary`;
- `sourceEvidenceLocator`;
- `discoverySourceId`;
- `discoveryRunId`;
- `auditCorrelationId`.

The current preview result does not provide a trusted source URL suitable for `CandidateExtractionMapperInput.sourceUrl`.

Therefore, backend live staging activation must not proceed until the source URL policy is explicitly resolved.

## 3. Decision

Do not map `candidateWebsiteUrl` into `sourceUrl`.

That shortcut would blur two separate concepts:

- the candidate tool website;
- the source URL or evidence URL from which the candidate was discovered or previewed.

Phase 14C-A adopts the following policy:

- Current state: backend activation remains blocked while the preview lacks trusted source URL data.
- Future target: add a trusted preview source URL field through a separate schema/provider design and implementation path before backend live staging resolver code is allowed.
- Backend resolver implementation must not begin until that trusted source URL is available from server-revalidated preview data.

This is effectively Option B as the target design and Option C as the current safety posture.

## 4. Rejected Option

Rejected option:

- Use `candidateWebsiteUrl` as `sourceUrl`.

Reason:

- it weakens lineage;
- it hides whether the candidate came from a curated source, static evidence source, metadata fetch, or another acquisition source;
- it may make future audits ambiguous;
- it can make the staging mapper appear to have source evidence that is actually only the candidate destination URL;
- it increases risk of accidental evidence/candidate conflation.

## 5. Required Future Trusted Source URL

A future preview artifact/provider phase should introduce a trusted field such as:

- `source_url`;
- or `source_url_snapshot`;
- or `source_evidence_url`.

Preferred field name:

- `source_url_snapshot`

Rationale:

- it communicates that the preview carries the source URL value at preview-generation time;
- it avoids implying the source row is mutable or being joined live by the UI;
- it supports future audit review;
- it separates source evidence from candidate destination URL.

The final field name must be reviewed before schema implementation.

## 6. Required Future Source URL Contract

The future trusted source URL must satisfy all of the following:

1. It is server-derived.
2. It is stored or loaded server-side.
3. It is not supplied by the client.
4. It is not copied from `candidateWebsiteUrl`.
5. It is HTTPS unless a separately approved internal fixture exception is defined.
6. It is not localhost.
7. It is not a private network URL.
8. It is not raw HTML.
9. It is not raw LLM output.
10. It is not a service-role or signed URL secret.
11. It is bounded in length.
12. It can be safely passed to the existing mapper as `sourceUrl`.
13. It can be audited alongside `sourceEvidenceLocator`.

## 7. Required Future Provider Contract

Before backend activation, the preview provider must expose trusted source URL data in the accepted preview result.

A future accepted preview should include something equivalent to:

```ts
sourceUrlSnapshot: string;
```

The provider must reject or withhold accepted preview status if the source URL is missing or unsafe.

The provider must ensure that the source URL belongs to the same source/run lineage as the preview artifact.

The provider must not rely on the client to provide or correct source URL data.

## 8. Required Future Mapper Contract

Only server-revalidated preview data may be converted to `CandidateExtractionMapperInput`.

Future mapping must use:

- `sourceUrl` from trusted preview source URL data;
- `candidateName` from server-revalidated preview;
- `candidateWebsiteUrl` from server-revalidated preview;
- `sourceEvidenceLocator` from server-revalidated preview;
- `discoverySourceId` from server-revalidated preview/invocation match;
- `discoveryRunId` from server-revalidated preview/invocation match;
- `auditCorrelationId` from strict preview/request match;
- optional category/pricing/confidence fields only if already allowlisted.

Future mapping must not use:

- client-submitted candidate name;
- client-submitted candidate URL;
- client-submitted source URL;
- client-submitted preview data;
- raw preview artifact row;
- raw HTML;
- raw LLM output.

## 9. Required Future Rejection Behavior

Backend activation must reject live staging if trusted source URL data is:

- missing;
- empty;
- unsafe;
- non-HTTPS;
- localhost;
- private network;
- too long;
- mismatched to run/source lineage;
- only inferable from `candidateWebsiteUrl`;
- only present in a client request body.

A missing trusted source URL should fail closed before any staging gate is created.

## 10. Required Future Schema / Provider Path

Recommended next design path:

1. Design source URL addition to preview artifacts.
2. Review whether the source URL should be stored directly on preview artifact rows or derived server-side from discovery source/run metadata.
3. If a schema change is required, draft migration only after Gemini approval.
4. Apply migration/typegen only with exact approval.
5. Update provider output and tests.
6. Only then resume backend live gate resolver implementation.

## 11. No Change To Current Safety State

This patch does not change:

- the disabled UI scaffold;
- the read-only candidate preview route;
- the preview provider;
- the invocation helper;
- the invoke route;
- the candidate staging helper;
- any table schema;
- any generated types.

Live staging remains unavailable.

The UI must continue to pass:

- `isLiveStagingAvailable={false}`

No POST path is added.

No CSRF fetch is added.

No DB write path is added.

## 12. Updated Future Phase Sequence

Recommended revised sequence:

1. Phase 14C-B — Preview Artifact Trusted Source URL Design Gate
   - docs-only;
   - decide stored vs derived source URL strategy;
   - no migration.

2. Phase 14C-C — Preview Artifact Trusted Source URL Schema / Provider Plan
   - docs-only or migration-draft-only depending on decision;
   - no apply without exact approval.

3. Phase 14C-D — Trusted Source URL Provider Implementation
   - update provider/types/tests only after schema/type readiness;
   - no backend activation.

4. Phase 14D — Backend Preview-Revalidated Live Gate Resolver Implementation
   - backend route/helper/test phase;
   - only after trusted source URL is available.

5. Phase 14E — Backend Activation Verification Gate
   - route/helper verification;
   - no UI activation.

6. Phase 14F — Admin UI Live Staging Activation Plan
   - docs-only.

7. Phase 14G — Admin UI Live Staging Activation Implementation
   - only if approved.

8. Phase 14H — Live Staging Smoke Execution Gate
   - exact approval phrase required.

## 13. Phase 14C-A Verification Plan

Run:

- `git diff --check`;
- `npm run check`;
- `git diff --stat`;
- `git diff --name-only`;
- `git status --short --branch`.

Expected changed file:

- `docs/discovery-phase-14c-a-preview-to-staging-mapper-source-url-decision-patch.md`

Expected forbidden changes:

- no UI component files;
- no API route files;
- no provider files;
- no helper files;
- no test files;
- no package files;
- no migration files;
- no generated type files.

## 14. Commit Readiness Criteria

Phase 14C-A is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only this Phase 14C-A docs file is staged;
- no UI is changed;
- no route is changed;
- no provider/helper is changed;
- no tests are changed;
- no migration is changed;
- no generated types are changed;
- no live commands are run;
- no DB commands are run;
- no POST requests are sent;
- no CSRF fetch occurs;
- no live staging occurs.
