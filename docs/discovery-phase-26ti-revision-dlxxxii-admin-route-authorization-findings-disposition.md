# Phase 26TI — Admin Route Authorization Findings Disposition

## Bound baseline

`0836a17ebf4fc27627d9e99fdbbd29a8b8971a2e`

## Scope

Static contextual classification of committed admin routes, APIs, pages, and actions.

No request, session, cookie, database, environment value, credential, server, route, or network service was accessed.

## Files reviewed

`44`

## Contextual evidence

```text
### FILE: app/admin/analytics/page.tsx

### FILE: app/admin/discovered-tools/page.tsx

### FILE: app/admin/discovery/page.tsx

### FILE: app/admin/discovery/tools/[id]/page.tsx

### FILE: app/admin/discovery/tools/page.tsx

### FILE: app/admin/homepage-control/[id]/edit/page.tsx

### FILE: app/admin/homepage-control/[id]/page.tsx

### FILE: app/admin/homepage-control/[id]/preview/page.tsx

### FILE: app/admin/homepage-control/page.tsx

### FILE: app/admin/layout.tsx

### FILE: app/admin/moderation/page.tsx

### FILE: app/admin/notifications/page.tsx

### FILE: app/admin/page.tsx

### FILE: app/admin/security/page.tsx

### FILE: app/admin/settings/page.tsx

### FILE: app/admin/tools/page.tsx

### FILE: app/api/admin/audit-logs/route.ts

### FILE: app/api/admin/csrf/route.ts

### FILE: app/api/admin/discovery/candidate-extraction/invoke/route.ts
1-import { NextResponse } from "next/server";
2-import {
3:  verifyAdminCsrfRequest,
4:  verifyAdminSession,
5-} from "../../../../../../lib/admin-auth";
6-import {
7-  ADMIN_RATE_LIMIT_ACTIONS,
8:  checkAdminRateLimit,
9-  getAdminRateLimitResponseData,
10-} from "../../../../../../lib/admin-rate-limit";
11-import {
12-  invokeCandidateExtractionStagingPipeline,
13-  type CandidateExtractionInvocationInput,
14-  type CandidateExtractionInvocationOptions,
15-} from "../../../../../../lib/discovery/discovery-candidate-extraction-invocation";
16-import {
17-  resolveCandidatePreviewLiveStagingOptions,
18-  type CandidatePreviewLiveStagingResolverDependencies,
--
89-type CandidateExtractionRouteLiveStagingResolverInput = {
90-  request: Request;
91-  body: Record<string, unknown>;
92-  invocationInput: CandidateExtractionInvocationInput;
93-  invokedByAdminUserId: string;
94-};
95-
96-type CandidateExtractionRouteRateLimitInput = {
97-  request: Request;
98-  action: typeof ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateExtractionInvocation;
99:  actor: NonNullable<ReturnType<typeof verifyAdminSession>["actor"]>;
100-};
101-
102-export type CandidateExtractionRouteDependencies = {
103-  resolveLiveStagingOptions?: (
104-    input: CandidateExtractionRouteLiveStagingResolverInput,
105-  ) =>
106-    | CandidateExtractionInvocationOptions
107-    | Promise<CandidateExtractionInvocationOptions>;
108-  getCandidatePreview?: CandidatePreviewLiveStagingResolverDependencies["getCandidatePreview"];
109-  stageCandidate?: CandidatePreviewLiveStagingResolverDependencies["stageCandidate"];
110-  checkRateLimit?: (
111-    input: CandidateExtractionRouteRateLimitInput,
112-  ) => AdminRateLimitResult;
113-};
114-
115-export function createCandidateExtractionInvokeHandler(
116-  dependencies: CandidateExtractionRouteDependencies = {},
117-) {
118-  return async function candidateExtractionInvokeHandler(request: Request) {
119:  const adminSession = verifyAdminSession(request);
120-
121:  if (!adminSession.isAdmin || !adminSession.actor) {
122-    console.warn("Unauthorized candidate extraction invocation request.", {
123:      errors: adminSession.errors,
124-    });
125-
126-    return jsonResponse({ error: "Unauthorized" }, 401);
127-  }
128-
129:  if (!verifyAdminCsrfRequest(request)) {
130-    return jsonResponse(
131-      { error: "Security token missing or expired. Please log in again." },
132-      403,
133-    );
134-  }
135-
136-  const rateLimitInput = {
137-    request,
138-    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateExtractionInvocation,
139:    actor: adminSession.actor,
140-  };
141-
142-  const rateLimit = dependencies.checkRateLimit
143-    ? dependencies.checkRateLimit(rateLimitInput)
144:    : checkAdminRateLimit(rateLimitInput);
145-
146-  if (!rateLimit.allowed) {
147-    return jsonResponse(
148-      getAdminRateLimitResponseData(rateLimit),
149-      rateLimit.status,
150-    );
151-  }
152-
153-  let body: Record<string, unknown>;
154-
--
174-  if (hasUnsupportedBodyField(body)) {
175-    return jsonResponse(
176-      {
177-        error: "Unsupported candidate extraction invocation field.",
178-        code: "unsupported_request_field",
179-      },
180-      400,
181-    );
182-  }
183-
184:  const invokedByAdminUserId = getServerDerivedAdminActorId(adminSession.actor);
185-
186-  if (!invokedByAdminUserId) {
187-    return jsonResponse(
188-      {
189-        error: "Authenticated admin identity is unavailable.",
190-        code: "missing_admin_identity",
191-      },
192-      403,
193-    );
194-  }

### FILE: app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
1-import { NextResponse } from "next/server";
2-import {
3:  verifyAdminCsrfRequest,
4:  verifyAdminSession,
5-  type VerifyAdminSessionResult,
6-} from "../../../../../../../lib/admin-auth";
7-import {
8-  ADMIN_RATE_LIMIT_ACTIONS,
9:  checkAdminRateLimit,
10-  getAdminRateLimitResponseData,
11-  type AdminRateLimitResult,
12-} from "../../../../../../../lib/admin-rate-limit";
13-import {
14-  applyDiscoveryCandidateDecision,
15-  DiscoveryCandidateDecisionMutationError,
16-  type AppliedDiscoveryCandidateDecision,
17-  type DiscoveryCandidateDecisionMutationClient,
18-} from "../../../../../../../lib/discovery/discovery-candidate-decision-admin";
19-import {
--
26-
27-// Route: POST /api/admin/discovery/candidate-staging-queue/[id]/decision
28-
29-type RouteContext = {
30-  params: Promise<{
31-    id: string;
32-  }>;
33-};
34-
35-type CandidateDecisionApiErrorCode =
36:  | "unauthorized"
37:  | "forbidden"
38-  | "invalid_request_body"
39-  | DiscoveryCandidateDecisionValidationError["code"]
40-  | DiscoveryCandidateDecisionMutationError["code"];
41-
42-export type CandidateDecisionApiSuccessResponse = {
43-  ok: true;
44-  candidate: AppliedDiscoveryCandidateDecision;
45-};
46-
47-export type CandidateDecisionApiErrorResponse = {
--
52-  };
53-};
54-
55-type CandidateDecisionRouteRateLimitInput = {
56-  request: Request;
57-  action: typeof ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation;
58-  actor: NonNullable<VerifyAdminSessionResult["actor"]>;
59-};
60-
61-export type CandidateDecisionRouteDependencies = {
62:  verifyAdminSession?: (request: Request) => VerifyAdminSessionResult;
63:  verifyAdminCsrfRequest?: (request: Request) => boolean;
64-  checkRateLimit?: (
65-    input: CandidateDecisionRouteRateLimitInput,
66-  ) => AdminRateLimitResult;
67-  getClient?: () =>
68-    | DiscoveryCandidateDecisionMutationClient
69-    | Promise<DiscoveryCandidateDecisionMutationClient>;
70-  applyDecision?: typeof applyDiscoveryCandidateDecision;
71-};
72-
73-const MAX_BODY_SIZE_BYTES = 8 * 1024;
--
166-  );
167-}
168-
169-export function createCandidateDecisionHandler(
170-  dependencies: CandidateDecisionRouteDependencies = {},
171-) {
172-  return async function candidateDecisionHandler(
173-    request: Request,
174-    context: RouteContext,
175-  ) {
176:    const adminSession = (
177:      dependencies.verifyAdminSession || verifyAdminSession
178-    )(request);
179-
180:    if (!adminSession.isAdmin || !adminSession.actor) {
181-      console.warn("Unauthorized candidate decision mutation request.", {
182:        errors: adminSession.errors,
183-      });
184-
185:      return errorResponse("unauthorized", "Unauthorized.", 401);
186-    }
187-
188-    const csrfVerifier =
189:      dependencies.verifyAdminCsrfRequest || verifyAdminCsrfRequest;
190-
191-    if (!csrfVerifier(request)) {
192-      return errorResponse(
193:        "forbidden",
194-        "Security token missing or expired. Please log in again.",
195-        403,
196-      );
197-    }
198-
199-    const rateLimitInput = {
200-      request,
201-      action: ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation,
202:      actor: adminSession.actor,
203-    };
204-
205-    const rateLimit = dependencies.checkRateLimit
206-      ? dependencies.checkRateLimit(rateLimitInput)
207:      : checkAdminRateLimit(rateLimitInput);
208-
209-    if (!rateLimit.allowed) {
210-      return NextResponse.json(getAdminRateLimitResponseData(rateLimit), {
211-        status: rateLimit.status,
212-        headers: {
213-          "Cache-Control": "no-store",
214-          "X-Content-Type-Options": "nosniff",
215-        },
216-      });
217-    }
--
233-    try {
234-      const decisionInput = parseDiscoveryCandidateDecisionRequest({
235-        candidateId: id,
236-        body,
237-      });
238-      const client = dependencies.getClient ? await dependencies.getClient() : undefined;
239-      const applyDecision = dependencies.applyDecision || applyDiscoveryCandidateDecision;
240-      const result = await applyDecision(
241-        {
242-          ...decisionInput,
243:          actorLabel: getAdminActorLabel(adminSession.actor),
244-        },
245-        client ? { client } : {},
246-      );
247-
248-      return jsonResponse({
249-        ok: true,
250-        candidate: result.candidate,
251-      });
252-    } catch (error) {
253-      if (error instanceof DiscoveryCandidateDecisionValidationError) {

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
16-
17-export const runtime = "nodejs";
18-export const dynamic = "force-dynamic";
19-
20-// Route: GET /api/admin/discovery/candidate-staging-queue
21-
22-type CandidateStagingQueueApiReadRouteErrorCode =
23:  | "unauthorized"
24:  | "forbidden"
25-  | CandidateStagingQueueReadErrorCode;
26-
27-export type CandidateStagingQueueApiReadResponse = {
28-  ok: true;
29-  items: DiscoveryCandidateStagingQueueItem[];
30-  nextCursor: string | null;
31-  hasNextPage: boolean;
32-  limit: number;
33-  sortKey: CandidateStagingQueueSortKey;
34-  sortDirection: CandidateStagingQueueSortDirection;
--
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
--
248-async function getDefaultCandidateStagingQueueReadClient() {
249-  const { supabaseAdmin } = await import("../../../../../lib/supabase-admin");
250-
251-  return supabaseAdmin as unknown as CandidateStagingQueueReadClient;
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
271:            code: "unauthorized",
272-            message: "Unauthorized.",
273-          },
274-        },
275-        401,
276-      );
277-    }
278-
279-    const parsedInput = parseCandidateStagingQueueSearchParams(
280-      new URL(request.url).searchParams,
281-    );

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
11-import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
12-
13-export const runtime = "nodejs";
14-export const dynamic = "force-dynamic";
15-
16-type RouteContext = {
17-  params: Promise<{
18-    id: string;
--
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
108-  const { data: approvedToolId, error } = await supabaseAdmin.rpc(
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
11-import { supabaseAdmin } from "../../../../../../../lib/supabase-admin";
12-
13-export const runtime = "nodejs";
14-export const dynamic = "force-dynamic";
15-
16-type RouteContext = {
17-  params: Promise<{
18-    id: string;
--
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
--
278-      { error: "Duplicate candidate created, but status update failed." },
279-      500
280-    );
281-  }
282-
283-  const { error: auditError } = await supabaseAdmin
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

### FILE: app/api/admin/discovery/discovered-tools/[id]/route.ts
1-import { NextResponse } from "next/server";
2:import { verifyAdminCsrfRequest, verifyAdminSession } from "../../../../../../lib/admin-auth";
3-import {
4-  ADMIN_RATE_LIMIT_ACTIONS,
5:  checkAdminRateLimit,
6-  getAdminRateLimitResponseData,
7-} from "../../../../../../lib/admin-rate-limit";
8-import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
9-
10-export const runtime = "nodejs";
11-export const dynamic = "force-dynamic";
12-
13-type RouteContext = {
14-  params: Promise<{
15-    id: string;
--
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
--
209-  const reason = value.trim();
210-
211-  if (reason.length > MAX_REASON_LENGTH) {
212-    throw new Error("Reason is too long.");
213-  }
214-
215-  return reason;
216-}
217-
218-export async function PATCH(request: Request, context: RouteContext) {
219:  const adminSession = verifyAdminSession(request);
220-
221:  if (!adminSession.isAdmin || !adminSession.actor) {
222-    console.warn("Unauthorized Discovery Engine status update request.", {
223:      errors: adminSession.errors,
224-    });
225-
226-    return jsonResponse({ error: "Unauthorized" }, 401);
227-  }
228-
229:  if (!verifyAdminCsrfRequest(request)) {
230-    return jsonResponse(
231-      { error: "Security token missing or expired. Please log in again." },
232-      403
233-    );
234-  }
235-
236:  const rateLimit = checkAdminRateLimit({
237-    request,
238-    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolStatus,
239:    actor: adminSession.actor,
240-  });
241-
242-  if (!rateLimit.allowed) {
243-    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
244-  }
245-
246-  const { id } = await context.params;
247-
248-  if (!isValidUuid(id)) {
249-    return jsonResponse({ error: "Invalid discovered tool ID." }, 400);
--
328-    });
329-
330-    return jsonResponse({ error: "Failed to update discovered tool." }, 500);
331-  }
332-
333-  const { error: auditError } = await supabaseAdmin
334-    .from("discovery_audit_events")
335-    .insert({
336-      discovered_tool_id: id,
337-      action: DISCOVERY_AUDIT_ACTION_BY_STATUS[status],
338:      actor_id: adminSession.actor.id,
339:      actor_label: adminSession.actor.label,
340-      message: `Changed discovered tool status from ${existingTool.status} to ${status}.`,
341-      metadata: {
342-        from_status: existingTool.status,
343-        to_status: status,
344-        reason,
345-      },
346-    });
347-
348-  if (auditError) {
349-    console.error("Failed to write Discovery Engine audit event.", {

### FILE: app/api/admin/discovery/discovered-tools/bulk-status/route.ts
1-import { NextResponse } from "next/server";
2-import {
3:  verifyAdminCsrfRequest,
4:  verifyAdminSession,
5-} from "../../../../../../lib/admin-auth";
6-import {
7-  ADMIN_RATE_LIMIT_ACTIONS,
8:  checkAdminRateLimit,
9-  getAdminRateLimitResponseData,
10-} from "../../../../../../lib/admin-rate-limit";
11-import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
12-
13-export const runtime = "nodejs";
14-export const dynamic = "force-dynamic";
15-
16-const UUID_PATTERN =
17-  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
18-
--
108-  const reason = value.trim();
109-
110-  if (reason.length > MAX_REASON_LENGTH) {
111-    throw new Error("Reason is too long.");
112-  }
113-
114-  return reason || null;
115-}
116-
117-export async function POST(request: Request) {
118:  const adminSession = verifyAdminSession(request);
119-
120:  if (!adminSession.isAdmin || !adminSession.actor) {
121-    console.warn("Unauthorized Discovery Engine bulk status request.", {
122:      errors: adminSession.errors,
123-    });
124-
125-    return jsonResponse({ error: "Unauthorized" }, 401);
126-  }
127-
128:  if (!verifyAdminCsrfRequest(request)) {
129-    return jsonResponse(
130-      { error: "Security token missing or expired. Please log in again." },
131-      403
132-    );
133-  }
134-
135:  const rateLimit = checkAdminRateLimit({
136-    request,
137-    action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolBulkStatus,
138:    actor: adminSession.actor,
139-  });
140-
141-  if (!rateLimit.allowed) {
142-    return jsonResponse(getAdminRateLimitResponseData(rateLimit), rateLimit.status);
143-  }
144-
145-  let body: Record<string, unknown>;
146-
147-  try {
148-    body = await readJsonBody(request);
--
222-    console.error("Failed to bulk update Discovery Engine discovered tools.", {
223-      message: updateError.message,
224-    });
225-
226-    return jsonResponse({ error: "Failed to update selected candidates." }, 500);
```

## Disposition classes

### A1 — Explicit local admin authorization present

Evidence may include:

- `verifyAdminSession`;
- `adminSession.isAdmin`;
- actor validation;
- CSRF validation for mutations;
- rate-limit checks where applicable;
- denial before sensitive access.

Disposition: `STATIC_DEFENSE_IN_DEPTH_PRESENT`

### A2 — Session check present, admin check unclear

Disposition: `AUTHORIZATION_HARDENING_REQUIRED`

### A3 — Middleware-only or implicit protection

Disposition: `LAUNCH_BLOCKING_DEFENSE_IN_DEPTH_GAP`

### A4 — No local authorization evidence identified

Disposition: `HIGH_PRIORITY_SOURCE_FINDING`

### A5 — Non-sensitive surface

Disposition: `NOT_APPLICABLE_ONLY_WITH_REVIEWED_RATIONALE`

## Current result

Strong local authorization patterns are present across the admin surface, but every endpoint must receive an explicit final disposition before the route-security track can close.

`ADMIN_AUTHORIZATION_FINDINGS_CLASSIFIED_COMPLETE_ENDPOINT_DISPOSITION_PENDING`
