# Phase 14C-B — Preview Artifact Trusted Source URL Design Gate

## 1. Status

Phase 14C-B is docs-only.

This phase does not draft or apply a migration.

This phase does not implement provider changes.

This phase does not implement backend activation.

This phase does not modify UI components, API routes, providers, helpers, tests, package files, migrations, generated types, Supabase schema, environment configuration, or deployment configuration.

This phase does not run database commands, remote SQL, Supabase commands, type generation, live staging, live smoke, POST requests, CSRF fetches, crawler execution, or LLM execution.

This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.

## 2. Current Confirmed State

Latest pushed commit before Phase 14C-B:

- `2998380 Document preview source URL decision`

Phase 14C-A decided that `candidateWebsiteUrl` must not be mapped into `sourceUrl`.

Phase 14C-A also blocked backend activation until trusted server-derived source URL data is available to the accepted candidate preview.

The current preview artifact table includes:

- `candidate_name`;
- `candidate_website_url`;
- `category_hint`;
- `pricing_hint`;
- `confidence_bucket`;
- `evidence_summary`;
- `source_evidence_locator`;
- `safety_flags`;
- `preview_generated_at`;
- source/run lineage columns.

The current preview artifact table does not include:

- `source_url`;
- `source_url_snapshot`;
- `source_evidence_url`.

The current `discovery_sources` table includes:

- `url`;
- `source_type`;
- `config`;
- source/run relationships.

The current candidate staging table requires source URL fields:

- `source_url`;
- `source_url_normalized`.

The current preview provider exposes no trusted source URL field in the accepted preview result.

Therefore, the backend live gate resolver must remain blocked.

## 3. Design Question

The design question is:

Should the trusted source URL used by the future live staging mapper be stored directly on the preview artifact, derived from the parent source/run at staging time, or both?

Options considered:

1. Store `source_url_snapshot` directly on preview artifact rows.
2. Derive source URL server-side from `public.discovery_sources.url` and run lineage.
3. Hybrid: store `source_url_snapshot` on preview artifacts and verify lineage against source/run metadata when available.

## 4. Decision

Phase 14C-B chooses the hybrid strategy.

Future preview artifacts should store:

- `source_url_snapshot`

The provider should use the stored snapshot as the canonical source URL for accepted previews.

The provider may also load the parent discovery source/run data for lineage validation and optional consistency checks.

The provider must not rely solely on a live join to `discovery_sources.url` at staging time.

## 5. Why Hybrid Is Safest

Stored snapshot only is better than deriving at staging time because:

- it preserves the exact source URL value reviewed by the admin;
- it avoids time-of-check to time-of-use drift if a source row changes later;
- it improves auditability;
- it makes accepted preview artifacts self-contained enough for review and staging;
- it keeps candidate destination URL separate from discovery source URL.

Deriving from parent source only is weaker because:

- `discovery_sources.url` may be nullable;
- source rows may be edited;
- source types may represent a collection, API, manual list, webhook, or scraper rather than one exact evidence URL;
- the source row URL may not always equal the specific evidence URL used to generate the preview;
- staging would become dependent on mutable state not shown in the accepted preview.

Hybrid is safest because:

- the preview artifact carries the exact reviewed source URL snapshot;
- the provider still verifies the source/run lineage;
- future consistency checks can detect source drift without replacing the reviewed snapshot;
- backend activation can map to `CandidateExtractionMapperInput.sourceUrl` without trusting the client.

## 6. Future Column Recommendation

A future schema phase should add a column to `public.discovery_candidate_preview_artifacts`:

```sql
source_url_snapshot text
```

The column should be nullable for non-reviewable artifacts but required when `preview_status = 'reviewable'`.

The exact migration should be drafted in a later phase and reviewed separately.

No migration is drafted in Phase 14C-B.

## 7. Future Constraint Recommendation

A future migration should add constraints equivalent to:

- `source_url_snapshot` length is between 1 and 2048 when present;
- `source_url_snapshot` must match `^https://[^[:space:]]+$` when present;
- reviewable artifacts require `source_url_snapshot`;
- reviewable artifacts still require `candidate_name`;
- reviewable artifacts still require `candidate_website_url`;
- reviewable artifacts still require `source_evidence_locator`;
- reviewable artifacts still require `preview_generated_at`.

The future provider must perform stronger URL validation than the database regex, including rejecting:

- localhost;
- loopback IPs;
- private network IP ranges;
- missing hostname;
- non-HTTPS;
- unsafe payload strings;
- raw HTML;
- raw LLM output;
- service-role or signed URL secrets;
- cookies;
- CSRF values;
- stack traces;
- SQL errors.

## 8. Future Schema Version Recommendation

Adding `source_url_snapshot` changes the accepted preview contract.

The future schema/provider phase should decide whether to update:

- `candidate_preview_artifact.v1`

to a new version such as:

- `candidate_preview_artifact.v2`

Recommendation:

- use a new schema version for reviewable artifacts that require `source_url_snapshot`;
- keep old v1 artifacts unsupported for backend activation;
- allow the provider to reject old reviewable artifacts as stale or unsupported until they are regenerated.

The exact version string must be reviewed before implementation.

## 9. Future Provider Output Contract

A future accepted preview should include:

```ts
sourceUrlSnapshot: string;
```

The accepted preview result must not be accepted unless:

- `sourceUrlSnapshot` is present;
- it is a safe HTTPS URL;
- it is not localhost;
- it is not private network;
- it is not copied from client input;
- it is not copied from `candidateWebsiteUrl`;
- it belongs to the same source/run lineage as the artifact.

The provider should still expose:

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

## 10. Future Provider Dependency Recommendation

The provider should add a dependency capable of loading the discovery source row for lineage and optional consistency checks.

Possible dependency shape:

```ts
loadDiscoverySource(discoverySourceId: string): Promise<DiscoverySourceRow | null>
```

The minimum source row fields should be:

- `id`;
- `url`;
- `source_type`;
- `updated_at`.

The provider must not expose raw source `config` in the preview result.

The provider must not expose raw source metadata in the preview result.

The provider must not expose service-role details or internal errors.

## 11. Source Drift Policy

A future provider should treat the stored snapshot as canonical for the reviewed preview.

If `discovery_sources.url` exists and differs from `source_url_snapshot`, the provider should not silently replace the snapshot.

Recommended behavior:

- reject the preview as stale or blocked;
- include a safe rejection code;
- require preview regeneration.

Reason:

- the admin should stage exactly what was reviewed;
- source URL drift can indicate a changed source context;
- replacing the snapshot during staging would create TOCTOU risk.

## 12. Source-Type Policy

The source URL snapshot should represent the exact source URL or evidence URL used to produce the candidate preview.

For `manual` sources:

- use the server-validated source URL that produced the candidate preview;
- do not infer from candidate website.

For `rss`, `api`, `scraper`, or `webhook` sources:

- use the specific evidence/source URL captured by the preview generation path when available;
- if only a collection-level URL exists, the provider must decide whether it is sufficient;
- if insufficient, the preview must remain non-reviewable for live staging.

## 13. Relationship To `source_evidence_locator`

`source_evidence_locator` remains a short bounded locator for review context.

It is not a replacement for `source_url_snapshot`.

The future provider should use both:

- `source_url_snapshot` for mapper `sourceUrl`;
- `source_evidence_locator` for safe human-readable evidence context.

The two fields should not be collapsed.

## 14. Future Mapper Contract

A future backend live staging resolver may map only server-revalidated preview data.

Future mapping must use:

- `sourceUrl: preview.sourceUrlSnapshot`;
- `candidateName: preview.candidateName`;
- `candidateWebsiteUrl: preview.candidateWebsiteUrl`;
- `sourceEvidenceLocator: preview.sourceEvidenceLocator`;
- `candidateCategoryHint: preview.categoryHint`;
- `candidatePricingHint: preview.pricingHint`;
- `confidenceBucket: preview.confidenceBucket` only if compatible with mapper allowlist;
- `evidenceSummary: preview.evidenceSummary`;
- `discoverySourceId: preview.discoverySourceId`;
- `discoveryRunId: preview.discoveryRunId`;
- `auditCorrelationId: preview.auditCorrelationId`.

Future mapping must not use:

- client-provided source URL;
- client-provided candidate URL;
- client-provided candidate name;
- client-provided preview payload;
- client-provided live gate;
- raw preview artifact rows;
- raw source config;
- raw HTML;
- raw LLM output.

## 15. Backend Activation Blocker Remains

Phase 14C-B does not unblock backend live gate resolver implementation.

Backend activation remains blocked until all of the following are complete:

1. schema/source URL implementation plan is reviewed;
2. migration is drafted and reviewed if needed;
3. migration is applied only with exact approval if needed;
4. generated types are updated only with exact approval if needed;
5. provider output exposes `sourceUrlSnapshot`;
6. provider tests prove safe source URL handling;
7. accepted preview rejects missing/unsafe/stale/drifted source URL;
8. Gemini approves resuming backend resolver implementation.

## 16. Future Test Requirements

Future schema/provider implementation tests should prove:

- accepted preview includes `sourceUrlSnapshot`;
- missing `source_url_snapshot` rejects reviewable preview;
- non-HTTPS source URL rejects preview;
- localhost source URL rejects preview;
- private network source URL rejects preview;
- unsafe payload source URL rejects preview;
- source URL copied from candidate website is not accepted by default;
- source/run mismatch rejects preview;
- source drift rejects or marks preview stale;
- old schema versions without source URL are unsupported for backend activation;
- no raw source config is returned;
- no raw DB row is returned;
- no SQL/stack/service-role details are returned.

## 17. Future Phase Sequence

Recommended next phases:

1. Phase 14C-C — Preview Artifact Trusted Source URL Schema / Provider Plan
   - docs-only;
   - define exact migration shape, schema version policy, provider dependency, and test matrix;
   - no migration draft unless separately approved.

2. Phase 14C-D — Preview Artifact Trusted Source URL Migration Draft
   - migration draft only;
   - no apply;
   - no type generation;
   - no provider changes.

3. Phase 14C-E — Trusted Source URL Migration Apply / Type Generation Gate
   - exact approval required before apply/typegen.

4. Phase 14C-F — Trusted Source URL Provider Implementation
   - provider/types/tests;
   - no backend activation.

5. Phase 14D — Backend Preview-Revalidated Live Gate Resolver Implementation
   - only after trusted source URL provider support exists.

## 18. Stop Conditions

Future work must stop if it requires:

- mapping `candidateWebsiteUrl` to `sourceUrl`;
- accepting client-provided source URL;
- deriving source URL from client preview payload;
- trusting UI state;
- skipping source URL snapshot;
- silently replacing a reviewed source URL snapshot with a mutated source row URL;
- making old preview artifacts live-staging eligible without source URL;
- backend activation before provider support;
- UI activation;
- POST wiring;
- CSRF fetch;
- candidate staging;
- live smoke;
- DB apply without exact approval;
- type generation without exact approval;
- crawler execution;
- LLM execution;
- public.tools writes;
- discovered_tools writes.

## 19. Phase 14C-B Verification Plan

Run:

- `git diff --check`;
- `npm run check`;
- `git diff --stat`;
- `git diff --name-only`;
- `git status --short --branch`.

Expected changed file:

- `docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md`

Expected forbidden changes:

- no UI component files;
- no API route files;
- no provider files;
- no helper files;
- no test files;
- no package files;
- no migration files;
- no generated type files.

## 20. Commit Readiness Criteria

Phase 14C-B is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only this Phase 14C-B docs file is staged;
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
