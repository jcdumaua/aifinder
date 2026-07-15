# Phase 26TA — Admin Route and Action Authorization Coverage Map

## Bound baseline

`686e2da84773e58001612cfe125025d27acbf9fc`

## Inspection boundary

Committed admin-facing routes, APIs, and action candidates were inspected statically for route-level authentication and authorization identifiers.

No route was invoked and no session, cookie, database, environment value, credential, or network service was accessed.

## Inventory result

- Admin route/action candidates: `44`
- Authentication/authorization identifier matches: `44`

## Admin route and action candidates

```text
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
```

## Route-level authorization evidence

```text
app/api/admin/discovery/candidate-extraction/invoke/route.ts:121:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:36:  | "unauthorized"
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:37:  | "forbidden"
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:180:    if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:185:      return errorResponse("unauthorized", "Unauthorized.", 401);
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts:193:        "forbidden",
app/api/admin/discovery/candidate-staging-queue/route.ts:23:  | "unauthorized"
app/api/admin/discovery/candidate-staging-queue/route.ts:24:  | "forbidden"
app/api/admin/discovery/candidate-staging-queue/route.ts:262:    if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/candidate-staging-queue/route.ts:271:            code: "unauthorized",
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts:77:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts:122:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/[id]/route.ts:38:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/[id]/route.ts:221:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/bulk-status/route.ts:120:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/discovered-tools/route.ts:84:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/intake/route.ts:197:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:22:  verifySession?: (request: Request) => AdminSession;
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:76:    const verifySession = dependencies.verifySession ?? getReadOnlyAdminSession;
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:80:    const adminSession = await verifySession(request);
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts:82:    if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/manual/claim/route.ts:1723:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/manual/route.ts:60:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/runs/route.ts:79:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/sources/[id]/route.ts:213:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/sources/route.ts:133:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/discovery/sources/route.ts:210:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts:44:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts:44:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/publish/route.ts:45:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/[id]/route.ts:77:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/homepage-control/drafts/route.ts:32:  if (!adminSession.isAdmin || !adminSession.actor) {
app/api/admin/submissions/route.ts:83:function requireAdminSecurity(request: Request) {
app/api/admin/submissions/route.ts:231:    const securityError = requireAdminSecurity(request);
app/api/admin/submissions/route.ts:301:    const securityError = requireAdminSecurity(request);
app/api/admin/submissions/route.ts:402:    const securityError = requireAdminSecurity(request);
app/api/admin/submissions/route.ts:497:    const securityError = requireAdminSecurity(request);
app/api/admin/tools/route.ts:73:function requireAdminSecurity(request: Request) {
app/api/admin/tools/route.ts:219:    const securityError = requireAdminSecurity(request);
app/api/admin/tools/route.ts:248:    const securityError = requireAdminSecurity(request);
app/api/admin/tools/route.ts:329:    const securityError = requireAdminSecurity(request);
app/api/admin/tools/route.ts:416:    const securityError = requireAdminSecurity(request);
app/api/admin/upload-logo/route.ts:66:function requireAdminSecurity(request: Request) {
app/api/admin/upload-logo/route.ts:145:    const securityError = requireAdminSecurity(request);
```

## Coverage interpretation

A route is not considered protected merely because:

- it resides under an admin path;
- middleware appears to cover it;
- a session is read;
- a UI component hides the route;
- a privileged client is available.

Each sensitive route or action must independently establish:

1. authenticated identity;
2. required role or permission;
3. denial behavior;
4. safe error response;
5. no privileged operation before authorization succeeds;
6. defense in depth independent of middleware.

## Static coverage states

- Explicit authentication and role/permission evidence found: 
- Authentication only, no explicit authorization evidence: 
- No local protection identifier: 
- Middleware-only protection: 

## Current determination

`ADMIN_AUTHORIZATION_CANDIDATES_MAPPED_COMPLETE_ROUTE_LEVEL_COVERAGE_NOT_ESTABLISHED`
