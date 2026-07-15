# Phase 26SR — Security and Authorization Static Source Inventory

## Bound baseline

`ddb0a73453695c0a21a26f3ebe76a51c38054e88`

## Inspection boundary

Committed source files were inspected statically by file path and security-related identifiers.

No source was executed. No application server, route, database, network service, environment file, environment value, credential, token, cookie, or production system was accessed.

## Inventory counts

- Eligible committed source/configuration files: `192`
- Authentication/session path candidates: `7`
- Admin/role path candidates: `86`
- Supabase/RLS/database path candidates: `26`
- Validation/schema path candidates: `11`
- Middleware/proxy candidates: `1`
- Security-related identifier matches: `581`
- Service-role reference matches: `13`
- Session/authentication matches: `61`
- RLS/policy matches: `209`

## Authentication and session candidates

```text
app/admin-login/layout.tsx
app/admin-login/page.tsx
app/api/admin/login/route.ts
app/api/admin/logout/route.ts
app/api/admin/session/route.ts
lib/admin-auth-read-only.ts
lib/admin-auth.ts
```

## Admin and role candidates

```text
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
lib/admin-audit-log.ts
lib/admin-auth-read-only.ts
lib/admin-auth.ts
lib/admin-rate-limit.ts
lib/discovery-run-results-review.ts
lib/discovery-static-html-evidence-audit-review.ts
lib/discovery-static-html-evidence-results-review.ts
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-preview-live-staging-resolver.ts
lib/discovery/discovery-candidate-preview-provider.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/discovery/discovery-supabase-admin.ts
lib/homepage-control-admin.ts
lib/supabase-admin.ts
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql
supabase/migrations/20260615001110_updated-preview-checklist.sql
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql
```

## Supabase, database, RLS, and policy candidates

```text
lib/discovery/discovery-supabase-admin.ts
lib/supabase-admin.ts
lib/supabase.ts
lib/supabase/database.types.ts
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql
supabase/migrations/20260602000200_create_discovered_tools_queue.sql
supabase/migrations/20260612000100_create_homepage_control_room.sql
supabase/migrations/20260612000200_harden_discovered_tools_access.sql
supabase/migrations/20260612000300_publish_homepage_control_config.sql
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql
supabase/migrations/20260615001110_updated-preview-checklist.sql
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql
supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql
supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
```

## Validation and schema candidates

```text
lib/discovery/discovery-candidate-decision-validation.ts
lib/homepage-control-parser.ts
lib/homepage-control-schema.ts
lib/homepage-control-validation.ts
lib/tool-validation.ts
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql
supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
```

## Middleware candidates

```text
proxy.ts
```

## Representative security identifier evidence

```text
app/admin-login/page.tsx:53:      if (response.ok && result?.authenticated) {
app/admin-login/page.tsx:111:      role="dialog"
app/api/admin/audit-logs/route.ts:2:import { NextResponse } from "next/server";
app/api/admin/audit-logs/route.ts:38:  return NextResponse.json(data, {
app/api/admin/audit-logs/route.ts:209:      return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/csrf/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/csrf/route.ts:27:  return NextResponse.json(data, {
app/api/admin/csrf/route.ts:38:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/candidate-extraction/invoke/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/candidate-extraction/invoke/route.ts:41:  return NextResponse.json(data, {
app/api/admin/discovery/candidate-extraction/invoke/route.ts:121:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/candidate-extraction/invoke/route.ts:122:    console.warn("Unauthorized candidate extraction invocation request.", {
app/api/admin/discovery/candidate-extraction/invoke/route.ts:126:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:36:  | "unauthorized"
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:108:  return NextResponse.json(data, {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:180:    if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:181:      console.warn("Unauthorized candidate decision mutation request.", {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:185:      return errorResponse("unauthorized", "Unauthorized.", 401);
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:210:      return NextResponse.json(getAdminRateLimitResponseData(rateLimit), {
app/api/admin/discovery/candidate-staging-queue/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/candidate-staging-queue/route.ts:23:  | "unauthorized"
app/api/admin/discovery/candidate-staging-queue/route.ts:106:  return NextResponse.json(data, {
app/api/admin/discovery/candidate-staging-queue/route.ts:262:    if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/candidate-staging-queue/route.ts:263:      console.warn("Unauthorized candidate staging queue read request.", {
app/api/admin/discovery/candidate-staging-queue/route.ts:271:            code: "unauthorized",
app/api/admin/discovery/candidate-staging-queue/route.ts:272:            message: "Unauthorized.",
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:23:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:77:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:78:    console.warn("Unauthorized Discovery Engine approve request.", {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:82:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:39:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:122:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:123:    console.warn("Unauthorized Discovery Engine duplicate request.", {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:127:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/[id]/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/discovered-tools/[id]/route.ts:20:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/[id]/route.ts:38:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/[id]/route.ts:39:    console.warn("Unauthorized Discovery Engine detail request.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:43:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/[id]/route.ts:221:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/[id]/route.ts:222:    console.warn("Unauthorized Discovery Engine status update request.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:226:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:37:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:120:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:121:    console.warn("Unauthorized Discovery Engine bulk status request.", {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:125:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/discovered-tools/route.ts:60:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/route.ts:84:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/route.ts:85:    console.warn("Unauthorized Discovery Engine discovered tools request.", {
app/api/admin/discovery/discovered-tools/route.ts:89:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/intake/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/intake/route.ts:14:  validateHttpsUrl,
app/api/admin/discovery/intake/route.ts:15:  validateOptionalLogoUrl,
app/api/admin/discovery/intake/route.ts:16:  validateTextField,
app/api/admin/discovery/intake/route.ts:17:  validateToolCategory,
app/api/admin/discovery/intake/route.ts:18:  validateToolPricing,
app/api/admin/discovery/intake/route.ts:53:  return NextResponse.json(data, {
app/api/admin/discovery/intake/route.ts:124:      validateTextField(platform, `Platform ${index + 1}`, 40, {
app/api/admin/discovery/intake/route.ts:159:  return validateHttpsUrl(value, fieldName, { required: true });
app/api/admin/discovery/intake/route.ts:197:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/intake/route.ts:198:    console.warn("Unauthorized Discovery Engine intake request.", {
app/api/admin/discovery/intake/route.ts:202:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/intake/route.ts:250:    name = validateTextField(body.name, "Name", 80, { required: true });
app/api/admin/discovery/intake/route.ts:251:    description = validateTextField(body.description, "Description", 500, {
app/api/admin/discovery/intake/route.ts:254:    website = validateHttpsUrl(body.website, "Website URL", { required: true });
app/api/admin/discovery/intake/route.ts:263:    category = validateToolCategory(body.category);
app/api/admin/discovery/intake/route.ts:264:    pricing = validateToolPricing(body.pricing) || "Free + Paid";
app/api/admin/discovery/intake/route.ts:265:    logoUrl = validateOptionalLogoUrl(body.logo_url);
app/api/admin/discovery/intake/route.ts:267:    pageTitle = validateTextField(body.page_title, "Page title", 160, {
app/api/admin/discovery/intake/route.ts:270:    metaDescription = validateTextField(
app/api/admin/discovery/intake/route.ts:398:      console.error("Failed to validate manual intake discovery source.", {
app/api/admin/discovery/intake/route.ts:402:      return jsonResponse({ error: "Failed to validate discovery source." }, 500);
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:22:  verifySession?: (request: Request) => AdminSession;
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:31:  return NextResponse.json(data, {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:76:    const verifySession = dependencies.verifySession ?? getReadOnlyAdminSession;
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:80:    const adminSession = await verifySession(request);
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:82:    if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:83:      console.warn("Unauthorized candidate preview request.", {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:87:      return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/runs/manual/claim/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/runs/manual/claim/route.ts:14:  validateManualCrawlerSource,
app/api/admin/discovery/runs/manual/claim/route.ts:116:  return NextResponse.json(data, {
app/api/admin/discovery/runs/manual/claim/route.ts:180:function validateDryRunStats(value: unknown) {
app/api/admin/discovery/runs/manual/claim/route.ts:332:  const parsed = Date.parse(timestamp);
app/api/admin/discovery/runs/manual/claim/route.ts:1017:    message: "Metadata-fetch smoke adapter started after validated request-plan preflight.",
app/api/admin/discovery/runs/manual/claim/route.ts:1262:    message: "Manual metadata fetch executor started after validated request-plan preflight.",
app/api/admin/discovery/runs/manual/claim/route.ts:1528:    message: "Static HTML evidence executor started after validated request-plan preflight.",
app/api/admin/discovery/runs/manual/claim/route.ts:1723:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/manual/claim/route.ts:1724:    console.warn("Unauthorized manual crawler executor claim request.", {
app/api/admin/discovery/runs/manual/claim/route.ts:1728:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/runs/manual/claim/route.ts:1817:    console.error("Failed to validate manual crawler executor source.", {
app/api/admin/discovery/runs/manual/claim/route.ts:1823:    return jsonResponse({ error: "Failed to validate discovery source." }, 500);
app/api/admin/discovery/runs/manual/claim/route.ts:1831:    validateManualCrawlerSource(source as ManualCrawlerSource);
app/api/admin/discovery/runs/manual/claim/route.ts:1832:    validateDryRunStats(runRecord.stats);
app/api/admin/discovery/runs/manual/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/runs/manual/route.ts:13:  validateManualCrawlerRequest,
app/api/admin/discovery/runs/manual/route.ts:14:  validateManualCrawlerSource,
app/api/admin/discovery/runs/manual/route.ts:25:  return NextResponse.json(data, {
app/api/admin/discovery/runs/manual/route.ts:60:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/manual/route.ts:61:    console.warn("Unauthorized manual crawler trigger request.", {
app/api/admin/discovery/runs/manual/route.ts:65:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/runs/manual/route.ts:99:    manualCrawlerRequest = validateManualCrawlerRequest(body);
app/api/admin/discovery/runs/manual/route.ts:114:    console.error("Failed to validate manual crawler source.", {
app/api/admin/discovery/runs/manual/route.ts:118:    return jsonResponse({ error: "Failed to validate discovery source." }, 500);
app/api/admin/discovery/runs/manual/route.ts:126:    validateManualCrawlerSource(source as ManualCrawlerSource);
app/api/admin/discovery/runs/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/runs/route.ts:55:  return NextResponse.json(data, {
app/api/admin/discovery/runs/route.ts:79:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/route.ts:80:    console.warn("Unauthorized Discovery Engine runs request.", {
app/api/admin/discovery/runs/route.ts:84:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/sources/[id]/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/sources/[id]/route.ts:13:  validateHttpsUrl,
app/api/admin/discovery/sources/[id]/route.ts:14:  validateTextField,
app/api/admin/discovery/sources/[id]/route.ts:36:  return NextResponse.json(data, {
app/api/admin/discovery/sources/[id]/route.ts:89:  return validateHttpsUrl(value, "Source URL", { required: true });
app/api/admin/discovery/sources/[id]/route.ts:93:  const sourceType = validateTextField(value, "Source type", 30, {
app/api/admin/discovery/sources/[id]/route.ts:213:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/sources/[id]/route.ts:214:    console.warn("Unauthorized Discovery Source update request.", {
app/api/admin/discovery/sources/[id]/route.ts:218:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/sources/[id]/route.ts:259:      const name = validateTextField(body.name, "Source name", 100, {
app/api/admin/discovery/sources/[id]/route.ts:274:      const description = validateTextField(
app/api/admin/discovery/sources/route.ts:1:import { NextResponse } from "next/server";
app/api/admin/discovery/sources/route.ts:13:  validateHttpsUrl,
app/api/admin/discovery/sources/route.ts:14:  validateTextField,
app/api/admin/discovery/sources/route.ts:25:  return NextResponse.json(data, {
app/api/admin/discovery/sources/route.ts:84:  return validateHttpsUrl(value, "Source URL", { required: true });
app/api/admin/discovery/sources/route.ts:88:  const sourceType = validateTextField(value, "Source type", 30, {
app/api/admin/discovery/sources/route.ts:133:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/sources/route.ts:134:    console.warn("Unauthorized Discovery Sources request.", {
app/api/admin/discovery/sources/route.ts:138:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/sources/route.ts:210:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/sources/route.ts:211:    console.warn("Unauthorized Discovery Source create request.", {
app/api/admin/discovery/sources/route.ts:215:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/sources/route.ts:255:    name = validateTextField(body.name, "Source name", 100, {
app/api/admin/discovery/sources/route.ts:265:    description = validateTextField(body.description, "Source description", 500, {
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts:1:import { NextRequest, NextResponse } from "next/server";
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts:29:  return NextResponse.json(data, {
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts:44:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts:45:    console.warn("Unauthorized Homepage Control Room mark-preview request.", {
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts:53:        errors: ["Unauthorized"],
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts:1:import { NextRequest, NextResponse } from "next/server";
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts:29:  return NextResponse.json(data, {
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts:44:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts:46:      "Unauthorized Homepage Control Room preview checklist request.",
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts:56:        errors: ["Unauthorized"],
app/api/admin/homepage-control/drafts/[id]/publish/route.ts:1:import { NextRequest, NextResponse } from "next/server";
app/api/admin/homepage-control/drafts/[id]/publish/route.ts:30:  return NextResponse.json(data, {
app/api/admin/homepage-control/drafts/[id]/publish/route.ts:45:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/publish/route.ts:46:    console.warn("Unauthorized Homepage Control Room publish request.", {
app/api/admin/homepage-control/drafts/[id]/publish/route.ts:54:        errors: ["Unauthorized"],
app/api/admin/homepage-control/drafts/[id]/route.ts:1:import { NextRequest, NextResponse } from "next/server";
app/api/admin/homepage-control/drafts/[id]/route.ts:33:  return NextResponse.json(data, {
app/api/admin/homepage-control/drafts/[id]/route.ts:77:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/route.ts:78:    console.warn("Unauthorized Homepage Control Room draft update request.", {
```

## Service-role reference evidence

```text
app/api/submit-tool/route.ts:32:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
lib/discovery/discovery-supabase-admin.ts:7:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
lib/supabase-admin.ts:4:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:6:-- - Keep service_role access for trusted server-side admin workflows.
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:35:grant all on table public.discovered_tools to service_role;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:36:grant all on sequence public.discovered_tools_id_seq to service_role;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:37:grant execute on function public.set_discovered_tools_updated_at() to service_role;
supabase/migrations/20260612000300_publish_homepage_control_config.sql:147:grant execute on function public.publish_homepage_control_config(uuid, uuid, text) to service_role;
supabase/migrations/20260615001110_updated-preview-checklist.sql:16:-- - The publish RPC stays restricted to service_role.
supabase/migrations/20260615001110_updated-preview-checklist.sql:189:grant execute on function public.publish_homepage_control_config(uuid, uuid, text) to service_role;
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:105:grant execute on function public.approve_submitted_tool(bigint) to service_role;
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:183:grant execute on function public.approve_discovered_tool(uuid, uuid, text) to service_role;
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:267:) to service_role;
```

## Session and authentication evidence

```text
app/admin-login/page.tsx:45:      const response = await fetch("/api/admin/session", {
app/admin-login/page.tsx:101:  const sessionTimer = window.setTimeout(() => {
app/admin-login/page.tsx:105:  return () => window.clearTimeout(sessionTimer);
app/admin-login/page.tsx:149:          <h1 className="mt-3 text-3xl font-black">Checking session...</h1>
app/admin-login/page.tsx:198:          session is used after login.
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:22:  verifySession?: (request: Request) => AdminSession;
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:76:    const verifySession = dependencies.verifySession ?? getReadOnlyAdminSession;
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:80:    const adminSession = await verifySession(request);
app/api/admin/login/route.ts:95:    const sessionSecret = process.env.ADMIN_SESSION_SECRET;
app/api/admin/login/route.ts:97:    if (!expectedPassword || !sessionSecret) {
app/api/admin/login/route.ts:180:    const signature = signSession(payload, sessionSecret);
app/api/admin/login/route.ts:181:    const sessionValue = `${payload}.${signature}`;
app/api/admin/login/route.ts:187:        sessionMaxAgeSeconds: SESSION_MAX_AGE_SECONDS,
app/api/admin/login/route.ts:196:    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionValue, {
components/admin/admin-dashboard-client.tsx:234:      "Inspect review safety, session protection, audit logs, and archive readiness.",
components/admin/admin-dashboard-client.tsx:975:        target: log.target_name || log.target_type || "Admin session",
components/admin/admin-dashboard-client.tsx:1230:      const response = await fetch("/api/admin/session", {
components/admin/admin-dashboard-client.tsx:1257:        showError("Your admin session expired. Please log in again.");
components/admin/admin-dashboard-client.tsx:1397:        showError("Your admin session expired. Please log in again.");
components/admin/admin-dashboard-client.tsx:1508:      showError("Your admin session expired. Please log in again.");
components/admin/admin-dashboard-client.tsx:2321:                        {log.target_name || log.target_type || "Admin session"}
components/admin/admin-dashboard-client.tsx:3141:          <h1 className="mt-3 text-3xl font-black">Checking session...</h1>
components/admin/admin-dashboard-client.tsx:3191:            session is used after login.
components/admin/admin-dashboard-client.tsx:3274:              CSRF, session cookies, audit logging, and route guards are active.
components/admin/admin-dashboard-client.tsx:4493:                Cookie session, CSRF, route guard, RLS, storage restrictions,
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx:104:    return "Your admin session is unavailable or expired. Please log in again.";
components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts:323:  if (status === 401) return "Admin session expired. Please log in again.";
lib/admin-auth-read-only.ts:28:const ADMIN_SESSION_COOKIE_NAME = `aifinder_admin_session`;
lib/admin-auth-read-only.ts:230:    return unauthorized(["missing_admin_session_secret"]);
lib/admin-auth-read-only.ts:236:    return unauthorized(["missing_admin_session_cookie"]);
lib/admin-auth-read-only.ts:242:    return unauthorized(["invalid_admin_session_format"]);
lib/admin-auth-read-only.ts:248:    return unauthorized(["admin_session_crypto_unavailable"]);
lib/admin-auth-read-only.ts:252:    return unauthorized(["invalid_admin_session_signature"]);
lib/admin-auth-read-only.ts:258:    return unauthorized(["invalid_admin_session_payload"]);
lib/admin-auth-read-only.ts:262:    return unauthorized(["inactive_admin_session"]);
lib/admin-auth-read-only.ts:268:    return unauthorized(["missing_admin_session_actor"]);
lib/admin-auth.ts:3:export const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";
lib/admin-auth.ts:47:  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
lib/admin-auth.ts:49:  if (!sessionSecret) {
lib/admin-auth.ts:54:      errors: ["Admin session is not configured."],
lib/admin-auth.ts:58:  const session = getCookieValue(request, ADMIN_SESSION_COOKIE_NAME);
lib/admin-auth.ts:60:  if (!session) {
lib/admin-auth.ts:64:      errors: ["Admin session cookie is missing."],
lib/admin-auth.ts:68:  const lastDotIndex = session.lastIndexOf(".");
lib/admin-auth.ts:74:      errors: ["Admin session format is invalid."],
lib/admin-auth.ts:78:  const payload = session.slice(0, lastDotIndex);
lib/admin-auth.ts:79:  const signature = session.slice(lastDotIndex + 1);
lib/admin-auth.ts:80:  const expectedSignature = signSession(payload, sessionSecret);
lib/admin-auth.ts:86:      errors: ["Admin session signature is invalid."],
lib/admin-auth.ts:97:      errors: ["Admin session role is invalid."],
lib/admin-auth.ts:105:      errors: ["Admin session is expired."],
proxy.ts:3:const ADMIN_SESSION_COOKIE_NAME = "aifinder_admin_session";
proxy.ts:67:  const sessionSecret = getSessionSigningSecret();
proxy.ts:69:  if (!sessionSecret) return false;
proxy.ts:71:  const session = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
proxy.ts:73:  if (!session) return false;
proxy.ts:75:  const lastDotIndex = session.lastIndexOf(".");
proxy.ts:79:  const payload = session.slice(0, lastDotIndex);
proxy.ts:80:  const signature = session.slice(lastDotIndex + 1);
proxy.ts:81:  const expectedSignature = await signSession(payload, sessionSecret);
supabase/migrations/20260612000100_create_homepage_control_room.sql:208:-- AiFinder's current session and CSRF model.
```

## RLS and policy evidence

```text
app/api/admin/discovery/runs/manual/claim/route.ts:356:  const urls = getManualCuratedUrlValues(stats);
app/api/admin/discovery/runs/manual/claim/route.ts:358:  if (!urls) {
app/api/admin/discovery/runs/manual/claim/route.ts:359:    return { ok: false, reason: "missing_manual_curated_urls" };
app/api/admin/discovery/runs/manual/claim/route.ts:362:  return buildDiscoveryRequestPlans(urls, createdAt);
app/api/admin/discovery/runs/manual/claim/route.ts:411:    processed_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:412:    fetched_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:474:    processed_urls: 1,
app/api/admin/discovery/runs/manual/claim/route.ts:475:    fetched_urls: 1,
app/api/admin/discovery/runs/manual/claim/route.ts:514:    processed_urls: fetchResult ? 1 : 0,
app/api/admin/discovery/runs/manual/claim/route.ts:515:    fetched_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:560:    total_urls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:561:    fetched_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:562:    failed_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:563:    skipped_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:598:    processed_urls: summary.totalUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:599:    fetched_urls: summary.fetchedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:600:    failed_urls: summary.failedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:601:    skipped_urls: summary.skippedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:610:    total_urls: summary.totalUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:643:    total_urls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:644:    attempted_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:645:    acquired_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:646:    evidence_attempted_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:647:    evidence_produced_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:648:    failed_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:649:    skipped_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:683:  const noFetchPerformed = summary.attemptedUrls === 0;
app/api/admin/discovery/runs/manual/claim/route.ts:684:  const noExtractionPerformed = summary.evidenceAttemptedUrls === 0;
app/api/admin/discovery/runs/manual/claim/route.ts:693:    total_urls: summary.totalUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:694:    attempted_urls: summary.attemptedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:695:    acquired_urls: summary.acquiredUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:696:    evidence_attempted_urls: summary.evidenceAttemptedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:697:    evidence_produced_urls: summary.evidenceProducedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:698:    failed_urls: summary.failedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:699:    skipped_urls: summary.skippedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1190:      totalUrls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:1191:      fetchedUrls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1192:      failedUrls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1193:      skippedUrls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:1243:        total_urls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:1264:      total_urls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:1319:  const hasSuccessfulFetch = summary.fetchedUrls > 0;
app/api/admin/discovery/runs/manual/claim/route.ts:1375:      total_urls: summary.totalUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1376:      fetched_urls: summary.fetchedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1377:      failed_urls: summary.failedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1378:      skipped_urls: summary.skippedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1418:  totalUrls: number
app/api/admin/discovery/runs/manual/claim/route.ts:1420:  const safeTotalUrls = Number.isSafeInteger(totalUrls) && totalUrls >= 0
app/api/admin/discovery/runs/manual/claim/route.ts:1421:    ? totalUrls
app/api/admin/discovery/runs/manual/claim/route.ts:1424:    totalUrls: safeTotalUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1425:    attemptedUrls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1426:    acquiredUrls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1427:    evidenceAttemptedUrls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1428:    evidenceProducedUrls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1429:    failedUrls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1430:    skippedUrls: safeTotalUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1506:        total_urls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:1530:      total_urls: requestPlans.length,
app/api/admin/discovery/runs/manual/claim/route.ts:1683:      total_urls: execution.summary.totalUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1684:      attempted_urls: execution.summary.attemptedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1685:      acquired_urls: execution.summary.acquiredUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1686:      evidence_produced_urls: execution.summary.evidenceProducedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1687:      failed_urls: execution.summary.failedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1688:      skipped_urls: execution.summary.skippedUrls,
app/api/admin/discovery/runs/manual/claim/route.ts:1692:      noFetchPerformed: execution.summary.attemptedUrls === 0,
app/api/admin/discovery/runs/manual/claim/route.ts:1693:      noExtractionPerformed: execution.summary.evidenceAttemptedUrls === 0,
app/api/admin/discovery/runs/manual/claim/route.ts:2245:      processed_urls: 0,
app/api/admin/discovery/runs/manual/claim/route.ts:2246:      fetched_urls: 0,
app/api/admin/discovery/runs/manual/route.ts:225:        requested_url_count: manualCrawlerRequest.urls.length,
app/api/admin/discovery/runs/route.ts:198:            total_urls: auditRow.metadata.total_urls,
app/sitemap.ts:16:async function getToolUrls() {
app/sitemap.ts:39:  const toolUrls = await getToolUrls();
app/sitemap.ts:41:  const categoryUrls = categories.map((category) => ({
app/sitemap.ts:67:    ...categoryUrls,
app/sitemap.ts:68:    ...toolUrls,
components/admin/discovery/discovery-runs-table.tsx:558:                        <span>Total: {manualMetadataFetchReview.counts.totalUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:559:                        <span>Fetched: {manualMetadataFetchReview.counts.fetchedUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:560:                        <span>Failed: {manualMetadataFetchReview.counts.failedUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:561:                        <span>Skipped: {manualMetadataFetchReview.counts.skippedUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:565:                        <span>Total: {manualStaticHtmlEvidenceReview.counts.totalUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:566:                        <span>Derived: {manualStaticHtmlEvidenceReview.counts.evidenceProducedUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:567:                        <span>Failed: {manualStaticHtmlEvidenceReview.counts.failedUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:568:                        <span>Skipped: {manualStaticHtmlEvidenceReview.counts.skippedUrls}</span>
components/admin/discovery/discovery-runs-table.tsx:586:                        ? manualMetadataFetchReview.counts.failedUrls > 0
components/admin/discovery/discovery-runs-table.tsx:592:                            : manualStaticHtmlEvidenceReview.counts.failedUrls > 0
components/admin/discovery/manual-metadata-fetch-results-review.tsx:130:        <SummaryItem label="Total URLs" value={review.counts.totalUrls} />
components/admin/discovery/manual-metadata-fetch-results-review.tsx:131:        <SummaryItem label="Processed URLs" value={review.counts.processedUrls} />
components/admin/discovery/manual-metadata-fetch-results-review.tsx:132:        <SummaryItem label="Fetched URLs" value={review.counts.fetchedUrls} />
components/admin/discovery/manual-metadata-fetch-results-review.tsx:133:        <SummaryItem label="Failed URLs" value={review.counts.failedUrls} />
components/admin/discovery/manual-metadata-fetch-results-review.tsx:134:        <SummaryItem label="Skipped URLs" value={review.counts.skippedUrls} />
components/admin/discovery/manual-static-html-evidence-results-review.tsx:223:        <SummaryItem label="Total URLs" value={review.counts.totalUrls} />
components/admin/discovery/manual-static-html-evidence-results-review.tsx:224:        <SummaryItem label="Attempted URLs" value={review.counts.attemptedUrls} />
components/admin/discovery/manual-static-html-evidence-results-review.tsx:225:        <SummaryItem label="Acquired URLs" value={review.counts.acquiredUrls} />
components/admin/discovery/manual-static-html-evidence-results-review.tsx:228:          value={review.counts.evidenceAttemptedUrls}
components/admin/discovery/manual-static-html-evidence-results-review.tsx:232:          value={review.counts.evidenceProducedUrls}
components/admin/discovery/manual-static-html-evidence-results-review.tsx:234:        <SummaryItem label="Failed URLs" value={review.counts.failedUrls} />
components/admin/discovery/manual-static-html-evidence-results-review.tsx:235:        <SummaryItem label="Skipped URLs" value={review.counts.skippedUrls} />
lib/discovery-manual-crawler.ts:7:export const MANUAL_CRAWLER_SOURCE_KIND = "manual_curated_urls";
lib/discovery-manual-crawler.ts:50:  urls: ValidatedManualCrawlerUrl[];
lib/discovery-manual-crawler.ts:170:  if (!Array.isArray(body.urls)) {
lib/discovery-manual-crawler.ts:174:  if (body.urls.length < 1) {
lib/discovery-manual-crawler.ts:178:  if (body.urls.length > MANUAL_CRAWLER_MAX_URLS) {
lib/discovery-manual-crawler.ts:182:  const seenUrls = new Set<string>();
lib/discovery-manual-crawler.ts:183:  const urls = body.urls.map((item, index) => {
lib/discovery-manual-crawler.ts:191:    if (seenUrls.has(url)) {
lib/discovery-manual-crawler.ts:195:    seenUrls.add(url);
lib/discovery-manual-crawler.ts:211:    urls,
lib/discovery-manual-crawler.ts:269:    requested_url_count: request.urls.length,
lib/discovery-manual-crawler.ts:277:    policy_reviews: request.urls.map((item) => item.policyReview),
lib/discovery-manual-metadata-fetch.ts:41:  totalUrls: number;
lib/discovery-manual-metadata-fetch.ts:42:  fetchedUrls: number;
lib/discovery-manual-metadata-fetch.ts:43:  failedUrls: number;
lib/discovery-manual-metadata-fetch.ts:44:  skippedUrls: number;
lib/discovery-manual-metadata-fetch.ts:155:  const fetchedUrls = fetchResults.filter(
lib/discovery-manual-metadata-fetch.ts:160:    totalUrls: fetchResults.length,
lib/discovery-manual-metadata-fetch.ts:161:    fetchedUrls,
lib/discovery-manual-metadata-fetch.ts:162:    failedUrls: fetchResults.length - fetchedUrls,
lib/discovery-manual-metadata-fetch.ts:163:    skippedUrls: 0,
lib/discovery-run-results-review.ts:53:    totalUrls: number;
lib/discovery-run-results-review.ts:54:    processedUrls: number;
```

## Interpretation boundary

The presence of source identifiers and files does not by itself prove that controls are complete, correctly ordered, effective at runtime, or safe in production.

## Current result

`SECURITY_AUTHORIZATION_STATIC_CANDIDATES_INVENTORIED`
