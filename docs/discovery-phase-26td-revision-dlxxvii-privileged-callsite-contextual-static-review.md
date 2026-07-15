# Phase 26TD — Privileged Call-Site Contextual Static Review

## Bound baseline

`34b6d7bf4aba3f6d18c5b9bf948edb8bdbca7af2`

## Inspection boundary

Committed source surrounding privileged Supabase client and RPC references was read statically.

No source was executed. No database, route, server, network service, environment value, credential, token, cookie, build artifact, or production system was accessed.

## Inventory result

- Privileged-reference matches: `154`
- Files with privileged-reference context: `28`

## Contextual evidence

```text
### FILE: app/api/admin/audit-logs/route.ts
1-import { gzipSync } from "zlib";
2-import { NextResponse } from "next/server";
3-import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
4:import { supabaseAdmin } from "../../../../lib/supabase-admin";
5-
6-export const runtime = "nodejs";
7-export const dynamic = "force-dynamic";
8-
9-const LIVE_LOG_LIMIT = 100;
10-const DISPLAY_LOG_LIMIT = 50;
11-const ARCHIVE_BUCKET = "admin-audit-archives";
12-
--
70-  const now = new Date();
71-  const year = now.getUTCFullYear();
72-  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
73-
74-  return `audit-logs/${year}/${month}/${fileName}`;
75-}
76-
77-async function archiveOverflowAuditLogs() {
78:  const { count, error: countError } = await supabaseAdmin
79-    .from("admin_audit_logs")
80-    .select("id", { count: "exact", head: true });
81-
82-  if (countError) {
83-    console.error("Audit log count error:", countError.message);
84-    return;
85-  }
86-
87-  const totalLogs = count || 0;
88-
89-  if (totalLogs <= LIVE_LOG_LIMIT) {
90-    return;
91-  }
92-
93-  const archiveCount = totalLogs - LIVE_LOG_LIMIT;
94-
95:  const { data: logsToArchive, error: fetchError } = await supabaseAdmin
96-    .from("admin_audit_logs")
97-    .select(
98-      "id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at"
99-    )
100-    .order("created_at", { ascending: true })
101-    .limit(archiveCount);
102-
103-  if (fetchError || !logsToArchive || logsToArchive.length === 0) {
--
118-  };
119-
120-  const compactJson = JSON.stringify(archivePayload);
121-  const compressed = gzipSync(Buffer.from(compactJson, "utf8"), { level: 9 });
122-
123-  const fileName = getArchiveFileName(firstLogAt, lastLogAt);
124-  const storagePath = getArchiveStoragePath(fileName);
125-
126:  const { error: uploadError } = await supabaseAdmin.storage
127-    .from(ARCHIVE_BUCKET)
128-    .upload(storagePath, compressed, {
129-      contentType: "application/gzip",
130-      cacheControl: "3600",
131-      upsert: false,
132-    });
133-
134-  if (uploadError) {
135-    console.error("Audit archive upload error:", uploadError.message);
136-    return;
137-  }
138-
139:  const { error: archiveInsertError } = await supabaseAdmin
140-    .from("admin_audit_archives")
141-    .insert([
142-      {
143-        file_name: fileName,
144-        storage_bucket: ARCHIVE_BUCKET,
145-        storage_path: storagePath,
146-        log_count: typedLogs.length,
147-        compressed_size_bytes: compressed.byteLength,
148-        first_log_at: firstLogAt,
149-        last_log_at: lastLogAt,
150-      },
151-    ]);
152-
153-  if (archiveInsertError) {
154-    console.error("Audit archive DB insert error:", archiveInsertError.message);
155-
156:    await supabaseAdmin.storage.from(ARCHIVE_BUCKET).remove([storagePath]);
157-    return;
158-  }
159-
160-  const idsToDelete = typedLogs.map((log) => log.id);
161-
162:  const { error: deleteError } = await supabaseAdmin
163-    .from("admin_audit_logs")
164-    .delete()
165-    .in("id", idsToDelete);
166-
167-  if (deleteError) {
168-    console.error("Audit archived logs delete error:", deleteError.message);
169-  }
170-}
171-
172-async function getRecentAuditLogs() {
173:  const { data, error } = await supabaseAdmin
174-    .from("admin_audit_logs")
175-    .select(
176-      "id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at"
177-    )
178-    .order("created_at", { ascending: false })
179-    .limit(DISPLAY_LOG_LIMIT);
180-
181-  if (error) {
182-    console.error("Admin audit logs load error:", error.message);
183-    throw new Error("Failed to load audit logs.");
184-  }
185-
186-  return ((data || []) as AuditLogRow[]).map(cleanAuditLog);
187-}
188-
189-async function getAuditArchives() {
190:  const { data, error } = await supabaseAdmin
191-    .from("admin_audit_archives")
192-    .select(
193-      "id, file_name, storage_bucket, storage_path, log_count, compressed_size_bytes, first_log_at, last_log_at, created_at"
194-    )
195-    .order("created_at", { ascending: false })
196-    .limit(50);
197-
198-  if (error) {

### FILE: app/api/admin/discovery/candidate-staging-queue/route.ts
241-  ) {
242-    return error.code;
243-  }
244-
245-  return "candidate_queue_read_failed";
246-}
247-
248-async function getDefaultCandidateStagingQueueReadClient() {
249:  const { supabaseAdmin } = await import("../../../../../lib/supabase-admin");
250-
251:  return supabaseAdmin as unknown as CandidateStagingQueueReadClient;
252-}
253-
254-export function createCandidateStagingQueueReadHandler(
255-  dependencies: CandidateStagingQueueReadRouteDependencies = {},
256-) {
257-  return async function candidateStagingQueueReadHandler(request: Request) {
258-    const adminSession = (
259-      dependencies.verifyAdminSession || verifyAdminSession

### FILE: app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
3-  verifyAdminCsrfRequest,
4-  verifyAdminSession,
5-} from "../../../../../../../lib/admin-auth";
6-import {
7-  ADMIN_RATE_LIMIT_ACTIONS,
8-  checkAdminRateLimit,
9-  getAdminRateLimitResponseData,
10-} from "../../../../../../../lib/admin-rate-limit";
11:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
12-
13-export const runtime = "nodejs";
14-export const dynamic = "force-dynamic";
15-
16-type RouteContext = {
17-  params: Promise<{
18-    id: string;
19-  }>;
--
100-  }
101-
102-  const { id } = await context.params;
103-
104-  if (!isValidUuid(id)) {
105-    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
106-  }
107-
108:  const { data: approvedToolId, error } = await supabaseAdmin.rpc(
109-    "approve_discovered_tool",
110-    {
111-      p_discovered_tool_id: id,
112-      p_actor_id: adminSession.actor.id,
113-      p_actor_label: adminSession.actor.label,
114-    }
115-  );
116-

### FILE: app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
3-  verifyAdminCsrfRequest,
4-  verifyAdminSession,
5-} from "../../../../../../../lib/admin-auth";
6-import {
7-  ADMIN_RATE_LIMIT_ACTIONS,
8-  checkAdminRateLimit,
9-  getAdminRateLimitResponseData,
10-} from "../../../../../../../lib/admin-rate-limit";
11:import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
12-
13-export const runtime = "nodejs";
14-export const dynamic = "force-dynamic";
15-
16-type RouteContext = {
17-  params: Promise<{
18-    id: string;
19-  }>;
--
212-    }
213-  } catch (error) {
214-    return jsonResponse(
215-      { error: error instanceof Error ? error.message : "Invalid duplicate data." },
216-      400
217-    );
218-  }
219-
220:  const { data: discoveredTool, error: discoveredToolError } = await supabaseAdmin
221-    .from("discovered_tools")
222-    .select("id, status")
223-    .eq("id", id)
224-    .maybeSingle();
225-
226-  if (discoveredToolError) {
227-    console.error("Failed to load discovered tool before duplicate mark.", {
228-      message: discoveredToolError.message,
--
230-
231-    return jsonResponse({ error: "Failed to mark duplicate." }, 500);
232-  }
233-
234-  if (!discoveredTool) {
235-    return jsonResponse({ error: "Discovered tool not found." }, 404);
236-  }
237-
238:  const { data: duplicateCandidate, error: duplicateError } = await supabaseAdmin
239-    .from("discovery_duplicate_candidates")
240-    .insert({
241-      discovered_tool_id: id,
242-      candidate_type: candidateType,
243-      candidate_tool_id: candidateToolId,
244-      candidate_submission_id: candidateSubmissionId,
245-      candidate_discovered_tool_id: candidateDiscoveredToolId,
246-      match_type: matchType,
--
254-  if (duplicateError) {
255-    console.error("Failed to create Discovery Engine duplicate candidate.", {
256-      message: duplicateError.message,
257-    });
258-
259-    return jsonResponse({ error: "Failed to mark duplicate." }, 500);
260-  }
261-
262:  const { data: updatedTool, error: updateError } = await supabaseAdmin
263-    .from("discovered_tools")
264-    .update({
265-      status: "duplicate",
266-      updated_at: new Date().toISOString(),
267-    })
268-    .eq("id", id)
269-    .select("id, status, updated_at")
270-    .single();
--
275-    });
276-
277-    return jsonResponse(
278-      { error: "Duplicate candidate created, but status update failed." },
279-      500
280-    );
281-  }
282-
283:  const { error: auditError } = await supabaseAdmin
284-    .from("discovery_audit_events")
285-    .insert({
286-      discovered_tool_id: id,
287-      action: "mark-duplicate",
288-      actor_id: adminSession.actor.id,
289-      actor_label: adminSession.actor.label,
290-      message: "Marked discovered tool as duplicate.",
291-      metadata: {

### FILE: app/api/admin/discovery/discovered-tools/[id]/route.ts
1-import { NextResponse } from "next/server";
2-import { verifyAdminCsrfRequest, verifyAdminSession } from "../../../../../../lib/admin-auth";
3-import {
4-  ADMIN_RATE_LIMIT_ACTIONS,
5-  checkAdminRateLimit,
6-  getAdminRateLimitResponseData,
7-} from "../../../../../../lib/admin-rate-limit";
8:import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
9-
10-export const runtime = "nodejs";
11-export const dynamic = "force-dynamic";
12-
13-type RouteContext = {
14-  params: Promise<{
15-    id: string;
16-  }>;
--
44-  }
45-
46-  const { id } = await context.params;
47-
48-  if (!isValidUuid(id)) {
49-    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
50-  }
51-
52:  const { data: tool, error: toolError } = await supabaseAdmin
53-    .from("discovered_tools")
54-    .select("*")
55-    .eq("id", id)
56-    .maybeSingle();
57-
58-  if (toolError) {
59-    console.error("Failed to fetch Discovery Engine discovered tool detail.", {
60-      message: toolError.message,
--
62-
63-    return jsonResponse({ error: "Failed to fetch discovered tool." }, 500);
64-  }
65-
66-  if (!tool) {
67-    return jsonResponse({ error: "Discovered tool not found." }, 404);
68-  }
69-
70:  const { data: evidence, error: evidenceError } = await supabaseAdmin
71-    .from("discovery_evidence")
72-    .select("*")
73-    .eq("discovered_tool_id", id)
74-    .order("created_at", { ascending: false });
75-
76-  if (evidenceError) {
77-    console.error("Failed to fetch Discovery Engine evidence.", {
78-      message: evidenceError.message,
79-    });
80-
81-    return jsonResponse({ error: "Failed to fetch discovery evidence." }, 500);
82-  }
83-
84:  const { data: duplicateCandidates, error: duplicateError } = await supabaseAdmin
85-    .from("discovery_duplicate_candidates")
86-    .select("*")
87-    .eq("discovered_tool_id", id)
88-    .order("created_at", { ascending: false });
89-
90-  if (duplicateError) {
91-    console.error("Failed to fetch Discovery Engine duplicate candidates.", {
92-      message: duplicateError.message,
93-    });
94-
95-    return jsonResponse({ error: "Failed to fetch duplicate candidates." }, 500);
96-  }
97-
98:    const { data: auditEvents, error: auditError } = await supabaseAdmin
99-      .from("discovery_audit_events")
100-      .select("id, action, actor_id, actor_label, message, metadata, created_at")
101-      .eq("discovered_tool_id", id)
102-      .order("created_at", { ascending: false })
103-      .limit(50);
104-
105-    if (auditError) {
106-      console.error("Failed to fetch Discovery Engine audit events.", {
107-        message: auditError.message,
108-      });
109-
110-      return jsonResponse({ error: "Failed to fetch audit events." }, 500);
111-    }
112-
113-  const { data: source, error: sourceError } =
114-    typeof tool.source_id === "string"
115:      ? await supabaseAdmin
116-          .from("discovery_sources")
117-          .select("id, name, slug, source_type, is_active, last_run_at, url")
118-          .eq("id", tool.source_id)
119-          .maybeSingle()
120-      : { data: null, error: null };
121-
122-  if (sourceError) {
123-    console.error("Failed to fetch Discovery Engine source detail.", {
124-      message: sourceError.message,
125-    });
126-
127-    return jsonResponse({ error: "Failed to fetch discovery source." }, 500);
128-  }
129-
130-  const { data: run, error: runError } =
131-    typeof tool.run_id === "string"
132:      ? await supabaseAdmin
133-          .from("discovery_runs")
134-          .select("id, source_id, status, stats, error_log, started_at, finished_at, created_at")
135-          .eq("id", tool.run_id)
136-          .maybeSingle()
137-      : { data: null, error: null };
138-
139-  if (runError) {
140-    console.error("Failed to fetch Discovery Engine run detail.", {
--
272-    reason = getOptionalReason(body.reason);
273-  } catch (error) {
274-    return jsonResponse(
275-      { error: error instanceof Error ? error.message : "Invalid reason." },
276-      400
277-    );
278-  }
279-
280:  const { data: existingTool, error: existingToolError } = await supabaseAdmin
281-    .from("discovered_tools")
282-    .select("id, status")
283-    .eq("id", id)
284-    .maybeSingle();
285-
286-  if (existingToolError) {
287-    console.error("Failed to load Discovery Engine tool before status update.", {
288-      message: existingToolError.message,
--
310-    status,
311-    updated_at: new Date().toISOString(),
312-  };
313-
314-  if (status === "rejected" && reason) {
315-    updatePayload.rejected_reason = reason;
```

## Per-call-site review requirements

Each privileged call path must establish:

1. server-only execution boundary;
2. authenticated caller where applicable;
3. explicit role or permission check before privileged access;
4. narrow table, RPC, or operation scope;
5. validated input before database invocation;
6. no privileged operation before authorization succeeds;
7. safe handling of returned rows and errors;
8. no sensitive payload logging;
9. no direct or transitive client exposure.

## Contextual classifications

A call site may be classified only as one of:

- `LOCAL_AUTH_AND_AUTHORIZATION_EVIDENCE_PRESENT`
- `AUTHENTICATION_PRESENT_AUTHORIZATION_UNCLEAR`
- `PRIVILEGED_CALL_WITHOUT_LOCAL_AUTH_EVIDENCE`
- `SERVER_INTERNAL_NON_USER_ENTRY_REQUIRES_CALLER_TRACE`
- `INSUFFICIENT_CONTEXT_REQUIRES_MANUAL_REVIEW`

## Current determination

`PRIVILEGED_CALL_SITES_CONTEXT_COLLECTED_COMPLETE_SECURITY_CLOSURE_NOT_ESTABLISHED`
