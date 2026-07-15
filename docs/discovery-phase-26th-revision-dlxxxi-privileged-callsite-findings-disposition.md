# Phase 26TH — Privileged Call-Site Findings Disposition

## Bound baseline

`0836a17ebf4fc27627d9e99fdbbd29a8b8971a2e`

## Scope

Static contextual classification of committed privileged Supabase and RPC call sites.

No source execution, build, server, route, database, network, environment value, credential, token, cookie, or production system was accessed.

## Files reviewed

`28`

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
13-type AuditLogRow = {
14-  id: number;
15-  action: string;
16-  target_type: string | null;
--
66-  return `admin-audit-logs_${firstText}_to_${lastText}_archived_${nowText}.json.gz`;
67-}
68-
69-function getArchiveStoragePath(fileName: string) {
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
104-    console.error("Audit log archive fetch error:", fetchError?.message);
105-    return;
106-  }
107-
--
114-    logCount: typedLogs.length,
115-    firstLogAt,
116-    lastLogAt,
117-    logs: typedLogs.map(cleanAuditLog),
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
199-    console.error("Admin audit archives load error:", error.message);
200-    throw new Error("Failed to load audit archives.");
201-  }
202-

### FILE: app/api/admin/discovery/candidate-staging-queue/route.ts
1-import { NextResponse } from "next/server";
2-import {
3:  verifyAdminSession,
4-  type VerifyAdminSessionResult,
5-} from "../../../../../lib/admin-auth";
6-import {
7-  listDiscoveryCandidateStagingQueueItems,
8-  type CandidateStagingQueueReadClient,
9-  type CandidateStagingQueueReadErrorCode,
10-  type CandidateStagingQueueSortDirection,
11-  type CandidateStagingQueueSortKey,
12-  type CandidateStagingQueueStatusFilter,
13-  type DiscoveryCandidateStagingQueueItem,
14-  type ListDiscoveryCandidateStagingQueueItemsInput,
15-} from "../../../../../lib/discovery/discovery-candidate-staging-queue-read-model";
--
36-  appliedStatuses: CandidateStagingQueueStatusFilter[];
37-};
38-
39-export type CandidateStagingQueueApiReadErrorResponse = {
40-  ok: false;
41-  error: {
42-    code: CandidateStagingQueueApiReadRouteErrorCode;
43-    message: string;
44-  };
45-};
46-
47-type CandidateStagingQueueReadRouteDependencies = {
48:  verifyAdminSession?: (request: Request) => VerifyAdminSessionResult;
49-  getClient?: () =>
50-    | CandidateStagingQueueReadClient
51-    | Promise<CandidateStagingQueueReadClient>;
52-  listQueueItems?: typeof listDiscoveryCandidateStagingQueueItems;
53-};
54-
55-const CANDIDATE_QUEUE_READ_ERROR_CODES = new Set<CandidateStagingQueueReadErrorCode>([
56-  "invalid_status_filter",
57-  "invalid_limit",
58-  "candidate_queue_invalid_cursor",
59-  "candidate_queue_cursor_mismatch",
60-  "candidate_queue_cursor_version_unsupported",
--
237-    typeof error === "object" &&
238-    error !== null &&
239-    "code" in error &&
240-    isCandidateQueueReadErrorCode(error.code)
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
258:    const adminSession = (
259:      dependencies.verifyAdminSession || verifyAdminSession
260-    )(request);
261-
262:    if (!adminSession.isAdmin || !adminSession.actor) {
263-      console.warn("Unauthorized candidate staging queue read request.", {
264:        errors: adminSession.errors,
265-      });
266-
267-      return jsonResponse(
268-        {
269-          ok: false,
270-          error: {
271-            code: "unauthorized",
272-            message: "Unauthorized.",
273-          },
274-        },
275-        401,
276-      );

### FILE: app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
1-import { NextResponse } from "next/server";
2-import {
3:  verifyAdminCsrfRequest,
4:  verifyAdminSession,
5-} from "../../../../../../../lib/admin-auth";
6-import {
7-  ADMIN_RATE_LIMIT_ACTIONS,
8:  checkAdminRateLimit,
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
20-};
21-
22-function jsonResponse(data: object, status = 200) {
23-  return NextResponse.json(data, {
--
63-  if (message.includes("must be new or pending_review")) {
64-    return message;
65-  }
66-
67-  if (message.includes("approved but missing approved_tool_id")) {
68-    return "Discovered tool approval state is inconsistent.";
69-  }
70-
71-  return "Failed to approve discovered tool.";
72-}
73-
74-export async function POST(request: Request, context: RouteContext) {
75:  const adminSession = verifyAdminSession(request);
76-
77:  if (!adminSession.isAdmin || !adminSession.actor) {
78-    console.warn("Unauthorized Discovery Engine approve request.", {
79:      errors: adminSession.errors,
80-    });
81-
82-    return jsonResponse({ error: "Unauthorized" }, 401);
83-  }
84-
85:  if (!verifyAdminCsrfRequest(request)) {
86-    return jsonResponse(
87-      { error: "Security token missing or expired. Please log in again." },
88-      403
89-    );
90-  }
91-
92:  const rateLimit = checkAdminRateLimit({
93-    request,
94-    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolApprove,
95:    actor: adminSession.actor,
96-  });
97-
98-  if (!rateLimit.allowed) {
99-    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
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
112:      p_actor_id: adminSession.actor.id,
113:      p_actor_label: adminSession.actor.label,
114-    }
115-  );
116-
117-  if (error) {
118-    console.error("Approve discovered tool RPC error.", {
119-      message: error.message,
120-    });
121-
122-    return jsonResponse(
123-      { error: getSafeApprovalError(error.message) },
124-      error.message?.includes("not found") ? 404 : 400
125-    );

### FILE: app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
1-import { NextResponse } from "next/server";
2-import {
3:  verifyAdminCsrfRequest,
4:  verifyAdminSession,
5-} from "../../../../../../../lib/admin-auth";
6-import {
7-  ADMIN_RATE_LIMIT_ACTIONS,
8:  checkAdminRateLimit,
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
20-};
21-
22-const VALID_CANDIDATE_TYPES = new Set([
23-  "tool",
--
108-
109-function getMatchScore(value: unknown) {
110-  const score = typeof value === "number" ? value : Number(value);
111-
112-  if (!Number.isFinite(score) || score < 0 || score > 100) {
113-    throw new Error("Match score must be between 0 and 100.");
114-  }
115-
116-  return score;
117-}
118-
119-export async function POST(request: Request, context: RouteContext) {
120:  const adminSession = verifyAdminSession(request);
121-
122:  if (!adminSession.isAdmin || !adminSession.actor) {
123-    console.warn("Unauthorized Discovery Engine duplicate request.", {
124:      errors: adminSession.errors,
125-    });
126-
127-    return jsonResponse({ error: "Unauthorized" }, 401);
128-  }
129-
130:  if (!verifyAdminCsrfRequest(request)) {
131-    return jsonResponse(
132-      { error: "Security token missing or expired. Please log in again." },
133-      403
134-    );
135-  }
136-
137:  const rateLimit = checkAdminRateLimit({
138-    request,
139-    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolDuplicate,
140:    actor: adminSession.actor,
141-  });
142-
143-  if (!rateLimit.allowed) {
144-    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
145-  }
146-
147-  const { id } = await context.params;
148-
149-  if (!isValidUuid(id)) {
150-    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
151-  }
152-
--
208-        throw new Error("Candidate discovered tool ID is invalid.");
209-      }
210-
211-      candidateDiscoveredToolId = body.candidate_discovered_tool_id;
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
229-    });
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
247-      match_score: matchScore,
248-      is_blocking: true,
249-      reason,
250-    })
251-    .select("*")
252-    .single();
253-
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
271-
272-  if (updateError) {
273-    console.error("Failed to update discovered tool duplicate status.", {
274-      message: updateError.message,
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
288:      actor_id: adminSession.actor.id,
289:      actor_label: adminSession.actor.label,
290-      message: "Marked discovered tool as duplicate.",
291-      metadata: {
292-        previous_status: discoveredTool.status,
293-        duplicate_candidate_id: duplicateCandidate.id,
294-        candidate_type: candidateType,
295-        candidate_tool_id: candidateToolId,
296-        candidate_submission_id: candidateSubmissionId,
297-        candidate_discovered_tool_id: candidateDiscoveredToolId,
298-        match_type: matchType,
299-        match_score: matchScore,
300-        reason,
301-      },

### FILE: app/api/admin/discovery/discovered-tools/[id]/route.ts
1-import { NextResponse } from "next/server";
2:import { verifyAdminCsrfRequest, verifyAdminSession } from "../../../../../../lib/admin-auth";
3-import {
4-  ADMIN_RATE_LIMIT_ACTIONS,
5:  checkAdminRateLimit,
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
17-};
18-
19-function jsonResponse(data: object, status = 200) {
20-  return NextResponse.json(data, {
--
24-      "X-Content-Type-Options": "nosniff",
25-    },
26-  });
27-}
28-
29-function isValidUuid(value: string) {
30-  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
31-    value
32-  );
33-}
34-
35-export async function GET(request: Request, context: RouteContext) {
36:  const adminSession = verifyAdminSession(request);
37-
38:  if (!adminSession.isAdmin || !adminSession.actor) {
39-    console.warn("Unauthorized Discovery Engine detail request.", {
40:      errors: adminSession.errors,
41-    });
42-
43-    return jsonResponse({ error: "Unauthorized" }, 401);
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
61-    });
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
```

## Disposition classes

### P1 — Local authentication and authorization present

Required evidence:

- identity verified;
- explicit admin or permission check;
- privileged call occurs after authorization;
- input validation is visible;
- no obvious sensitive logging.

Disposition: `STATICALLY_ACCEPTABLE_PENDING_BUILD_AND_RUNTIME_PROOF`

### P2 — Authentication present, authorization unclear

Disposition: `SOURCE_HARDENING_REVIEW_REQUIRED`

### P3 — Privileged call without local authorization evidence

Disposition: `LAUNCH_BLOCKING_SOURCE_FINDING`

### P4 — Internal server helper requiring caller trace

Disposition: `CALLER_CHAIN_REVIEW_REQUIRED`

### P5 — Insufficient static context

Disposition: `FAIL_CLOSED_PENDING_MANUAL_REVIEW`

## Current result

The contextual review shows multiple strong defense-in-depth patterns, but the complete call-site-by-call-site disposition is not yet sufficient to close the privileged-operation security track.

`PRIVILEGED_CALLSITE_FINDINGS_CLASSIFIED_SECURITY_CLOSURE_PENDING`
