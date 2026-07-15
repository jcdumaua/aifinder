# Phase 26TB — Secret-Safe Error and Logging Static Review

## Bound baseline

`686e2da84773e58001612cfe125025d27acbf9fc`

## Inspection boundary

Committed source was inspected statically for logging, error, response, environment-reference, and serialization patterns.

No environment value, credential, token, cookie, database row, response body, or runtime log was accessed or printed.

## Inventory result

- Logging/error-related static matches: `1474`

## Representative logging and error evidence

```text
app/admin-login/page.tsx:7:  type: "success" | "error";
app/admin-login/page.tsx:22:      type: "error",
app/admin-login/page.tsx:45:      const response = await fetch("/api/admin/session", {
app/admin-login/page.tsx:51:      const result = await response.json().catch(() => null);
app/admin-login/page.tsx:53:      if (response.ok && result?.authenticated) {
app/admin-login/page.tsx:73:      const response = await fetch("/api/admin/login", {
app/admin-login/page.tsx:79:        body: JSON.stringify({
app/admin-login/page.tsx:84:      const result = await response.json().catch(() => null);
app/admin-login/page.tsx:86:      if (!response.ok) {
app/admin-login/page.tsx:87:        showError(result?.error || "Wrong password. Please try again.");
app/admin/homepage-control/[id]/page.tsx:64:  return "No structured data";
app/admin/homepage-control/[id]/page.tsx:74:        {JSON.stringify(value, null, 2)}
app/admin/homepage-control/[id]/page.tsx:205:  tone: "error" | "warning";
app/admin/homepage-control/[id]/page.tsx:210:    tone === "error"
app/admin/homepage-control/[id]/page.tsx:329:          tone="error"
app/admin/homepage-control/[id]/page.tsx:343:          tone="error"
app/admin/homepage-control/page.tsx:65:            {result.errors.map((error) => (
app/admin/homepage-control/page.tsx:66:              <p key={error}>{error}</p>
app/api/admin/audit-logs/route.ts:37:function jsonResponse(data: object, status = 200) {
app/api/admin/audit-logs/route.ts:38:  return NextResponse.json(data, {
app/api/admin/audit-logs/route.ts:78:  const { count, error: countError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:83:    console.error("Audit log count error:", countError.message);
app/api/admin/audit-logs/route.ts:95:  const { data: logsToArchive, error: fetchError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:104:    console.error("Audit log archive fetch error:", fetchError?.message);
app/api/admin/audit-logs/route.ts:120:  const compactJson = JSON.stringify(archivePayload);
app/api/admin/audit-logs/route.ts:126:  const { error: uploadError } = await supabaseAdmin.storage
app/api/admin/audit-logs/route.ts:135:    console.error("Audit archive upload error:", uploadError.message);
app/api/admin/audit-logs/route.ts:139:  const { error: archiveInsertError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:154:    console.error("Audit archive DB insert error:", archiveInsertError.message);
app/api/admin/audit-logs/route.ts:162:  const { error: deleteError } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:168:    console.error("Audit archived logs delete error:", deleteError.message);
app/api/admin/audit-logs/route.ts:173:  const { data, error } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:181:  if (error) {
app/api/admin/audit-logs/route.ts:182:    console.error("Admin audit logs load error:", error.message);
app/api/admin/audit-logs/route.ts:186:  return ((data || []) as AuditLogRow[]).map(cleanAuditLog);
app/api/admin/audit-logs/route.ts:190:  const { data, error } = await supabaseAdmin
app/api/admin/audit-logs/route.ts:198:  if (error) {
app/api/admin/audit-logs/route.ts:199:    console.error("Admin audit archives load error:", error.message);
app/api/admin/audit-logs/route.ts:203:  return (data || []) as AuditArchiveRow[];
app/api/admin/audit-logs/route.ts:209:      return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/audit-logs/route.ts:226:  } catch (error) {
app/api/admin/audit-logs/route.ts:227:    console.error("Admin audit logs route error:", error);
app/api/admin/audit-logs/route.ts:231:        error:
app/api/admin/audit-logs/route.ts:232:          error instanceof Error ? error.message : "Failed to load audit logs.",
app/api/admin/csrf/route.ts:26:function jsonResponse(data: object, status = 200) {
app/api/admin/csrf/route.ts:27:  return NextResponse.json(data, {
app/api/admin/csrf/route.ts:38:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/csrf/route.ts:46:  const response = jsonResponse({
app/api/admin/csrf/route.ts:51:  response.cookies.set(ADMIN_CSRF_COOKIE_NAME, csrfToken, {
app/api/admin/csrf/route.ts:53:    secure: process.env.NODE_ENV === "production",
app/api/admin/csrf/route.ts:59:  return response;
app/api/admin/discovery/candidate-extraction/invoke/route.ts:40:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/candidate-extraction/invoke/route.ts:41:  return NextResponse.json(data, {
app/api/admin/discovery/candidate-extraction/invoke/route.ts:122:    console.warn("Unauthorized candidate extraction invocation request.", {
app/api/admin/discovery/candidate-extraction/invoke/route.ts:126:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/candidate-extraction/invoke/route.ts:131:      { error: "Security token missing or expired. Please log in again." },
app/api/admin/discovery/candidate-extraction/invoke/route.ts:157:  } catch (error) {
app/api/admin/discovery/candidate-extraction/invoke/route.ts:159:      { error: error instanceof Error ? error.message : "Invalid request body." },
app/api/admin/discovery/candidate-extraction/invoke/route.ts:167:        error: "Client-supplied admin identity is not allowed.",
app/api/admin/discovery/candidate-extraction/invoke/route.ts:177:        error: "Unsupported candidate extraction invocation field.",
app/api/admin/discovery/candidate-extraction/invoke/route.ts:189:        error: "Authenticated admin identity is unavailable.",
app/api/admin/discovery/candidate-extraction/invoke/route.ts:238:    return jsonResponse({ error: "Candidate extraction invocation failed." }, 500);
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:49:  error: {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:105:  data: CandidateDecisionApiSuccessResponse | CandidateDecisionApiErrorResponse,
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:108:  return NextResponse.json(data, {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:160:      error: {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:181:      console.warn("Unauthorized candidate decision mutation request.", {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:223:    } catch (error) {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:226:        error instanceof Error ? error.message : "Invalid request body.",
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:252:    } catch (error) {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:253:      if (error instanceof DiscoveryCandidateDecisionValidationError) {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:254:        return errorResponse(error.code, error.message, VALIDATION_ERROR_STATUS[error.code]);
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:257:      if (error instanceof DiscoveryCandidateDecisionMutationError) {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:258:        return errorResponse(error.code, error.message, MUTATION_ERROR_STATUS[error.code]);
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:261:      console.error("Candidate decision mutation failed.", {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:262:        message: error instanceof Error ? error.message : "unknown",
app/api/admin/discovery/candidate-staging-queue/route.ts:41:  error: {
app/api/admin/discovery/candidate-staging-queue/route.ts:101:  data:
app/api/admin/discovery/candidate-staging-queue/route.ts:106:  return NextResponse.json(data, {
app/api/admin/discovery/candidate-staging-queue/route.ts:234:  error: unknown,
app/api/admin/discovery/candidate-staging-queue/route.ts:237:    typeof error === "object" &&
app/api/admin/discovery/candidate-staging-queue/route.ts:238:    error !== null &&
app/api/admin/discovery/candidate-staging-queue/route.ts:239:    "code" in error &&
app/api/admin/discovery/candidate-staging-queue/route.ts:240:    isCandidateQueueReadErrorCode(error.code)
app/api/admin/discovery/candidate-staging-queue/route.ts:242:    return error.code;
app/api/admin/discovery/candidate-staging-queue/route.ts:263:      console.warn("Unauthorized candidate staging queue read request.", {
app/api/admin/discovery/candidate-staging-queue/route.ts:270:          error: {
app/api/admin/discovery/candidate-staging-queue/route.ts:295:    } catch (error) {
app/api/admin/discovery/candidate-staging-queue/route.ts:296:      const code = getCandidateQueueReadErrorCode(error);
app/api/admin/discovery/candidate-staging-queue/route.ts:301:          error: {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:22:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:23:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:78:    console.warn("Unauthorized Discovery Engine approve request.", {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:82:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:87:      { error: "Security token missing or expired. Please log in again." },
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:105:    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:108:  const { data: approvedToolId, error } = await supabaseAdmin.rpc(
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:117:  if (error) {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:118:    console.error("Approve discovered tool RPC error.", {
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:119:      message: error.message,
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:123:      { error: getSafeApprovalError(error.message) },
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:124:      error.message?.includes("not found") ? 404 : 400
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:131:    data: {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:38:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:39:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:123:    console.warn("Unauthorized Discovery Engine duplicate request.", {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:127:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:132:      { error: "Security token missing or expired. Please log in again." },
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:150:    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:157:  } catch (error) {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:159:      { error: error instanceof Error ? error.message : "Invalid request body." },
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:170:    return jsonResponse({ error: "Invalid candidate type." }, 400);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:176:    return jsonResponse({ error: "Invalid match type." }, 400);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:213:  } catch (error) {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:215:      { error: error instanceof Error ? error.message : "Invalid duplicate data." },
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:220:  const { data: discoveredTool, error: discoveredToolError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:227:    console.error("Failed to load discovered tool before duplicate mark.", {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:231:    return jsonResponse({ error: "Failed to mark duplicate." }, 500);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:235:    return jsonResponse({ error: "Discovered tool not found." }, 404);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:238:  const { data: duplicateCandidate, error: duplicateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:255:    console.error("Failed to create Discovery Engine duplicate candidate.", {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:259:    return jsonResponse({ error: "Failed to mark duplicate." }, 500);
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:262:  const { data: updatedTool, error: updateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:273:    console.error("Failed to update discovered tool duplicate status.", {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:278:      { error: "Duplicate candidate created, but status update failed." },
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:283:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:305:    console.error("Failed to write Discovery Engine duplicate audit event.", {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:310:      { error: "Duplicate marked, but audit logging failed." },
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:318:      data: {
app/api/admin/discovery/discovered-tools/[id]/route.ts:19:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/discovered-tools/[id]/route.ts:20:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/[id]/route.ts:39:    console.warn("Unauthorized Discovery Engine detail request.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:43:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/[id]/route.ts:49:    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
app/api/admin/discovery/discovered-tools/[id]/route.ts:52:  const { data: tool, error: toolError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:59:    console.error("Failed to fetch Discovery Engine discovered tool detail.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:63:    return jsonResponse({ error: "Failed to fetch discovered tool." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:67:    return jsonResponse({ error: "Discovered tool not found." }, 404);
app/api/admin/discovery/discovered-tools/[id]/route.ts:70:  const { data: evidence, error: evidenceError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:77:    console.error("Failed to fetch Discovery Engine evidence.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:81:    return jsonResponse({ error: "Failed to fetch discovery evidence." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:84:  const { data: duplicateCandidates, error: duplicateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:91:    console.error("Failed to fetch Discovery Engine duplicate candidates.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:95:    return jsonResponse({ error: "Failed to fetch duplicate candidates." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:98:    const { data: auditEvents, error: auditError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:106:      console.error("Failed to fetch Discovery Engine audit events.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:110:      return jsonResponse({ error: "Failed to fetch audit events." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:113:  const { data: source, error: sourceError } =
app/api/admin/discovery/discovered-tools/[id]/route.ts:120:      : { data: null, error: null };
app/api/admin/discovery/discovered-tools/[id]/route.ts:123:    console.error("Failed to fetch Discovery Engine source detail.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:127:    return jsonResponse({ error: "Failed to fetch discovery source." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:130:  const { data: run, error: runError } =
app/api/admin/discovery/discovered-tools/[id]/route.ts:137:      : { data: null, error: null };
app/api/admin/discovery/discovered-tools/[id]/route.ts:140:    console.error("Failed to fetch Discovery Engine run detail.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:144:    return jsonResponse({ error: "Failed to fetch discovery run." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:148:    data: {
app/api/admin/discovery/discovered-tools/[id]/route.ts:222:    console.warn("Unauthorized Discovery Engine status update request.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:226:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/[id]/route.ts:231:      { error: "Security token missing or expired. Please log in again." },
app/api/admin/discovery/discovered-tools/[id]/route.ts:249:    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
app/api/admin/discovery/discovered-tools/[id]/route.ts:256:  } catch (error) {
app/api/admin/discovery/discovered-tools/[id]/route.ts:258:      { error: error instanceof Error ? error.message : "Invalid request body." },
app/api/admin/discovery/discovered-tools/[id]/route.ts:266:    return jsonResponse({ error: "Invalid status." }, 400);
app/api/admin/discovery/discovered-tools/[id]/route.ts:273:  } catch (error) {
app/api/admin/discovery/discovered-tools/[id]/route.ts:275:      { error: error instanceof Error ? error.message : "Invalid reason." },
app/api/admin/discovery/discovered-tools/[id]/route.ts:280:  const { data: existingTool, error: existingToolError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:287:    console.error("Failed to load Discovery Engine tool before status update.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:291:    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:295:    return jsonResponse({ error: "Discovered tool not found." }, 404);
app/api/admin/discovery/discovered-tools/[id]/route.ts:301:      data: {
app/api/admin/discovery/discovered-tools/[id]/route.ts:318:  const { data: updatedTool, error: updateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:326:    console.error("Failed to update Discovery Engine discovered tool status.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:330:    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
app/api/admin/discovery/discovered-tools/[id]/route.ts:333:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/[id]/route.ts:349:    console.error("Failed to write Discovery Engine audit event.", {
app/api/admin/discovery/discovered-tools/[id]/route.ts:354:      { error: "Status updated, but audit logging failed." },
app/api/admin/discovery/discovered-tools/[id]/route.ts:361:    data: updatedTool,
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:36:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:37:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:121:    console.warn("Unauthorized Discovery Engine bulk status request.", {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:125:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:130:      { error: "Security token missing or expired. Please log in again." },
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:149:  } catch (error) {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:151:      { error: error instanceof Error ? error.message : "Invalid request body." },
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:164:  } catch (error) {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:166:      { error: error instanceof Error ? error.message : "Invalid bulk action." },
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:171:  const { data: existingTools, error: existingToolsError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:177:    console.error("Failed to load Discovery Engine tools before bulk status.", {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:181:    return jsonResponse({ error: "Failed to load selected candidates." }, 500);
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:200:      data: {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:212:  const { data: updatedTools, error: updateError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:222:    console.error("Failed to bulk update Discovery Engine discovered tools.", {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:226:    return jsonResponse({ error: "Failed to update selected candidates." }, 500);
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:243:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:248:    console.error("Failed to write Discovery Engine bulk audit events.", {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:253:      { error: "Bulk status updated, but audit logging failed." },
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:260:    data: {
app/api/admin/discovery/discovered-tools/route.ts:59:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/discovered-tools/route.ts:60:  return NextResponse.json(data, {
app/api/admin/discovery/discovered-tools/route.ts:85:    console.warn("Unauthorized Discovery Engine discovered tools request.", {
app/api/admin/discovery/discovered-tools/route.ts:89:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/discovered-tools/route.ts:101:    return jsonResponse({ error: "Invalid status parameter." }, 400);
app/api/admin/discovery/discovered-tools/route.ts:105:    return jsonResponse({ error: "Invalid source_id parameter." }, 400);
app/api/admin/discovery/discovered-tools/route.ts:143:  const { data, count, error } = await query;
app/api/admin/discovery/discovered-tools/route.ts:145:  if (error) {
app/api/admin/discovery/discovered-tools/route.ts:146:    console.error("Failed to fetch Discovery Engine discovered tools.", {
app/api/admin/discovery/discovered-tools/route.ts:147:      message: error.message,
app/api/admin/discovery/discovered-tools/route.ts:150:    return jsonResponse({ error: "Failed to fetch discovered tools." }, 500);
app/api/admin/discovery/discovered-tools/route.ts:153:  const tools = (data || []) as unknown as DiscoveredToolQueueRow[];
app/api/admin/discovery/discovered-tools/route.ts:170:  const { data: sources, error: sourcesError } = sourceIds.length
app/api/admin/discovery/discovered-tools/route.ts:175:    : { data: [], error: null };
app/api/admin/discovery/discovered-tools/route.ts:178:    console.error("Failed to fetch Discovery Engine queue sources.", {
app/api/admin/discovery/discovered-tools/route.ts:182:    return jsonResponse({ error: "Failed to fetch discovery sources." }, 500);
app/api/admin/discovery/discovered-tools/route.ts:185:  const { data: runs, error: runsError } = runIds.length
app/api/admin/discovery/discovered-tools/route.ts:190:    : { data: [], error: null };
app/api/admin/discovery/discovered-tools/route.ts:193:    console.error("Failed to fetch Discovery Engine queue runs.", {
app/api/admin/discovery/discovered-tools/route.ts:197:    return jsonResponse({ error: "Failed to fetch discovery runs." }, 500);
app/api/admin/discovery/discovered-tools/route.ts:200:  const { data: duplicateRows, error: duplicateRowsError } = toolIds.length
app/api/admin/discovery/discovered-tools/route.ts:205:    : { data: [], error: null };
app/api/admin/discovery/discovered-tools/route.ts:208:    console.error("Failed to fetch Discovery Engine queue duplicate summaries.", {
app/api/admin/discovery/discovered-tools/route.ts:212:    return jsonResponse({ error: "Failed to fetch duplicate summaries." }, 500);
app/api/admin/discovery/discovered-tools/route.ts:247:    data: tools.map((tool) => ({
app/api/admin/discovery/intake/route.ts:52:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/intake/route.ts:53:  return NextResponse.json(data, {
app/api/admin/discovery/intake/route.ts:145:  const serialized = JSON.stringify(value);
app/api/admin/discovery/intake/route.ts:198:    console.warn("Unauthorized Discovery Engine intake request.", {
app/api/admin/discovery/intake/route.ts:202:    return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/intake/route.ts:207:      { error: "Security token missing or expired. Please log in again." },
app/api/admin/discovery/intake/route.ts:226:  } catch (error) {
app/api/admin/discovery/intake/route.ts:228:      { error: error instanceof Error ? error.message : "Invalid request body." },
app/api/admin/discovery/intake/route.ts:279:  } catch (error) {
app/api/admin/discovery/intake/route.ts:281:      { error: error instanceof Error ? error.message : "Invalid intake data." },
app/api/admin/discovery/intake/route.ts:286:  const { data: existingDiscoveredTools, error: existingDiscoveredError } =
app/api/admin/discovery/intake/route.ts:296:    console.error("Failed to check existing discovered tools.", {
app/api/admin/discovery/intake/route.ts:300:    return jsonResponse({ error: "Failed to check discovery queue." }, 500);
app/api/admin/discovery/intake/route.ts:308:        error: "A discovered candidate with this domain already exists.",
app/api/admin/discovery/intake/route.ts:309:        data: {
app/api/admin/discovery/intake/route.ts:317:  const { data: liveTools, error: liveToolsError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:325:    console.error("Failed to check live tools during discovery intake.", {
app/api/admin/discovery/intake/route.ts:329:    return jsonResponse({ error: "Failed to check live tools." }, 500);
app/api/admin/discovery/intake/route.ts:332:  const { data: pendingSubmissions, error: pendingSubmissionsError } =
app/api/admin/discovery/intake/route.ts:341:    console.error("Failed to check pending submissions during discovery intake.", {
app/api/admin/discovery/intake/route.ts:345:    return jsonResponse({ error: "Failed to check pending submissions." }, 500);
app/api/admin/discovery/intake/route.ts:382:  } catch (error) {
app/api/admin/discovery/intake/route.ts:384:      { error: error instanceof Error ? error.message : "Invalid source ID." },
app/api/admin/discovery/intake/route.ts:390:    const { data: discoverySource, error: discoverySourceError } =
app/api/admin/discovery/intake/route.ts:398:      console.error("Failed to validate manual intake discovery source.", {
app/api/admin/discovery/intake/route.ts:402:      return jsonResponse({ error: "Failed to validate discovery source." }, 500);
app/api/admin/discovery/intake/route.ts:406:      return jsonResponse({ error: "Discovery source not found." }, 400);
app/api/admin/discovery/intake/route.ts:410:      return jsonResponse({ error: "Discovery source must be active." }, 400);
app/api/admin/discovery/intake/route.ts:417:  const { data: discoveryRun, error: discoveryRunError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:437:    console.error("Failed to create manual discovery run.", {
app/api/admin/discovery/intake/route.ts:441:    return jsonResponse({ error: "Failed to create discovery run." }, 500);
app/api/admin/discovery/intake/route.ts:446:  const { data: discoveredTool, error: discoveredInsertError } =
app/api/admin/discovery/intake/route.ts:476:    console.error("Failed to create manual discovery intake candidate.", {
app/api/admin/discovery/intake/route.ts:486:      { error: "Failed to create discovery intake candidate." },
app/api/admin/discovery/intake/route.ts:493:  const { data: evidence, error: evidenceError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:519:    console.error("Failed to create manual discovery evidence.", {
app/api/admin/discovery/intake/route.ts:526:      { error: "Intake candidate created, but evidence creation failed." },
app/api/admin/discovery/intake/route.ts:536:    const { data: duplicateCandidate, error: duplicateError } =
app/api/admin/discovery/intake/route.ts:560:      console.error("Failed to create manual intake duplicate candidate.", {
app/api/admin/discovery/intake/route.ts:567:        { error: "Intake candidate created, but duplicate recording failed." },
app/api/admin/discovery/intake/route.ts:577:  const { error: auditError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:602:    console.error("Failed to write manual discovery intake audit event.", {
app/api/admin/discovery/intake/route.ts:609:      { error: "Intake candidate created, but audit logging failed." },
app/api/admin/discovery/intake/route.ts:615:    const { error: sourceUpdateError } = await supabaseAdmin
app/api/admin/discovery/intake/route.ts:621:      console.error("Failed to update discovery source last_run_at.", {
app/api/admin/discovery/intake/route.ts:634:      data: {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:30:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:31:  return NextResponse.json(data, {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:83:      console.warn("Unauthorized candidate preview request.", {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:87:      return jsonResponse({ error: "Unauthorized" }, 401);
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:97:          error: "Authenticated admin identity is unavailable.",
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:117:        { data: result },
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:121:      return jsonResponse({ error: "Candidate preview request failed." }, 500);
app/api/admin/discovery/runs/manual/claim/route.ts:115:function jsonResponse(data: object, status = 200) {
app/api/admin/discovery/runs/manual/claim/route.ts:116:  return NextResponse.json(data, {
app/api/admin/discovery/runs/manual/claim/route.ts:289:  const { error } = await supabaseAdmin.from("discovery_audit_events").insert({
app/api/admin/discovery/runs/manual/claim/route.ts:304:  if (error) {
app/api/admin/discovery/runs/manual/claim/route.ts:305:    console.error("Failed to write manual crawler executor audit event.", {
```

## High-risk patterns requiring targeted review

1. Logging full error objects from database or authentication libraries.
2. Logging request bodies, headers, cookies, tokens, or authorization values.
3. Serializing complete response or row objects.
4. Printing environment values rather than presence booleans.
5. Returning internal exception messages to public clients.
6. Logging privileged operation payloads.
7. Logging stack traces in production without filtering.
8. Logging raw Supabase responses that may contain row data.

## Acceptable patterns

- stable error codes;
- non-sensitive operation identifiers;
- boolean configuration-presence checks;
- redacted identifiers;
- server-side structured logs with explicit field allowlists;
- generic public error messages;
- detailed internal context only when proven secret-safe.

## Static conclusion

The presence of logging calls does not establish a vulnerability. Each high-risk call site requires contextual source review.

Current determination:

`LOGGING_AND_ERROR_SURFACES_IDENTIFIED_SECRET_SAFE_BEHAVIOR_NOT_FULLY_ESTABLISHED`
