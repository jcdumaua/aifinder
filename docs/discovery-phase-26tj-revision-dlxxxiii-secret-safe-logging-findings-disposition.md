# Phase 26TJ — Secret-Safe Logging Findings Disposition

## Bound baseline

`0836a17ebf4fc27627d9e99fdbbd29a8b8971a2e`

## Scope

Static contextual classification of committed logging and error-handling sites.

No runtime logs, request bodies, response bodies, environment values, credentials, tokens, cookies, database rows, or production systems were accessed.

## Files reviewed

`36`

## Contextual evidence

```text
### FILE: app/api/admin/audit-logs/route.ts
75-}
76-
77-async function archiveOverflowAuditLogs() {
78-  const { count, error: countError } = await supabaseAdmin
79-    .from("admin_audit_logs")
80-    .select("id", { count: "exact", head: true });
81-
82-  if (countError) {
83:    console.error("Audit log count error:", countError.message);
84-    return;
85-  }
86-
87-  const totalLogs = count || 0;
88-
89-  if (totalLogs <= LIVE_LOG_LIMIT) {
90-    return;
91-  }
--
96-    .from("admin_audit_logs")
97-    .select(
98-      "id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at"
99-    )
100-    .order("created_at", { ascending: true })
101-    .limit(archiveCount);
102-
103-  if (fetchError || !logsToArchive || logsToArchive.length === 0) {
104:    console.error("Audit log archive fetch error:", fetchError?.message);
105-    return;
106-  }
107-
108-  const typedLogs = logsToArchive as AuditLogRow[];
109-  const firstLogAt = typedLogs[0].created_at;
110-  const lastLogAt = typedLogs[typedLogs.length - 1].created_at;
111-
112-  const archivePayload = {
--
127-    .from(ARCHIVE_BUCKET)
128-    .upload(storagePath, compressed, {
129-      contentType: "application/gzip",
130-      cacheControl: "3600",
131-      upsert: false,
132-    });
133-
134-  if (uploadError) {
135:    console.error("Audit archive upload error:", uploadError.message);
136-    return;
137-  }
138-
139-  const { error: archiveInsertError } = await supabaseAdmin
140-    .from("admin_audit_archives")
141-    .insert([
142-      {
143-        file_name: fileName,
--
146-        log_count: typedLogs.length,
147-        compressed_size_bytes: compressed.byteLength,
148-        first_log_at: firstLogAt,
149-        last_log_at: lastLogAt,
150-      },
151-    ]);
152-
153-  if (archiveInsertError) {
154:    console.error("Audit archive DB insert error:", archiveInsertError.message);
155-
156-    await supabaseAdmin.storage.from(ARCHIVE_BUCKET).remove([storagePath]);
157-    return;
158-  }
159-
160-  const idsToDelete = typedLogs.map((log) => log.id);
161-
162-  const { error: deleteError } = await supabaseAdmin
163-    .from("admin_audit_logs")
164-    .delete()
165-    .in("id", idsToDelete);
166-
167-  if (deleteError) {
168:    console.error("Audit archived logs delete error:", deleteError.message);
169-  }
170-}
171-
172-async function getRecentAuditLogs() {
173-  const { data, error } = await supabaseAdmin
174-    .from("admin_audit_logs")
175-    .select(
176-      "id, action, target_type, target_id, target_name, details, ip_address, user_agent, created_at"
177-    )
178-    .order("created_at", { ascending: false })
179-    .limit(DISPLAY_LOG_LIMIT);
180-
181-  if (error) {
182:    console.error("Admin audit logs load error:", error.message);
183-    throw new Error("Failed to load audit logs.");
184-  }
185-
186-  return ((data || []) as AuditLogRow[]).map(cleanAuditLog);
187-}
188-
189-async function getAuditArchives() {
190-  const { data, error } = await supabaseAdmin
191-    .from("admin_audit_archives")
192-    .select(
193-      "id, file_name, storage_bucket, storage_path, log_count, compressed_size_bytes, first_log_at, last_log_at, created_at"
194-    )
195-    .order("created_at", { ascending: false })
196-    .limit(50);
197-
198-  if (error) {
199:    console.error("Admin audit archives load error:", error.message);
200-    throw new Error("Failed to load audit archives.");
201-  }
202-
203-  return (data || []) as AuditArchiveRow[];
204-}
205-
206-export async function GET(request: Request) {
207-  try {
--
219-    return jsonResponse({
220-      logs,
221-      archives,
222-      liveLogLimit: LIVE_LOG_LIMIT,
223-      displayLogLimit: DISPLAY_LOG_LIMIT,
224-      archiveFormat: "json.gz",
225-    });
226-  } catch (error) {
227:    console.error("Admin audit logs route error:", error);
228-
229-    return jsonResponse(
230-      {
231-        error:
232-          error instanceof Error ? error.message : "Failed to load audit logs.",
233-      },
234-      500
235-    );

### FILE: app/api/admin/discovery/candidate-extraction/invoke/route.ts
114-
115-export function createCandidateExtractionInvokeHandler(
116-  dependencies: CandidateExtractionRouteDependencies = {},
117-) {
118-  return async function candidateExtractionInvokeHandler(request: Request) {
119-  const adminSession = verifyAdminSession(request);
120-
121-  if (!adminSession.isAdmin || !adminSession.actor) {
122:    console.warn("Unauthorized candidate extraction invocation request.", {
123-      errors: adminSession.errors,
124-    });
125-
126-    return jsonResponse({ error: "Unauthorized" }, 401);
127-  }
128-
129-  if (!verifyAdminCsrfRequest(request)) {
130-    return jsonResponse(

### FILE: app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
173-    request: Request,
174-    context: RouteContext,
175-  ) {
176-    const adminSession = (
177-      dependencies.verifyAdminSession || verifyAdminSession
178-    )(request);
179-
180-    if (!adminSession.isAdmin || !adminSession.actor) {
181:      console.warn("Unauthorized candidate decision mutation request.", {
182-        errors: adminSession.errors,
183-      });
184-
185-      return errorResponse("unauthorized", "Unauthorized.", 401);
186-    }
187-
188-    const csrfVerifier =
189-      dependencies.verifyAdminCsrfRequest || verifyAdminCsrfRequest;
--
253-      if (error instanceof DiscoveryCandidateDecisionValidationError) {
254-        return errorResponse(error.code, error.message, VALIDATION_ERROR_STATUS[error.code]);
255-      }
256-
257-      if (error instanceof DiscoveryCandidateDecisionMutationError) {
258-        return errorResponse(error.code, error.message, MUTATION_ERROR_STATUS[error.code]);
259-      }
260-
261:      console.error("Candidate decision mutation failed.", {
262-        message: error instanceof Error ? error.message : "unknown",
263-      });
264-
265-      return errorResponse(
266-        "candidate_decision_rpc_failed",
267-        "Candidate decision could not be applied.",
268-        500,
269-      );

### FILE: app/api/admin/discovery/candidate-staging-queue/route.ts
255-  dependencies: CandidateStagingQueueReadRouteDependencies = {},
256-) {
257-  return async function candidateStagingQueueReadHandler(request: Request) {
258-    const adminSession = (
259-      dependencies.verifyAdminSession || verifyAdminSession
260-    )(request);
261-
262-    if (!adminSession.isAdmin || !adminSession.actor) {
263:      console.warn("Unauthorized candidate staging queue read request.", {
264-        errors: adminSession.errors,
265-      });
266-
267-      return jsonResponse(
268-        {
269-          ok: false,
270-          error: {
271-            code: "unauthorized",

### FILE: app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
70-
71-  return "Failed to approve discovered tool.";
72-}
73-
74-export async function POST(request: Request, context: RouteContext) {
75-  const adminSession = verifyAdminSession(request);
76-
77-  if (!adminSession.isAdmin || !adminSession.actor) {
78:    console.warn("Unauthorized Discovery Engine approve request.", {
79-      errors: adminSession.errors,
80-    });
81-
82-    return jsonResponse({ error: "Unauthorized" }, 401);
83-  }
84-
85-  if (!verifyAdminCsrfRequest(request)) {
86-    return jsonResponse(
--
110-    {
111-      p_discovered_tool_id: id,
112-      p_actor_id: adminSession.actor.id,
113-      p_actor_label: adminSession.actor.label,
114-    }
115-  );
116-
117-  if (error) {
118:    console.error("Approve discovered tool RPC error.", {
119-      message: error.message,
120-    });
121-
122-    return jsonResponse(
123-      { error: getSafeApprovalError(error.message) },
124-      error.message?.includes("not found") ? 404 : 400
125-    );
126-  }

### FILE: app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
115-
116-  return score;
117-}
118-
119-export async function POST(request: Request, context: RouteContext) {
120-  const adminSession = verifyAdminSession(request);
121-
122-  if (!adminSession.isAdmin || !adminSession.actor) {
123:    console.warn("Unauthorized Discovery Engine duplicate request.", {
124-      errors: adminSession.errors,
125-    });
126-
127-    return jsonResponse({ error: "Unauthorized" }, 401);
128-  }
129-
130-  if (!verifyAdminCsrfRequest(request)) {
131-    return jsonResponse(
--
219-
220-  const { data: discoveredTool, error: discoveredToolError } = await supabaseAdmin
221-    .from("discovered_tools")
222-    .select("id, status")
223-    .eq("id", id)
224-    .maybeSingle();
225-
226-  if (discoveredToolError) {
227:    console.error("Failed to load discovered tool before duplicate mark.", {
228-      message: discoveredToolError.message,
229-    });
230-
231-    return jsonResponse({ error: "Failed to mark duplicate." }, 500);
232-  }
233-
234-  if (!discoveredTool) {
235-    return jsonResponse({ error: "Discovered tool not found." }, 404);
--
247-      match_score: matchScore,
248-      is_blocking: true,
249-      reason,
250-    })
251-    .select("*")
252-    .single();
253-
254-  if (duplicateError) {
255:    console.error("Failed to create Discovery Engine duplicate candidate.", {
256-      message: duplicateError.message,
257-    });
258-
259-    return jsonResponse({ error: "Failed to mark duplicate." }, 500);
260-  }
261-
262-  const { data: updatedTool, error: updateError } = await supabaseAdmin
263-    .from("discovered_tools")
--
265-      status: "duplicate",
266-      updated_at: new Date().toISOString(),
267-    })
268-    .eq("id", id)
269-    .select("id, status, updated_at")
270-    .single();
271-
272-  if (updateError) {
273:    console.error("Failed to update discovered tool duplicate status.", {
274-      message: updateError.message,
275-    });
276-
277-    return jsonResponse(
278-      { error: "Duplicate candidate created, but status update failed." },
279-      500
280-    );
281-  }
--
297-        candidate_discovered_tool_id: candidateDiscoveredToolId,
298-        match_type: matchType,
299-        match_score: matchScore,
300-        reason,
301-      },
302-    });
303-
304-  if (auditError) {
305:    console.error("Failed to write Discovery Engine duplicate audit event.", {
306-      message: auditError.message,
307-    });
308-
309-    return jsonResponse(
310-      { error: "Duplicate marked, but audit logging failed." },
311-      500
312-    );
313-  }

### FILE: app/api/admin/discovery/discovered-tools/[id]/route.ts
31-    value
32-  );
33-}
34-
35-export async function GET(request: Request, context: RouteContext) {
36-  const adminSession = verifyAdminSession(request);
37-
38-  if (!adminSession.isAdmin || !adminSession.actor) {
39:    console.warn("Unauthorized Discovery Engine detail request.", {
40-      errors: adminSession.errors,
41-    });
42-
43-    return jsonResponse({ error: "Unauthorized" }, 401);
44-  }
45-
46-  const { id } = await context.params;
47-
--
51-
52-  const { data: tool, error: toolError } = await supabaseAdmin
53-    .from("discovered_tools")
54-    .select("*")
55-    .eq("id", id)
56-    .maybeSingle();
57-
58-  if (toolError) {
59:    console.error("Failed to fetch Discovery Engine discovered tool detail.", {
60-      message: toolError.message,
61-    });
62-
63-    return jsonResponse({ error: "Failed to fetch discovered tool." }, 500);
64-  }
65-
66-  if (!tool) {
67-    return jsonResponse({ error: "Discovered tool not found." }, 404);
--
69-
70-  const { data: evidence, error: evidenceError } = await supabaseAdmin
71-    .from("discovery_evidence")
72-    .select("*")
73-    .eq("discovered_tool_id", id)
74-    .order("created_at", { ascending: false });
75-
76-  if (evidenceError) {
77:    console.error("Failed to fetch Discovery Engine evidence.", {
78-      message: evidenceError.message,
79-    });
80-
81-    return jsonResponse({ error: "Failed to fetch discovery evidence." }, 500);
82-  }
83-
84-  const { data: duplicateCandidates, error: duplicateError } = await supabaseAdmin
85-    .from("discovery_duplicate_candidates")
86-    .select("*")
87-    .eq("discovered_tool_id", id)
88-    .order("created_at", { ascending: false });
89-
90-  if (duplicateError) {
91:    console.error("Failed to fetch Discovery Engine duplicate candidates.", {
92-      message: duplicateError.message,
93-    });
94-
95-    return jsonResponse({ error: "Failed to fetch duplicate candidates." }, 500);
96-  }
97-
98-    const { data: auditEvents, error: auditError } = await supabaseAdmin
99-      .from("discovery_audit_events")
100-      .select("id, action, actor_id, actor_label, message, metadata, created_at")
101-      .eq("discovered_tool_id", id)
102-      .order("created_at", { ascending: false })
103-      .limit(50);
104-
105-    if (auditError) {
106:      console.error("Failed to fetch Discovery Engine audit events.", {
107-        message: auditError.message,
108-      });
109-
110-      return jsonResponse({ error: "Failed to fetch audit events." }, 500);
111-    }
112-
113-  const { data: source, error: sourceError } =
114-    typeof tool.source_id === "string"
115-      ? await supabaseAdmin
116-          .from("discovery_sources")
117-          .select("id, name, slug, source_type, is_active, last_run_at, url")
118-          .eq("id", tool.source_id)
119-          .maybeSingle()
120-      : { data: null, error: null };
121-
122-  if (sourceError) {
123:    console.error("Failed to fetch Discovery Engine source detail.", {
124-      message: sourceError.message,
125-    });
126-
127-    return jsonResponse({ error: "Failed to fetch discovery source." }, 500);
128-  }
129-
130-  const { data: run, error: runError } =
131-    typeof tool.run_id === "string"
132-      ? await supabaseAdmin
133-          .from("discovery_runs")
134-          .select("id, source_id, status, stats, error_log, started_at, finished_at, created_at")
135-          .eq("id", tool.run_id)
136-          .maybeSingle()
137-      : { data: null, error: null };
138-
139-  if (runError) {
140:    console.error("Failed to fetch Discovery Engine run detail.", {
141-      message: runError.message,
142-    });
143-
144-    return jsonResponse({ error: "Failed to fetch discovery run." }, 500);
145-  }
146-
147-  return jsonResponse({
148-    data: {
--
214-
215-  return reason;
216-}
217-
218-export async function PATCH(request: Request, context: RouteContext) {
219-  const adminSession = verifyAdminSession(request);
220-
221-  if (!adminSession.isAdmin || !adminSession.actor) {
222:    console.warn("Unauthorized Discovery Engine status update request.", {
223-      errors: adminSession.errors,
224-    });
225-
226-    return jsonResponse({ error: "Unauthorized" }, 401);
227-  }
228-
229-  if (!verifyAdminCsrfRequest(request)) {
230-    return jsonResponse(
--
279-
280-  const { data: existingTool, error: existingToolError } = await supabaseAdmin
281-    .from("discovered_tools")
282-    .select("id, status")
283-    .eq("id", id)
284-    .maybeSingle();
285-
286-  if (existingToolError) {
287:    console.error("Failed to load Discovery Engine tool before status update.", {
288-      message: existingToolError.message,
289-    });
290-
291-    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
292-  }
293-
294-  if (!existingTool) {
295-    return jsonResponse({ error: "Discovered tool not found." }, 404);
--
318-  const { data: updatedTool, error: updateError } = await supabaseAdmin
319-    .from("discovered_tools")
320-    .update(updatePayload)
321-    .eq("id", id)
322-    .select("id, status, rejected_reason, updated_at")
323-    .single();
324-
325-  if (updateError) {
326:    console.error("Failed to update Discovery Engine discovered tool status.", {
327-      message: updateError.message,
328-    });
329-
330-    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
331-  }
332-
333-  const { error: auditError } = await supabaseAdmin
334-    .from("discovery_audit_events")
--
341-      metadata: {
342-        from_status: existingTool.status,
343-        to_status: status,
344-        reason,
345-      },
346-    });
347-
348-  if (auditError) {
349:    console.error("Failed to write Discovery Engine audit event.", {
350-      message: auditError.message,
351-    });
352-
353-    return jsonResponse(
354-      { error: "Status updated, but audit logging failed." },
355-      500
356-    );
357-  }

### FILE: app/api/admin/discovery/discovered-tools/bulk-status/route.ts
113-
114-  return reason || null;
115-}
116-
117-export async function POST(request: Request) {
118-  const adminSession = verifyAdminSession(request);
119-
120-  if (!adminSession.isAdmin || !adminSession.actor) {
121:    console.warn("Unauthorized Discovery Engine bulk status request.", {
122-      errors: adminSession.errors,
123-    });
124-
125-    return jsonResponse({ error: "Unauthorized" }, 401);
126-  }
127-
128-  if (!verifyAdminCsrfRequest(request)) {
129-    return jsonResponse(
--
169-  }
170-
171-  const { data: existingTools, error: existingToolsError } = await supabaseAdmin
172-    .from("discovered_tools")
173-    .select("id, status")
174-    .in("id", ids);
175-
176-  if (existingToolsError) {
177:    console.error("Failed to load Discovery Engine tools before bulk status.", {
178-      message: existingToolsError.message,
179-    });
180-
181-    return jsonResponse({ error: "Failed to load selected candidates." }, 500);
182-  }
183-
184-  const existingRows = (existingTools || []) as ExistingDiscoveredTool[];
185-  const existingById = new Map(existingRows.map((tool) => [tool.id, tool]));
--
214-    .update({
215-      status,
216-      updated_at: updatedAt,
217-    })
218-    .in("id", eligibleIds)
219-    .select("id, status, updated_at");
220-
221-  if (updateError) {
222:    console.error("Failed to bulk update Discovery Engine discovered tools.", {
223-      message: updateError.message,
224-    });
225-
226-    return jsonResponse({ error: "Failed to update selected candidates." }, 500);
227-  }
228-
229-  const auditRows = eligibleRows.map((tool) => ({
230-    discovered_tool_id: tool.id,
--
240-    },
241-  }));
242-
243-  const { error: auditError } = await supabaseAdmin
244-    .from("discovery_audit_events")
245-    .insert(auditRows);
246-
247-  if (auditError) {
248:    console.error("Failed to write Discovery Engine bulk audit events.", {
249-      message: auditError.message,
250-    });
251-
252-    return jsonResponse(
253-      { error: "Bulk status updated, but audit logging failed." },
254-      500
255-    );
256-  }

### FILE: app/api/admin/discovery/discovered-tools/route.ts
77-
78-  return parsed;
79-}
80-
81-export async function GET(request: Request) {
82-  const adminSession = verifyAdminSession(request);
83-
84-  if (!adminSession.isAdmin || !adminSession.actor) {
85:    console.warn("Unauthorized Discovery Engine discovered tools request.", {
86-      errors: adminSession.errors,
87-    });
88-
89-    return jsonResponse({ error: "Unauthorized" }, 401);
90-  }
91-
92-  const { searchParams } = new URL(request.url);
93-  const status = searchParams.get("status");
--
138-
139-  if (sourceId) {
140-    query = query.eq("source_id", sourceId);
141-  }
142-
143-  const { data, count, error } = await query;
144-
145-  if (error) {
146:    console.error("Failed to fetch Discovery Engine discovered tools.", {
147-      message: error.message,
148-    });
149-
150-    return jsonResponse({ error: "Failed to fetch discovered tools." }, 500);
151-  }
152-
153-  const tools = (data || []) as unknown as DiscoveredToolQueueRow[];
154-  const toolIds = tools.map((tool) => tool.id);
--
170-  const { data: sources, error: sourcesError } = sourceIds.length
171-    ? await supabaseAdmin
172-        .from("discovery_sources")
173-        .select("id, name, slug, source_type, is_active, last_run_at")
174-        .in("id", sourceIds)
175-    : { data: [], error: null };
176-
177-  if (sourcesError) {
178:    console.error("Failed to fetch Discovery Engine queue sources.", {
179-      message: sourcesError.message,
180-    });
181-
182-    return jsonResponse({ error: "Failed to fetch discovery sources." }, 500);
183-  }
184-
185-  const { data: runs, error: runsError } = runIds.length
186-    ? await supabaseAdmin
187-        .from("discovery_runs")
188-        .select("id, source_id, status, stats, started_at, finished_at, created_at")
189-        .in("id", runIds)
190-    : { data: [], error: null };
191-
192-  if (runsError) {
193:    console.error("Failed to fetch Discovery Engine queue runs.", {
194-      message: runsError.message,
195-    });
196-
197-    return jsonResponse({ error: "Failed to fetch discovery runs." }, 500);
198-  }
199-
200-  const { data: duplicateRows, error: duplicateRowsError } = toolIds.length
201-    ? await supabaseAdmin
202-        .from("discovery_duplicate_candidates")
203-        .select("discovered_tool_id, is_blocking")
204-        .in("discovered_tool_id", toolIds)
205-    : { data: [], error: null };
206-
207-  if (duplicateRowsError) {
208:    console.error("Failed to fetch Discovery Engine queue duplicate summaries.", {
209-      message: duplicateRowsError.message,
210-    });
211-
212-    return jsonResponse({ error: "Failed to fetch duplicate summaries." }, 500);
213-  }
214-
215-  const sourceRows = (sources || []) as unknown as DiscoverySourceSummary[];
216-  const runRows = (runs || []) as unknown as DiscoveryRunSummary[];

### FILE: app/api/admin/discovery/intake/route.ts
190-      .eq("id", discoveryRunId);
191-  }
192-}
193-
194-export async function POST(request: Request) {
195-  const adminSession = verifyAdminSession(request);
196-
197-  if (!adminSession.isAdmin || !adminSession.actor) {
198:    console.warn("Unauthorized Discovery Engine intake request.", {
199-      errors: adminSession.errors,
200-    });
201-
202-    return jsonResponse({ error: "Unauthorized" }, 401);
203-  }
204-
205-  if (!verifyAdminCsrfRequest(request)) {
206-    return jsonResponse(
--
288-      .from("discovered_tools")
289-      .select("id, name, slug, status, normalized_domain, created_at")
290-      .eq("normalized_domain", normalizedDomain)
291-      .in("status", ["new", "pending_review", "approved", "duplicate"])
292-      .order("created_at", { ascending: false })
293-      .limit(1);
294-
295-  if (existingDiscoveredError) {
296:    console.error("Failed to check existing discovered tools.", {
297-      message: existingDiscoveredError.message,
298-    });
299-
300-    return jsonResponse({ error: "Failed to check discovery queue." }, 500);
301-  }
302-
303-  const existingDiscoveredTool = existingDiscoveredTools?.[0];
304-
--
317-  const { data: liveTools, error: liveToolsError } = await supabaseAdmin
318-    .from("tools")
319-    .select("id, name, slug, status, deleted_at, normalized_domain")
320-    .eq("normalized_domain", normalizedDomain)
321-    .is("deleted_at", null)
322-    .limit(1);
323-
324-  if (liveToolsError) {
325:    console.error("Failed to check live tools during discovery intake.", {
326-      message: liveToolsError.message,
327-    });
328-
329-    return jsonResponse({ error: "Failed to check live tools." }, 500);
330-  }
331-
332-  const { data: pendingSubmissions, error: pendingSubmissionsError } =
333-    await supabaseAdmin
334-      .from("submitted_tools")
335-      .select("id, name, status, normalized_domain")
336-      .eq("normalized_domain", normalizedDomain)
337-      .eq("status", "pending")
338-      .limit(1);
339-
340-  if (pendingSubmissionsError) {
341:    console.error("Failed to check pending submissions during discovery intake.", {
342-      message: pendingSubmissionsError.message,
343-    });
344-
345-    return jsonResponse({ error: "Failed to check pending submissions." }, 500);
346-  }
347-
348-  const duplicateWarnings: DuplicateWarning[] = [];
349-
--
390-    const { data: discoverySource, error: discoverySourceError } =
391-      await supabaseAdmin
```

## Disposition classes

### L1 — Allowlisted or selective message logging

Examples:

- stable error code;
- explicit `.message` extraction;
- non-sensitive identifiers;
- generic operation label.

Disposition: `STATICALLY_LOW_RISK_PENDING_RUNTIME_CONFIGURATION_REVIEW`

### L2 — Full error object or response logging

Disposition: `SOURCE_HARDENING_REQUIRED`

### L3 — Request, session, cookie, token, row, or payload logging

Disposition: `LAUNCH_BLOCKING_SENSITIVE_OUTPUT_FINDING`

### L4 — Development-only diagnostic logging

Disposition: `REMOVE_OR_PROVE_PRODUCTION_DISABLED`

### L5 — Context insufficient

Disposition: `FAIL_CLOSED_PENDING_MANUAL_REVIEW`

## Current result

Selective error-message logging is favorable static evidence, but all high-risk and ambiguous logging sites require explicit final disposition before security readiness can be established.

`LOGGING_FINDINGS_CLASSIFIED_SECRET_SAFE_CLOSURE_PENDING`
