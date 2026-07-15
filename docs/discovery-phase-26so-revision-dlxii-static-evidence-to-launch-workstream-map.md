# Phase 26SO — Static Evidence to Launch Workstream Map

## Bound baseline

`c454e62f9783e61e30d193ff7f84e6ab6792990a`

## Workstream 1 — Operational reactivation readiness

Static evidence candidates include:

```text
app/api/admin/audit-logs/route.ts
app/api/admin/csrf/route.ts
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/sources/route.ts
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts
app/api/admin/homepage-control/drafts/[id]/publish/route.ts
app/api/admin/homepage-control/drafts/[id]/route.ts
app/api/admin/homepage-control/drafts/route.ts
app/api/admin/login/route.ts
app/api/admin/logout/route.ts
app/api/admin/session/route.ts
app/api/admin/submissions/route.ts
app/api/admin/tools/route.ts
app/api/admin/upload-logo/route.ts
app/api/homepage-control/published/route.ts
app/api/submit-tool/route.ts
app/api/upload-logo/route.ts
app/manifest.ts
docs/archive-index/discovery-read-only-runtime-validation-harness-static-evidence-archive-index.md
docs/discovery-phase-10h-candidate-extraction-staging-pipeline-smoke-gate-plan.md
docs/discovery-phase-10l-candidate-extraction-staging-pipeline-live-smoke-result.md
docs/discovery-phase-10p-candidate-extraction-production-invocation-api-route-action-design.md
docs/discovery-phase-10r-candidate-extraction-invocation-api-route-live-verification-gate.md
docs/discovery-phase-10s-candidate-extraction-invocation-api-route-live-verification-result.md
docs/discovery-phase-10t-candidate-extraction-invocation-route-result-review-admin-ui-wiring-readiness-gate.md
docs/discovery-phase-13g-read-only-candidate-preview-api-route-implementation-plan.md
docs/discovery-phase-14f-backend-preview-revalidated-route-resolver-wiring-plan.md
docs/discovery-phase-14j-controlled-live-staging-smoke-gate.md
docs/discovery-phase-14k-e-controlled-live-staging-smoke-result.md
docs/discovery-phase-14w-candidate-staging-queue-api-read-route-design.md
docs/discovery-phase-14x-candidate-staging-queue-api-read-route-implementation-plan.md
docs/discovery-phase-14z-candidate-staging-queue-api-read-route-post-implementation-review.md
docs/discovery-phase-19l-candidate-decision-live-mutation-smoke-result.md
docs/discovery-phase-19t-candidate-decision-mutation-api-live-smoke-gate.md
docs/discovery-phase-19v-candidate-decision-mutation-api-live-smoke-result.md
docs/discovery-phase-21a-candidate-decision-live-smoke-plan-approval-gate.md
docs/discovery-phase-21b-candidate-decision-live-smoke-readonly-preflight-result.md
docs/discovery-phase-21f-candidate-decision-live-smoke-execution-result.md
docs/discovery-phase-21g-candidate-decision-live-smoke-result-review-cleanup-planning-gate.md
docs/discovery-phase-22al-u-r-helper-import-readiness-smoke-recovery-server-only-package-addition-gate.md
docs/discovery-phase-25dg-admin-only-no-write-route-static-inspection-design-gate.md
docs/discovery-phase-25dh-admin-only-no-write-route-static-inspection-approval-gate.md
docs/discovery-phase-25dj-admin-only-no-write-route-static-inspection-result-review-gate.md
docs/discovery-phase-25dk-read-only-candidate-route-runtime-validation-scope-decision-planning-gate.md
docs/discovery-phase-25dl-candidate-preview-route-deep-static-source-review-design-gate.md
docs/discovery-phase-25dm-candidate-preview-route-deep-static-source-review-approval-gate.md
docs/discovery-phase-25do-candidate-preview-route-deep-static-source-review-result-review-gate.md
docs/discovery-phase-25dp-candidate-preview-route-non-runtime-ready-remediation-scope-decision-planning-gate.md
docs/discovery-phase-25dq-candidate-preview-route-mutation-marker-attribution-design-gate.md
docs/discovery-phase-25dr-candidate-preview-route-mutation-marker-attribution-approval-gate.md
docs/discovery-phase-25dt-candidate-preview-route-mutation-marker-attribution-result-review-gate.md
docs/discovery-phase-25du-candidate-preview-route-source-remediation-design-gate.md
docs/discovery-phase-25dv-candidate-preview-route-read-only-auth-dependency-implementation-plan.md
docs/discovery-phase-25dy-candidate-preview-route-read-only-auth-dependency-verification-result-review-gate.md
docs/discovery-phase-25dz-candidate-preview-route-read-only-auth-dependency-post-verification-planning-gate.md
docs/discovery-phase-25e-read-only-runtime-verification-script-planning.md
docs/discovery-phase-25ea-candidate-preview-route-read-only-auth-dependency-runtime-validation-planning-gate.md
docs/discovery-phase-25eb-candidate-preview-route-read-only-auth-dependency-runtime-validation-harness-design-gate.md
docs/discovery-phase-25ec-candidate-preview-route-read-only-auth-dependency-source-only-harness-implementation-planning-gate.md
docs/discovery-phase-25ef-candidate-preview-route-read-only-auth-dependency-source-only-harness-execution-result-review-gate.md
docs/discovery-phase-25eg-candidate-preview-route-read-only-auth-dependency-post-harness-planning-gate.md
docs/discovery-phase-25eh-candidate-preview-route-read-only-auth-dependency-runtime-route-validation-decision-gate.md
docs/discovery-phase-25ei-candidate-preview-route-read-only-auth-dependency-source-only-validation-closure-gate.md
docs/discovery-phase-25ej-discovery-admin-route-read-only-dependency-inventory-planning-gate.md
docs/discovery-phase-25ek-discovery-admin-route-read-only-dependency-inventory-design-gate.md
docs/discovery-phase-25el-discovery-admin-route-read-only-dependency-inventory-implementation-planning-gate.md
docs/discovery-phase-25eo-discovery-admin-route-read-only-dependency-inventory-result-review-gate.md
docs/discovery-phase-25ep-discovery-admin-route-read-only-dependency-inventory-follow-up-review-planning-gate.md
docs/discovery-phase-25eq-discovery-admin-route-read-only-dependency-inventory-follow-up-review-gate.md
docs/discovery-phase-25er-discovery-admin-route-read-only-dependency-inventory-detailed-output-preservation-planning-gate.md
docs/discovery-phase-25es-discovery-admin-route-read-only-dependency-inventory-detailed-output-preservation-decision-gate.md
docs/discovery-phase-25et-discovery-admin-route-read-only-dependency-inventory-detailed-output-rerun-planning-gate.md
docs/discovery-phase-25ev-discovery-admin-route-read-only-dependency-inventory-detailed-output-result-review-gate.md
docs/discovery-phase-25ew-discovery-admin-route-read-only-dependency-inventory-detailed-output-classification-planning-gate.md
docs/discovery-phase-25ex-discovery-admin-route-read-only-dependency-inventory-detailed-output-classification-review-gate.md
docs/discovery-phase-25ey-discovery-admin-route-read-only-dependency-inventory-classification-result-review-follow-up-planning-gate.md
docs/discovery-phase-25fa-read-only-runtime-validation-preconditions-planning-gate.md
docs/discovery-phase-25fb-read-only-runtime-validation-harness-design-gate.md
docs/discovery-phase-25fc-read-only-runtime-validation-harness-implementation-planning-gate.md
docs/discovery-phase-25fe-discovery-admin-route-read-only-dependency-inventory-detailed-output-preservation-decision-gate.md
docs/discovery-phase-25ff-read-only-runtime-validation-harness-manifest-population-planning-gate.md
docs/discovery-phase-25fg-read-only-runtime-validation-harness-manifest-population-gate.md
docs/discovery-phase-25fh-read-only-runtime-validation-harness-manifest-entry-selection-planning-gate.md
docs/discovery-phase-25fi-read-only-runtime-validation-harness-manifest-entry-selection-gate.md
docs/discovery-phase-25fj-read-only-runtime-validation-harness-zero-entry-selection-result-review-gate.md
docs/discovery-phase-25fk-read-only-runtime-validation-harness-static-evidence-table-planning-gate.md
```

Static evidence can support scope definition and dependency mapping. It cannot authorize runtime reactivation.

Status: `STATIC_CANDIDATES_IDENTIFIED_RUNTIME_EVIDENCE_MISSING`

## Workstream 2 — End-to-end production validation

Static evidence candidates include:

```text
playwright.accessibility.config.ts
playwright.config.ts
testing/accessibility-qa.spec.ts
testing/responsive-qa.spec.ts
```

Existing test files and scripts require later review for coverage, isolation, and execution safety.

Status: `STATIC_CANDIDATES_IDENTIFIED_EXECUTION_EVIDENCE_MISSING`

## Workstream 3 — Security hardening

Static evidence candidates include:

```text
AI_PROMPTS/security-review-template.md
app/admin-login/layout.tsx
app/admin-login/page.tsx
app/admin/analytics/page.tsx
app/admin/discovered-tools/page.tsx
app/admin/discovery/page.tsx
app/admin/discovery/tools/[id]/page.tsx
app/admin/discovery/tools/page.tsx
app/admin/homepage-control/[id]/edit/page.tsx
app/admin/homepage-control/[id]/page.tsx
app/admin/homepage-control/[id]/preview/page.tsx
app/admin/homepage-control/page.tsx
app/admin/layout.tsx
app/admin/moderation/page.tsx
app/admin/notifications/page.tsx
app/admin/page.tsx
app/admin/security/page.tsx
app/admin/settings/page.tsx
app/admin/tools/page.tsx
app/api/admin/audit-logs/route.ts
app/api/admin/csrf/route.ts
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/sources/route.ts
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts
app/api/admin/homepage-control/drafts/[id]/publish/route.ts
app/api/admin/homepage-control/drafts/[id]/route.ts
app/api/admin/homepage-control/drafts/route.ts
app/api/admin/login/route.ts
app/api/admin/logout/route.ts
app/api/admin/session/route.ts
app/api/admin/submissions/route.ts
app/api/admin/tools/route.ts
app/api/admin/upload-logo/route.ts
components/admin/admin-dashboard-client.tsx
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts
components/admin/discovery/discovery-queue-table.tsx
components/admin/discovery/discovery-runs-table.tsx
components/admin/discovery/discovery-sources-panel.tsx
components/admin/discovery/discovery-tool-detail.tsx
components/admin/discovery/manual-metadata-fetch-results-review.tsx
components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx
components/admin/discovery/manual-static-html-evidence-results-review.tsx
components/admin/homepage-control-create-draft-button.tsx
components/admin/homepage-control-draft-editor.tsx
components/admin/homepage-control-mark-preview-button.tsx
components/admin/homepage-control-preview-checklist.tsx
components/admin/homepage-control-publish-button.tsx
components/admin/homepage-preview-banner.tsx
components/empty-states/no-pending-admin-items-empty-state.tsx
docs/archive-index/discovery-read-only-runtime-validation-harness-static-evidence-archive-index.md
docs/discovery-phase-10t-candidate-extraction-invocation-route-result-review-admin-ui-wiring-readiness-gate.md
docs/discovery-phase-10u-candidate-extraction-admin-ui-dry-run-invocation-wiring-plan.md
docs/discovery-phase-10w-candidate-extraction-admin-ui-dry-run-panel-post-implementation-review-live-dry-run-gate.md
docs/discovery-phase-10x-candidate-extraction-admin-ui-live-dry-run-verification-result.md
docs/discovery-phase-10y-candidate-extraction-admin-ui-live-dry-run-result-review-production-readiness-boundary.md
docs/discovery-phase-12a-candidate-extraction-api-admin-ui-live-staging-enablement-design-gate.md
docs/discovery-phase-12d-candidate-extraction-admin-ui-live-staging-design-gate.md
docs/discovery-phase-12e-candidate-extraction-admin-ui-live-staging-implementation-plan.md
docs/discovery-phase-13a-candidate-extraction-admin-ui-source-provider-design.md
docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md
docs/discovery-phase-14e-admin-ui-live-staging-activation-implementation-plan.md
docs/discovery-phase-14h-admin-ui-staged-action-design.md
docs/discovery-phase-15a-candidate-staging-queue-admin-ui-design.md
docs/discovery-phase-15b-candidate-staging-queue-admin-ui-implementation-plan.md
docs/discovery-phase-15d-candidate-staging-queue-admin-ui-post-implementation-review.md
docs/discovery-phase-15f-candidate-staging-queue-admin-ui-browser-qa-result.md
docs/discovery-phase-17a-admin-shell-browser-supabase-read-hardening-design.md
docs/discovery-phase-17b-admin-shell-browser-supabase-read-hardening-implementation-plan.md
docs/discovery-phase-17e-admin-shell-browser-supabase-read-hardening-browser-qa-result.md
docs/discovery-phase-17f-admin-shell-browser-supabase-read-hardening-readiness-gate.md
docs/discovery-phase-18a-admin-shell-remaining-browser-supabase-read-audit-design.md
docs/discovery-phase-18b-admin-shell-remaining-browser-supabase-read-static-audit.md
docs/discovery-phase-18c-admin-shell-remaining-browser-supabase-read-audit-readiness-gate.md
docs/discovery-phase-19w-candidate-decision-admin-ui-design.md
docs/discovery-phase-19x-candidate-decision-admin-ui-implementation-plan.md
docs/discovery-phase-19z-candidate-decision-admin-ui-post-implementation-review.md
docs/discovery-phase-20a-candidate-decision-admin-ui-manual-qa-gate.md
docs/discovery-phase-20b-candidate-decision-admin-ui-manual-qa-execution.md
docs/discovery-phase-20c-candidate-decision-admin-ui-manual-qa-result-review-commit-gate.md
docs/discovery-phase-20d-candidate-decision-admin-ui-release-readiness-gate.md
```

File names alone do not establish RLS correctness, service-role isolation, authorization enforcement, or secret safety.

Status: `STATIC_CANDIDATES_IDENTIFIED_SECURITY_VERIFICATION_MISSING`

## Workstream 4 — Content and discovery readiness

Static evidence candidates include:

```text
app/admin/discovery/page.tsx
app/admin/discovery/tools/[id]/page.tsx
app/admin/discovery/tools/page.tsx
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/sources/route.ts
app/data/tools.ts
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts
components/admin/discovery/discovery-queue-table.tsx
components/admin/discovery/discovery-runs-table.tsx
components/admin/discovery/discovery-sources-panel.tsx
components/admin/discovery/discovery-tool-detail.tsx
components/admin/discovery/manual-metadata-fetch-results-review.tsx
components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx
components/admin/discovery/manual-static-html-evidence-results-review.tsx
docs/archive-index/discovery-read-only-runtime-validation-harness-static-evidence-archive-index.md
docs/discovery-crawler-plan.md
docs/discovery-first-crawler-sources.md
docs/discovery-manual-crawler-async-executor-design.md
docs/discovery-manual-crawler-final-implementation-gate.md
docs/discovery-manual-crawler-implementation-plan.md
docs/discovery-manual-crawler-pre-implementation-decisions.md
docs/discovery-manual-crawler-prototype-design.md
docs/discovery-manual-crawler-prototype-implementation-scope.md
docs/discovery-phase-10a-candidate-extraction-staging-pipeline-planning.md
docs/discovery-phase-10b-candidate-extraction-input-contract-mapper-design.md
docs/discovery-phase-10c-candidate-extraction-mapper-implementation-plan.md
docs/discovery-phase-10f-candidate-extraction-staging-pipeline-integration-plan.md
docs/discovery-phase-10h-candidate-extraction-staging-pipeline-smoke-gate-plan.md
docs/discovery-phase-10l-candidate-extraction-staging-pipeline-live-smoke-result.md
docs/discovery-phase-10m-candidate-extraction-staging-pipeline-production-integration-readiness-gate.md
docs/discovery-phase-10n-candidate-extraction-production-invocation-contract-implementation-plan.md
docs/discovery-phase-10p-candidate-extraction-production-invocation-api-route-action-design.md
docs/discovery-phase-10r-candidate-extraction-invocation-api-route-live-verification-gate.md
docs/discovery-phase-10s-candidate-extraction-invocation-api-route-live-verification-result.md
docs/discovery-phase-10t-candidate-extraction-invocation-route-result-review-admin-ui-wiring-readiness-gate.md
docs/discovery-phase-10u-candidate-extraction-admin-ui-dry-run-invocation-wiring-plan.md
docs/discovery-phase-10w-candidate-extraction-admin-ui-dry-run-panel-post-implementation-review-live-dry-run-gate.md
docs/discovery-phase-10x-candidate-extraction-admin-ui-live-dry-run-verification-result.md
docs/discovery-phase-10y-candidate-extraction-admin-ui-live-dry-run-result-review-production-readiness-boundary.md
docs/discovery-phase-10z-candidate-extraction-manual-live-staging-readiness-design-gate.md
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md
docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md
docs/discovery-phase-11e-candidate-extraction-manual-live-staging-verification-result.md
docs/discovery-phase-12a-candidate-extraction-api-admin-ui-live-staging-enablement-design-gate.md
docs/discovery-phase-12b-candidate-extraction-api-live-staging-implementation-plan.md
docs/discovery-phase-12d-candidate-extraction-admin-ui-live-staging-design-gate.md
docs/discovery-phase-12e-candidate-extraction-admin-ui-live-staging-implementation-plan.md
docs/discovery-phase-13a-candidate-extraction-admin-ui-source-provider-design.md
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md
docs/discovery-phase-13g-read-only-candidate-preview-api-route-implementation-plan.md
docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md
docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md
docs/discovery-phase-14b-candidate-extraction-live-staging-backend-activation-implementation-plan.md
docs/discovery-phase-14c-a-preview-to-staging-mapper-source-url-decision-patch.md
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md
docs/discovery-phase-14c-d-preview-artifact-trusted-source-url-schema-application-gate.md
docs/discovery-phase-14e-admin-ui-live-staging-activation-implementation-plan.md
docs/discovery-phase-14f-backend-preview-revalidated-route-resolver-wiring-plan.md
docs/discovery-phase-14h-admin-ui-staged-action-design.md
docs/discovery-phase-14j-controlled-live-staging-smoke-gate.md
docs/discovery-phase-14k-a-controlled-reviewable-preview-artifact-preparation-gate.md
docs/discovery-phase-14k-e-controlled-live-staging-smoke-result.md
docs/discovery-phase-14l-controlled-staged-candidate-review-cleanup-gate.md
docs/discovery-phase-14o-controlled-staged-candidate-cleanup-method-decision-gate.md
docs/discovery-phase-14r-controlled-exact-id-archive-cleanup-result.md
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md
docs/discovery-phase-14u-candidate-staging-queue-read-model-implementation-plan.md
docs/discovery-phase-14w-candidate-staging-queue-api-read-route-design.md
docs/discovery-phase-14x-candidate-staging-queue-api-read-route-implementation-plan.md
docs/discovery-phase-14z-candidate-staging-queue-api-read-route-post-implementation-review.md
docs/discovery-phase-15a-candidate-staging-queue-admin-ui-design.md
docs/discovery-phase-15b-candidate-staging-queue-admin-ui-implementation-plan.md
docs/discovery-phase-15d-candidate-staging-queue-admin-ui-post-implementation-review.md
docs/discovery-phase-15f-candidate-staging-queue-admin-ui-browser-qa-result.md
docs/discovery-phase-15g-candidate-staging-queue-pagination-detail-drawer-design.md
docs/discovery-phase-15h-candidate-staging-queue-detail-drawer-implementation-plan.md
docs/discovery-phase-15k-candidate-staging-queue-detail-drawer-browser-qa-result.md
```

These paths identify likely content, category, metadata, and discovery surfaces. Record quality and coverage remain unverified.

Status: `STATIC_CANDIDATES_IDENTIFIED_CONTENT_VERIFICATION_MISSING`

## Workstream 5 — Public UX and QA

Static evidence candidates include:

```text
app/admin/homepage-control/[id]/edit/page.tsx
app/admin/homepage-control/[id]/page.tsx
app/admin/homepage-control/[id]/preview/page.tsx
app/admin/homepage-control/page.tsx
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts
app/api/admin/homepage-control/drafts/[id]/publish/route.ts
app/api/admin/homepage-control/drafts/[id]/route.ts
app/api/admin/homepage-control/drafts/route.ts
app/api/homepage-control/published/route.ts
app/category/[slug]/category-detail-client.tsx
app/category/[slug]/page.tsx
app/compare-provider.tsx
app/compare/compare-client.tsx
app/compare/page.tsx
components.json
components/admin/admin-dashboard-client.tsx
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts
components/admin/discovery/discovery-queue-table.tsx
components/admin/discovery/discovery-runs-table.tsx
components/admin/discovery/discovery-sources-panel.tsx
components/admin/discovery/discovery-tool-detail.tsx
components/admin/discovery/manual-metadata-fetch-results-review.tsx
components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx
components/admin/discovery/manual-static-html-evidence-results-review.tsx
components/admin/homepage-control-create-draft-button.tsx
components/admin/homepage-control-draft-editor.tsx
components/admin/homepage-control-mark-preview-button.tsx
components/admin/homepage-control-preview-checklist.tsx
components/admin/homepage-control-publish-button.tsx
components/admin/homepage-preview-banner.tsx
components/empty-states/empty-state.tsx
components/empty-states/index.ts
components/empty-states/no-pending-admin-items-empty-state.tsx
components/empty-states/no-search-results-empty-state.tsx
components/empty-states/no-submitted-tools-empty-state.tsx
components/home/AIGuidedSuggestions.tsx
components/home/AIOnboardingSteps.tsx
components/home/AIStatusChips.tsx
components/home/CompareAssistant.tsx
components/home/SearchBar.tsx
components/loading/dashboard-stats-skeleton.tsx
components/loading/index.ts
components/loading/table-list-skeleton.tsx
components/loading/tool-card-skeleton.tsx
components/public/tool-card.tsx
components/tool-details-modal.tsx
components/ui/badge.tsx
components/ui/button.tsx
components/ui/card.tsx
components/ui/dialog.tsx
components/ui/global-toaster.tsx
components/ui/input.tsx
components/ui/label.tsx
components/ui/select.tsx
components/ui/skeleton.tsx
components/ui/textarea.tsx
docs/accessibility-qa-framework.md
docs/discovery-phase-22ao-f-admin-queue-ux-fail-closed-status-presentation-qa-accessibility-review.md
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md
docs/discovery-phase-26ay-revision-cdxxix-gap-060-062-vercel-api-adapter-research.md
docs/discovery-phase-26bb-revision-cdxxxii-gap-060-062-exact-adapter-research-validation.md
docs/discovery-phase-26bc-revision-cdxxxiii-gap-060-062-exact-adapter-research-review-gate.md
docs/discovery-phase-26sa-revision-dcccxlviii-gap-001-read-only-authoritative-source-search-closure.md
docs/homepage-control-room-sql-migration-draft.md
docs/homepage-control-room-sql-migration-proposal.md
docs/homepage-control-room-storage-design-proposal.md
docs/homepage-control-room-supabase-table-design.md
docs/phase-23b-visual-identity-homepage-upgrade-planning-gate.md
docs/phase-23c-visual-identity-brand-homepage-design-gate.md
docs/phase-23d-homepage-visual-upgrade-implementation-plan.md
docs/phase-23g-homepage-visual-upgrade-qa-accessibility-result.md
docs/responsive-qa-framework.md
lib/homepage-control-admin.ts
lib/homepage-control-defaults.ts
lib/homepage-control-parser.ts
lib/homepage-control-public.ts
lib/homepage-control-schema.ts
lib/homepage-control-types.ts
lib/homepage-control-validation.ts
lib/search-relevance.ts
lib/tool-categories.ts
playwright.accessibility.config.ts
supabase/migrations/20260612000100_create_homepage_control_room.sql
supabase/migrations/20260612000300_publish_homepage_control_config.sql
testing/accessibility-qa.spec.ts
testing/responsive-qa.spec.ts
```

Component and route presence does not prove responsive behavior, accessibility, performance, or cross-browser correctness.

Status: `STATIC_CANDIDATES_IDENTIFIED_VISUAL_AND_RUNTIME_QA_MISSING`

## Workstream 6 — Launch operations

Static evidence candidates include:

```text
AI_PROMPTS/deployment-check-template.md
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
components/home/AIStatusChips.tsx
docs/discovery-phase-10h-candidate-extraction-staging-pipeline-smoke-gate-plan.md
docs/discovery-phase-10l-candidate-extraction-staging-pipeline-live-smoke-result.md
docs/discovery-phase-14j-controlled-live-staging-smoke-gate.md
docs/discovery-phase-14k-e-controlled-live-staging-smoke-result.md
docs/discovery-phase-19l-candidate-decision-live-mutation-smoke-result.md
docs/discovery-phase-19t-candidate-decision-mutation-api-live-smoke-gate.md
docs/discovery-phase-19v-candidate-decision-mutation-api-live-smoke-result.md
docs/discovery-phase-20d-candidate-decision-admin-ui-release-readiness-gate.md
docs/discovery-phase-21a-candidate-decision-live-smoke-plan-approval-gate.md
docs/discovery-phase-21b-candidate-decision-live-smoke-readonly-preflight-result.md
docs/discovery-phase-21f-candidate-decision-live-smoke-execution-result.md
docs/discovery-phase-21g-candidate-decision-live-smoke-result-review-cleanup-planning-gate.md
docs/discovery-phase-22ac-candidate-staging-availability-read-only-status-count-approval-gate.md
docs/discovery-phase-22ae-candidate-staging-availability-status-count-live-result.md
docs/discovery-phase-22al-u-r-helper-import-readiness-smoke-recovery-server-only-package-addition-gate.md
docs/discovery-phase-22ao-a-admin-queue-ux-fail-closed-status-presentation-planning-gate.md
docs/discovery-phase-22ao-b-admin-queue-ux-fail-closed-status-presentation-implementation-plan.md
docs/discovery-phase-22ao-c-admin-queue-ux-fail-closed-status-presentation-implementation-gate.md
docs/discovery-phase-22ao-d-admin-queue-ux-fail-closed-status-presentation-ui-wiring-plan.md
docs/discovery-phase-22ao-e-admin-queue-ux-fail-closed-status-presentation-ui-wiring-implementation-gate.md
docs/discovery-phase-22ao-f-admin-queue-ux-fail-closed-status-presentation-qa-accessibility-review.md
docs/discovery-phase-22ao-g-admin-queue-ux-fail-closed-status-presentation-closure-gate.md
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md
docs/discovery-phase-25al-read-only-inspection-source-status-query-shape-local-review-execution-result.md
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md
docs/discovery-phase-25au-discovery-sources-status-count-failure-diagnostic-planning-gate.md
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md
docs/discovery-phase-25ba-discovery-sources-status-contract-reconciliation-planning-gate.md
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md
docs/discovery-phase-25bc-discovery-sources-status-contract-reconciliation-decision-gate.md
docs/discovery-phase-25bd-discovery-sources-status-migration-reconciliation-planning-gate.md
docs/discovery-phase-25be-discovery-sources-status-forward-only-migration-draft-gate.md
docs/discovery-phase-25bf-discovery-sources-status-forward-only-migration-draft-review-gate.md
docs/discovery-phase-25bg-discovery-sources-status-migration-apply-preflight-planning-gate.md
docs/discovery-phase-25bi-discovery-sources-status-live-migration-apply-result-documentation-gate.md
docs/discovery-phase-25bj-discovery-sources-status-post-apply-metadata-verification-preflight-gate.md
docs/discovery-phase-25bl-discovery-sources-status-metadata-verification-failed-closed-result-documentation-gate.md
docs/discovery-phase-25bm-discovery-sources-status-metadata-verification-failure-analysis-recovery-planning-gate.md
docs/discovery-phase-25bn-discovery-sources-status-metadata-verification-retry-preflight-improved-output-capture-gate.md
docs/discovery-phase-25bp-discovery-sources-status-metadata-verification-retry-pre-psql-failed-closed-result-documentation-gate.md
docs/discovery-phase-25bq-discovery-sources-status-metadata-verification-retry-pre-psql-failure-analysis-harness-correction-planning-gate.md
docs/discovery-phase-25br-discovery-sources-status-metadata-verification-retry-wrapper-correction-preflight-gate.md
docs/discovery-phase-25bt-discovery-sources-status-metadata-verification-retry-static-files-check-failed-closed-result-documentation-gate.md
docs/discovery-phase-25bu-discovery-sources-status-metadata-verification-static-marker-audit-harness-correction-planning-gate.md
docs/discovery-phase-25bw-discovery-sources-status-metadata-verification-retry-psql-local-socket-failed-closed-result-documentation-gate.md
docs/discovery-phase-25bx-discovery-sources-status-metadata-verification-connection-argument-preflight-planning-gate.md
docs/discovery-phase-25bz-discovery-sources-status-metadata-verification-retry-connection-shape-failed-closed-result-documentation-gate.md
docs/discovery-phase-25ca-discovery-sources-status-metadata-verification-connection-input-recovery-planning-gate.md
docs/discovery-phase-25cc-discovery-sources-status-metadata-verification-retry-success-result-documentation-gate.md
docs/discovery-phase-25cd-discovery-sources-status-metadata-verification-post-success-type-generation-reactivation-planning-gate.md
docs/discovery-phase-25ce-supabase-type-generation-preflight-planning-gate-discovery-sources-status-metadata-reconciliation.md
docs/discovery-phase-25ch-supabase-type-generation-execution-planning-gate-discovery-sources-status-metadata-reconciliation.md
docs/discovery-phase-25da-discovery-engine-operational-reactivation-scope-and-rollback-planning-gate.md
docs/discovery-phase-25la-revision-xvii-historical-validator-release-inventory-plan.md
docs/discovery-phase-25lb-revision-xvii-read-only-historical-validator-release-metadata-inventory-result.md
docs/discovery-phase-25lj-revision-xxv-public-launch-readiness-planning-gate.md
docs/discovery-phase-25lk-revision-xxvi-public-launch-readiness-evidence-inventory-planning-gate.md
docs/discovery-phase-25ll-revision-xxvii-public-launch-readiness-evidence-inventory-result.md
docs/discovery-phase-25lm-revision-xxviii-public-launch-readiness-assessment-planning-gate.md
docs/discovery-phase-25lp-revision-xxxi-read-only-deployed-surface-and-device-evidence-planning-gate.md
docs/discovery-phase-25lq-revision-xxxii-read-only-deployed-surface-and-device-evidence-result.md
docs/discovery-phase-25lt-revision-xxxv-public-launch-readiness-assessment-result-planning-gate.md
docs/discovery-phase-25lu-revision-xxxvi-public-launch-readiness-assessment-result.md
docs/discovery-phase-25lv-revision-xxxvii-public-launch-readiness-blocker-disposition-planning-gate.md
docs/discovery-phase-25zi-revision-ccclxxxvii-post-decision-blocker-status-classification.md
docs/discovery-phase-26ab-revision-cdvi-gap-060-062-production-deployment-preflight-contract.md
docs/discovery-phase-26ay-revision-cdxxix-gap-060-062-vercel-api-adapter-research.md
docs/discovery-phase-26cd-revision-cdlix-gap-060-062-corrected-static-patch-safety-and-rollback-contract.md
docs/discovery-phase-26ew-revision-dxvii-gap-060-062-http-status-classification.md
docs/discovery-phase-26iw-revision-dcxviii-gap-060-062-recovery-and-rollback-contract.md
docs/discovery-phase-26mx-revision-dccxxi-gap-060-062-recovery-and-rollback-plan.md
docs/discovery-phase-26nd-revision-dccxxvii-gap-060-062-wrapper-invocation-status-byte-anchor-inventory.md
docs/discovery-phase-26nh-revision-dccxxxi-gap-060-062-source-implementation-and-rollback-plan.md
docs/discovery-phase-26nn-revision-dccxxxvii-gap-060-062-amended-implementation-and-rollback-plan.md
docs/discovery-phase-26sg-revision-dliv-public-launch-readiness-workstream-transition-map.md
docs/discovery-phase-26sh-revision-dlv-launch-readiness-entry-criteria-and-blocker-contract.md
docs/discovery-phase-26si-revision-dlvi-governance-to-launch-readiness-transition-review-package.md
docs/discovery-phase-26sj-revision-dlvii-public-launch-readiness-master-inventory.md
docs/discovery-phase-26sk-revision-dlviii-launch-readiness-evidence-and-dependency-map.md
docs/discovery-phase-26sl-revision-dlix-gap-001-pre-launch-impact-investigation-checkpoint-plan.md
docs/discovery-phase-26sm-revision-dlx-public-launch-readiness-master-inventory-review-package.md
docs/discovery-phase-6z-authenticated-metadata-fetch-smoke-plan.md
docs/discovery-phase-7v-static-html-evidence-end-to-end-smoke-test-plan.md
docs/discovery-phase-7x-static-html-evidence-smoke-test-results.md
docs/discovery-phase-8c-static-evidence-audit-timeline-smoke-test-documentation.md
docs/discovery-phase-8t-typed-discovery-client-no-op-smoke-test-plan.md
docs/discovery-phase-8y-candidate-staging-admin-live-smoke-test-plan.md
docs/discovery-phase-9b-candidate-staging-live-smoke-result.md
docs/discovery-phase-9c-candidate-staging-smoke-hardening-rls-security-planning.md
docs/discovery-phase-9d-candidate-staging-rls-smoke-planning.md
docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md
docs/discovery-phase-9h-candidate-staging-rls-smoke-result.md
docs/discovery-phase-9q-post-schema-rls-smoke-planning-execution-gate.md
docs/discovery-phase-9s-post-schema-rls-smoke-execution-result.md
docs/phase-24b-production-deployment-verification-result.md
```

Launch-related files may support deployment, rollback, monitoring, and incident-response planning. Operational readiness remains unverified.

Status: `STATIC_CANDIDATES_IDENTIFIED_OPERATIONAL_EVIDENCE_MISSING`

## GAP-001 boundary

No path-name match or neighboring evidence may be treated as an authoritative GAP-001 classification.

GAP-001 remains:

- classification: `NOT_ESTABLISHED`
- quarantine: `ACTIVE`
- pre-launch impact determination: `REQUIRED`

## Aggregate result

`FIRST_STATIC_EVIDENCE_MAPPING_COMPLETE_READINESS_NOT_ESTABLISHED`
