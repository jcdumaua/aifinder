# Phase 26TN — Exact Admin Authorization Findings Table

## Bound baseline

`e68136c91dfd015d33126381e872536dffeafe2a`

## Inspection boundary

Static committed-source analysis only.

No request, session, cookie, database, environment value, credential, server, route, network, or production system was accessed.

## Classification method

The table records exact file paths and source line candidates for:

- local admin/session checks;
- CSRF checks;
- rate-limit checks;
- mutation handlers;
- missing or unclear local authorization.

Automated classification is conservative. Pages and shared components may require a reviewed non-sensitive rationale rather than an authorization check.

## Exact findings table

| File | Mutation | Auth lines | CSRF lines | Rate-limit lines | Disposition | Evidence type |
| --- | --- | --- | --- | --- | --- | --- |
| `app/admin/analytics/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/discovered-tools/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/discovery/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/discovery/tools/[id]/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/discovery/tools/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/homepage-control/[id]/edit/page.tsx` | YES | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/homepage-control/[id]/page.tsx` | YES | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/homepage-control/[id]/preview/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/homepage-control/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/layout.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/moderation/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/notifications/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/security/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/settings/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/admin/tools/page.tsx` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/audit-logs/route.ts` | YES | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/csrf/route.ts` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/candidate-extraction/invoke/route.ts` | YES | 4, 99, 119, 121, 123, 139, 184 | 3, 129 | 7, 8, 9, 10, 21, 22, 96, 98, 110, 111, 112, 136 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts` | YES | 4, 5, 58, 62, 144, 176, 177, 180, 182, 202, 243 | 3, 63, 189 | 8, 9, 10, 11, 12, 55, 57, 64, 65, 66, 199, 201 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | NO | 3, 4, 48, 258, 259, 262, 264 | — | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` | YES | 4, 75, 77, 79, 95, 112, 113 | 3, 85 | 7, 8, 9, 10, 92, 94, 98, 99 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | YES | 4, 120, 122, 124, 140, 288, 289 | 3, 130 | 7, 8, 9, 10, 137, 139, 143, 144 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | YES | 2, 36, 38, 40, 219, 221, 223, 239, 338, 339 | 2, 229 | 4, 5, 6, 7, 236, 238, 242, 243 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | YES | 4, 118, 120, 122, 138, 232, 233 | 3, 128 | 7, 8, 9, 10, 135, 137, 141, 142 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/route.ts` | NO | 2, 82, 84, 86 | — | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/intake/route.ts` | YES | 4, 195, 197, 199, 215, 582, 583 | 3, 205 | 7, 8, 9, 10, 212, 214, 218, 219 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts` | NO | 2, 12, 13, 22, 40, 76, 80, 82, 84, 91 | — | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | YES | 4, 1721, 1723, 1725, 1741, 1847, 1877, 1914, 1950, 1971, 1977, 2000 | 3, 1731 | 8, 9, 10, 11, 1738, 1740, 1744, 1745 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/runs/manual/route.ts` | YES | 4, 58, 60, 62, 78, 217, 218 | 3, 68 | 7, 8, 9, 10, 75, 77, 81, 82 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/runs/route.ts` | NO | 2, 77, 79, 81 | — | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/sources/[id]/route.ts` | YES | 4, 211, 213, 215, 231, 387, 388 | 3, 221 | 7, 8, 9, 10, 228, 230, 234, 235 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/sources/route.ts` | YES | 4, 131, 133, 135, 208, 210, 212, 228, 333, 334 | 3, 218 | 7, 8, 9, 10, 225, 227, 231, 232 | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts` | YES | 4, 42, 44, 46, 75 | 3, 60 | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts` | YES | 4, 42, 44, 48, 80 | 3, 63 | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/homepage-control/drafts/[id]/publish/route.ts` | YES | 4, 43, 45, 47, 74 | 3, 61 | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/homepage-control/drafts/[id]/route.ts` | YES | 4, 75, 77, 79, 140 | 3, 93 | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/homepage-control/drafts/route.ts` | YES | 4, 30, 32, 34, 60 | 3, 48 | — | A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/login/route.ts` | YES | — | — | 10, 11, 14, 37, 39, 42, 44, 50, 55, 79, 84 | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/logout/route.ts` | YES | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/session/route.ts` | NO | — | — | — | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/submissions/route.ts` | YES | — | 5, 95 | 22, 23, 25, 59, 62, 65, 67, 73, 78, 84 | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/tools/route.ts` | YES | — | 5, 85 | 23, 24, 26, 49, 52, 55, 57, 63, 68, 74 | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/upload-logo/route.ts` | YES | — | 6, 83 | 17, 18, 20, 43, 45, 48, 50, 56, 61, 69 | A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED | POTENTIAL_SOURCE_FINDING |

## Summary

- Admin route/action files: `44`
- Strong local defense candidates: `A1_EXPLICIT_LOCAL_ADMIN_DEFENSE_PRESENT`
- Mutation CSRF review candidates: `A2_MUTATION_CSRF_EVIDENCE_MISSING`
- Session-only or unclear authorization candidates: `A2_SESSION_PRESENT_ADMIN_CHECK_UNCLEAR`
- Missing local check candidates: `A4_NO_LOCAL_AUTHORIZATION_EVIDENCE_IDENTIFIED`

## Current determination

`EXACT_ADMIN_AUTHORIZATION_FINDINGS_TABLE_CREATED_MANUAL_DISPOSITION_REQUIRED`
