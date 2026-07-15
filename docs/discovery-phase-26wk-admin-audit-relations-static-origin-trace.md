# Phase 26WK — Admin Audit Relations Static Origin Trace

## Bound baseline

`3a6cb8662c62fcab861436f21a2586bc3821ee6e`

## Live observation

The live catalog returned:

- `public.admin_audit_archives`: RLS enabled, zero policies;
- `public.admin_audit_logs`: RLS enabled, zero policies.

## Repository-wide relation hits

```text
app/api/admin/audit-logs/route.ts:79:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:96:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:140:    .from("admin_audit_archives")
app/api/admin/audit-logs/route.ts:163:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:174:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:191:    .from("admin_audit_archives")
docs/discovery-phase-26vy-live-rls-static-reconciliation-plan.md:51:- `admin_audit_archives`
docs/discovery-phase-26vy-live-rls-static-reconciliation-plan.md:52:- `admin_audit_logs`
docs/discovery-phase-26tj-revision-dlxxxiii-secret-safe-logging-findings-disposition.md:25:79-    .from("admin_audit_logs")
docs/discovery-phase-26tj-revision-dlxxxiii-secret-safe-logging-findings-disposition.md:39:96-    .from("admin_audit_logs")
docs/discovery-phase-26tj-revision-dlxxxiii-secret-safe-logging-findings-disposition.md:70:140-    .from("admin_audit_archives")
docs/discovery-phase-26tj-revision-dlxxxiii-secret-safe-logging-findings-disposition.md:92:163-    .from("admin_audit_logs")
docs/discovery-phase-26tj-revision-dlxxxiii-secret-safe-logging-findings-disposition.md:103:174-    .from("admin_audit_logs")
docs/discovery-phase-26tj-revision-dlxxxiii-secret-safe-logging-findings-disposition.md:120:191-    .from("admin_audit_archives")
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:555:5. Are zero policies on `admin_audit_archives` and `admin_audit_logs` intentional?
docs/discovery-phase-26td-revision-dlxxvii-privileged-callsite-contextual-static-review.md:44:79-    .from("admin_audit_logs")
docs/discovery-phase-26td-revision-dlxxvii-privileged-callsite-contextual-static-review.md:61:96-    .from("admin_audit_logs")
docs/discovery-phase-26td-revision-dlxxvii-privileged-callsite-contextual-static-review.md:92:140-    .from("admin_audit_archives")
docs/discovery-phase-26td-revision-dlxxvii-privileged-callsite-contextual-static-review.md:115:163-    .from("admin_audit_logs")
docs/discovery-phase-26td-revision-dlxxvii-privileged-callsite-contextual-static-review.md:126:174-    .from("admin_audit_logs")
docs/discovery-phase-26td-revision-dlxxvii-privileged-callsite-contextual-static-review.md:143:191-    .from("admin_audit_archives")
docs/discovery-phase-26wh-live-rls-static-reconciliation-disposition.md:29:`admin_audit_archives` and `admin_audit_logs` are live with RLS enabled and zero policies, but their initialization source was not established by the current migration search.
docs/discovery-phase-26vx-live-rls-metadata-sanitized-result.md:26:1. `admin_audit_archives`
docs/discovery-phase-26vx-live-rls-metadata-sanitized-result.md:27:2. `admin_audit_logs`
docs/discovery-phase-26vx-live-rls-metadata-sanitized-result.md:46:| `admin_audit_archives` | 0 |
docs/discovery-phase-26vx-live-rls-metadata-sanitized-result.md:47:| `admin_audit_logs` | 0 |
docs/discovery-phase-26vx-live-rls-metadata-sanitized-result.md:68:- `admin_audit_archives` and `admin_audit_logs` have RLS enabled with zero policies.
docs/discovery-phase-26th-revision-dlxxxi-privileged-callsite-findings-disposition.md:51:79-    .from("admin_audit_logs")
docs/discovery-phase-26th-revision-dlxxxi-privileged-callsite-findings-disposition.md:68:96-    .from("admin_audit_logs")
docs/discovery-phase-26th-revision-dlxxxi-privileged-callsite-findings-disposition.md:107:140-    .from("admin_audit_archives")
docs/discovery-phase-26th-revision-dlxxxi-privileged-callsite-findings-disposition.md:130:163-    .from("admin_audit_logs")
docs/discovery-phase-26th-revision-dlxxxi-privileged-callsite-findings-disposition.md:141:174-    .from("admin_audit_logs")
docs/discovery-phase-26th-revision-dlxxxi-privileged-callsite-findings-disposition.md:158:191-    .from("admin_audit_archives")
docs/discovery-phase-26tf-revision-dlxxix-secret-safe-logging-contextual-review.md:23:79-    .from("admin_audit_logs")
docs/discovery-phase-26tf-revision-dlxxix-secret-safe-logging-contextual-review.md:60:140-    .from("admin_audit_archives")
docs/discovery-phase-26tf-revision-dlxxix-secret-safe-logging-contextual-review.md:78:163-    .from("admin_audit_logs")
docs/discovery-phase-26tf-revision-dlxxix-secret-safe-logging-contextual-review.md:89:174-    .from("admin_audit_logs")
lib/supabase/database.types.ts:17:      admin_audit_archives: {
lib/supabase/database.types.ts:53:      admin_audit_logs: {
lib/admin-audit-log.ts:69:    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([
```

## Source access hits

```text
app/api/submit-tool/route.ts:83:    .from("tools")
app/api/admin/audit-logs/route.ts:79:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:96:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:140:    .from("admin_audit_archives")
app/api/admin/audit-logs/route.ts:163:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:174:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:191:    .from("admin_audit_archives")
app/api/admin/tools/route.ts:174:    .from("tools")
app/api/admin/tools/route.ts:198:    .from("tools")
app/api/admin/tools/route.ts:226:      .from("tools")
app/api/admin/tools/route.ts:277:    const { error } = await supabaseAdmin.from("tools").insert([
app/api/admin/tools/route.ts:363:      .from("tools")
app/api/admin/tools/route.ts:426:      .from("tools")
app/api/admin/discovery/intake/route.ts:318:    .from("tools")
app/api/admin/submissions/route.ts:178:    .from("tools")
app/api/admin/submissions/route.ts:252:      .from("tools")
lib/homepage-control-admin.ts:1792:      .from("tools")
lib/admin-audit-log.ts:69:    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([
```

## Trace objective

Determine whether each relation originated from:

1. a committed migration;
2. an archived or renamed migration;
3. application bootstrap or test code;
4. manual database initialization outside current source control;
5. a prior system version no longer represented in the repository.

## Security posture

RLS enabled with zero policies remains fail-closed for ordinary roles. This trace does not authorize policy creation or schema mutation.

## Current disposition

`STATIC_ORIGIN_TRACE_COMPLETED_PENDING_REVIEW_FAIL_CLOSED`
