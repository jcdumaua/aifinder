# Phase 26XS — Audit Access Static Dependency Inventory

## Bound baseline

`5f1c33367bbaff973fd07fa93a7a9aba1f71392e`

## Repository-only inventory

```text
=== Direct audit relation references ===
app/api/admin/audit-logs/route.ts:79:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:96:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:140:    .from("admin_audit_archives")
app/api/admin/audit-logs/route.ts:163:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:174:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:191:    .from("admin_audit_archives")
lib/supabase/database.types.ts:17:      admin_audit_archives: {
lib/supabase/database.types.ts:53:      admin_audit_logs: {
lib/admin-audit-log.ts:69:    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql:25:  AND c.relname = 'admin_audit_logs_id_seq'
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql:49:  AND seq.relname = 'admin_audit_logs_id_seq'
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql:65:  AND object_name = 'admin_audit_logs_id_seq'
scripts/discovery-admin-audit-sequence-metadata-execution-wrapper-candidate.sh:109:if "admin_audit_logs_id_seq" not in lower:
scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql:41:  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql:63:  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql:79:  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql:95:  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql:109:  AND c.relname IN ('admin_audit_logs', 'admin_audit_archives')
scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql:123:  AND table_name IN ('admin_audit_logs', 'admin_audit_archives')

=== Supabase client construction references ===
app/category/[slug]/page.tsx:7:import { supabaseAdmin } from "../../../lib/supabase-admin";
app/category/[slug]/page.tsx:125:  const { data, error } = await supabaseAdmin
app/sitemap.ts:2:import { supabaseAdmin } from "../lib/supabase-admin";
app/sitemap.ts:17:  const { data, error } = await supabaseAdmin
app/compare/page.tsx:6:import { supabaseAdmin } from "../../lib/supabase-admin";
app/compare/page.tsx:58:  const { data, error } = await supabaseAdmin
app/api/upload-logo/route.ts:2:import { supabaseAdmin } from "../../../lib/supabase-admin";
app/api/upload-logo/route.ts:181:    const { error } = await supabaseAdmin.storage
app/api/upload-logo/route.ts:198:    const { data } = supabaseAdmin.storage
app/api/submit-tool/route.ts:32:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
app/api/submit-tool/route.ts:240:    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
app/api/admin/audit-logs/route.ts:4:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/admin/audit-logs/route.ts:78:  const { count, error: countError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:95:  const { data: logsToArchive, error: fetchError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:126:  const { error: uploadError } = await supabaseAdmin.storage
app/api/admin/audit-logs/route.ts:139:  const { error: archiveInsertError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:156:    await supabaseAdmin.storage.from(ARCHIVE_BUCKET).remove([storagePath]);
app/api/admin/audit-logs/route.ts:162:  const { error: deleteError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:173:  const { data, error } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:190:  const { data, error } = await supabaseAdmin
app/api/admin/upload-logo/route.ts:8:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/admin/upload-logo/route.ts:232:    const { error } = await supabaseAdmin.storage
app/api/admin/upload-logo/route.ts:249:    const { data } = supabaseAdmin.storage
app/api/admin/tools/route.ts:7:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/admin/tools/route.ts:173:  let query = supabaseAdmin
app/api/admin/tools/route.ts:197:  let query = supabaseAdmin
app/api/admin/tools/route.ts:225:    const { data, error } = await supabaseAdmin
app/api/admin/tools/route.ts:277:    const { error } = await supabaseAdmin.from("tools").insert([
app/api/admin/tools/route.ts:362:    const { data, error } = await supabaseAdmin
app/api/admin/tools/route.ts:425:    const { data, error } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:11:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:171:  const { data: existingTools, error: existingToolsError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:212:  const { data: updatedTools, error: updateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:243:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/route.ts:3:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/route.ts:108:  let query = supabaseAdmin
app/api/admin/discovery/discovered-tools/route.ts:171:    ? await supabaseAdmin
app/api/admin/discovery/discovered-tools/route.ts:186:    ? await supabaseAdmin
app/api/admin/discovery/discovered-tools/route.ts:201:    ? await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:11:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:108:  const { data: approvedToolId, error } = await supabaseAdmin.rpc(
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:11:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:220:  const { data: discoveredTool, error: discoveredToolError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:238:  const { data: duplicateCandidate, error: duplicateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:262:  const { data: updatedTool, error: updateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:283:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:8:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/discovered-tools/[id]/route.ts:52:  const { data: tool, error: toolError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:70:  const { data: evidence, error: evidenceError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:84:  const { data: duplicateCandidates, error: duplicateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:98:    const { data: auditEvents, error: auditError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:115:      ? await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:132:      ? await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:280:  const { data: existingTool, error: existingToolError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:318:  const { data: updatedTool, error: updateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:333:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:11:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/discovery/intake/route.ts:166:  await supabaseAdmin
app/api/admin/discovery/intake/route.ts:171:  await supabaseAdmin
app/api/admin/discovery/intake/route.ts:176:  await supabaseAdmin
app/api/admin/discovery/intake/route.ts:181:  await supabaseAdmin
app/api/admin/discovery/intake/route.ts:187:    await supabaseAdmin
app/api/admin/discovery/intake/route.ts:287:    await supabaseAdmin
app/api/admin/discovery/intake/route.ts:317:  const { data: liveTools, error: liveToolsError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:333:    await supabaseAdmin
app/api/admin/discovery/intake/route.ts:391:      await supabaseAdmin
app/api/admin/discovery/intake/route.ts:417:  const { data: discoveryRun, error: discoveryRunError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:447:    await supabaseAdmin
app/api/admin/discovery/intake/route.ts:480:    await supabaseAdmin
app/api/admin/discovery/intake/route.ts:493:  const { data: evidence, error: evidenceError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:537:      await supabaseAdmin
app/api/admin/discovery/intake/route.ts:577:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:615:    const { error: sourceUpdateError } = await supabaseAdmin
app/api/admin/discovery/sources/route.ts:11:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/discovery/sources/route.ts:157:  let query = supabaseAdmin
app/api/admin/discovery/sources/route.ts:280:  const { data: existingSource, error: existingSourceError } = await supabaseAdmin
app/api/admin/discovery/sources/route.ts:304:  const { data: source, error: insertError } = await supabaseAdmin
app/api/admin/discovery/sources/route.ts:328:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/sources/[id]/route.ts:11:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/sources/[id]/route.ts:315:      await supabaseAdmin
app/api/admin/discovery/sources/[id]/route.ts:341:  const { data: previousSource, error: previousSourceError } = await supabaseAdmin
app/api/admin/discovery/sources/[id]/route.ts:359:  const { data: source, error: updateError } = await supabaseAdmin
app/api/admin/discovery/sources/[id]/route.ts:382:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/candidate-staging-queue/route.ts:249:  const { supabaseAdmin } = await import("../../../../../lib/supabase-admin");
app/api/admin/discovery/candidate-staging-queue/route.ts:251:  return supabaseAdmin as unknown as CandidateStagingQueueReadClient;
app/api/admin/discovery/runs/manual/route.ts:17:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
app/api/admin/discovery/runs/manual/route.ts:107:  const { data: source, error: sourceError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/route.ts:134:  const { data: activeRuns, error: activeRunError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/route.ts:167:  const { data: discoveryRun, error: insertRunError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/route.ts:212:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:42:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
app/api/admin/discovery/runs/manual/claim/route.ts:289:  const { error } = await supabaseAdmin.from("discovery_audit_events").insert({
app/api/admin/discovery/runs/manual/claim/route.ts:856:  const { data: runningRuns, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:894:    const { data: recoveredRun, error: recoveryError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:957:    const { data: failedRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1040:    const { data: completedRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1109:  const { data: failedRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1204:    const { data: failedRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1332:  const { data: finalRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1467:    const { data: failedRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1556:    const { data: failedRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1644:  const { data: completedRun, error } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1775:  const { data: discoveryRun, error: runError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1810:  const { data: source, error: sourceError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:1880:    const { data: rejectedRun, error: rejectError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:2072:  const { data: claimedRun, error: claimError } = await supabaseAdmin
app/api/admin/discovery/runs/manual/claim/route.ts:2179:  const { data: completedRun, error: completeError } = await supabaseAdmin
app/api/admin/discovery/runs/route.ts:6:import { supabaseAdmin } from "../../../../../lib/supabase-admin";
app/api/admin/discovery/runs/route.ts:98:  let query = supabaseAdmin
app/api/admin/discovery/runs/route.ts:171:    const { data: auditRows, error: auditError } = await supabaseAdmin
app/api/admin/submissions/route.ts:7:import { supabaseAdmin } from "../../../../lib/supabase-admin";
app/api/admin/submissions/route.ts:177:  const { data, error } = await supabaseAdmin
app/api/admin/submissions/route.ts:204:  const { data, error } = await supabaseAdmin
app/api/admin/submissions/route.ts:237:    const { data: submissions, error: submissionsError } = await supabaseAdmin
app/api/admin/submissions/route.ts:251:    const { count: totalTools, error: totalToolsError } = await supabaseAdmin
app/api/admin/submissions/route.ts:257:      await supabaseAdmin
app/api/admin/submissions/route.ts:263:      await supabaseAdmin
app/api/admin/submissions/route.ts:269:      await supabaseAdmin
app/api/admin/submissions/route.ts:310:    const { data: submission, error: fetchError } = await supabaseAdmin
app/api/admin/submissions/route.ts:354:    const { error: approvalError } = await supabaseAdmin.rpc(
app/api/admin/submissions/route.ts:441:    const { data, error } = await supabaseAdmin
app/api/admin/submissions/route.ts:506:    const { data, error } = await supabaseAdmin
app/tool/[slug]/page.tsx:3:import { supabaseAdmin } from "../../../lib/supabase-admin";
app/tool/[slug]/page.tsx:112:  const { data, error } = await supabaseAdmin
lib/homepage-control-public.ts:4:import { supabaseAdmin } from "./supabase-admin";
lib/homepage-control-public.ts:60:  const { data: rawTools, error } = await supabaseAdmin
lib/homepage-control-public.ts:164:    const { data, error } = await supabaseAdmin
lib/supabase-admin.ts:4:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
lib/supabase-admin.ts:6:export const supabaseAdmin = createClient(
lib/discovery/discovery-candidate-staging-admin.ts:246:    const client = await createClient();
lib/discovery/discovery-supabase-admin.ts:7:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
lib/discovery/discovery-candidate-decision-admin.ts:135:  const { supabaseAdmin } = await import("../supabase-admin");
lib/discovery/discovery-candidate-decision-admin.ts:137:  return supabaseAdmin as unknown as DiscoveryCandidateDecisionMutationClient;
lib/homepage-control-admin.ts:16:import { supabaseAdmin } from "./supabase-admin";
lib/homepage-control-admin.ts:207:  const { data: publicSafeRows, error: publicSafeError } = await supabaseAdmin
lib/homepage-control-admin.ts:650:  const { error } = await supabaseAdmin
lib/homepage-control-admin.ts:684:    const { data: insertedDraft, error: draftInsertError } = await supabaseAdmin
lib/homepage-control-admin.ts:716:    const { error: auditInsertError } = await supabaseAdmin
lib/homepage-control-admin.ts:767:    const { data, error } = await supabaseAdmin
lib/homepage-control-admin.ts:826:    const { data, error } = await supabaseAdmin
lib/homepage-control-admin.ts:893:    const { data, error } = await supabaseAdmin
lib/homepage-control-admin.ts:1034:    const { data: updatedRun, error: upsertError } = await supabaseAdmin
lib/homepage-control-admin.ts:1071:    const { error: auditInsertError } = await supabaseAdmin
lib/homepage-control-admin.ts:1151:    const { error } = await supabaseAdmin
lib/homepage-control-admin.ts:1249:    const { data, error } = await supabaseAdmin.rpc(
lib/homepage-control-admin.ts:1414:    const { data: updatedConfig, error: updateError } = await supabaseAdmin
lib/homepage-control-admin.ts:1450:      const { error: rollbackError } = await supabaseAdmin
lib/homepage-control-admin.ts:1474:    const { error: auditInsertError } = await supabaseAdmin
lib/homepage-control-admin.ts:1492:      const { error: rollbackError } = await supabaseAdmin
lib/homepage-control-admin.ts:1629:    const { data: updatedDraft, error: updateError } = await supabaseAdmin
lib/homepage-control-admin.ts:1665:    const { error: auditInsertError } = await supabaseAdmin
lib/homepage-control-admin.ts:1687:      const { error: rollbackError } = await supabaseAdmin
lib/homepage-control-admin.ts:1791:    const { data, error } = await supabaseAdmin
lib/supabase.ts:6:export const supabase = createClient(
lib/admin-audit-log.ts:1:import { supabaseAdmin } from "./supabase-admin";
lib/admin-audit-log.ts:69:    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([

=== Browser/client audit access candidates ===
app/api/admin/audit-logs/route.ts:79:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:96:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:140:    .from("admin_audit_archives")
app/api/admin/audit-logs/route.ts:163:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:174:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:191:    .from("admin_audit_archives")
```

## Classification boundary

This inventory is static repository evidence only. It does not prove runtime identity, deployed environment configuration, or production request behavior.

Grant revocations remain excluded from the migration drafts unless independent review confirms that all legitimate audit access is server-only and service-role backed.

## Current disposition

`DEPENDENCY_TRACE_CAPTURED_GRANT_REVOCATION_NOT_YET_AUTHORIZED`
