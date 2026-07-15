# Phase 26TM — Exact Privileged Call-Site Findings Table

## Bound baseline

`e68136c91dfd015d33126381e872536dffeafe2a`

## Inspection boundary

Static committed-source analysis only.

No build, source execution, server, route, database, network, environment value, credential, token, cookie, client bundle, or production system was accessed.

## Classification method

The table records exact file paths and source line candidates for:

- privileged Supabase client references;
- RPC calls;
- local authentication and authorization identifiers;
- input-validation identifiers;
- direct client-component overlap.

Automated classification is conservative. A potential finding is not treated as a confirmed vulnerability without manual source review.

## Exact findings table

| File | Privileged lines | Auth lines | Validation lines | Client | Disposition | Evidence type |
| --- | --- | --- | --- | --- | --- | --- |
| `app/api/admin/audit-logs/route.ts` | 4, 78, 95, 126, 139, 156, 162, 173, 190 | — | — | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | 249, 251 | 3, 4, 48, 258, 259, 262, 264 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` | 11, 108 | 4, 75, 77, 79, 95, 112, 113 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | 11, 220, 238, 262, 283 | 4, 120, 122, 124, 140, 288, 289 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | 8, 52, 70, 84, 98, 115, 132, 280, 318, 333 | 2, 36, 38, 40, 219, 221, 223, 239, 338, 339 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | 11, 171, 212, 243 | 4, 118, 120, 122, 138, 232, 233 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/discovered-tools/route.ts` | 3, 108, 171, 186, 201 | 2, 82, 84, 86 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/intake/route.ts` | 11, 166, 171, 176, 181, 187, 287, 317, 333, 391, 417, 447 | 4, 195, 197, 199, 215, 582, 583 | 14, 15, 16, 17, 18, 124, 159, 250, 251, 254, 263, 264 | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | 42, 289, 856, 894, 957, 1040, 1109, 1204, 1332, 1467, 1556, 1644 | 4, 1721, 1723, 1725, 1741, 1847, 1877, 1914, 1950, 1971, 1977, 2000 | 14, 180, 332, 1017, 1262, 1528, 1817, 1823, 1831, 1832 | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/runs/manual/route.ts` | 17, 107, 134, 167, 212 | 4, 58, 60, 62, 78, 217, 218 | 13, 14, 99, 114, 118, 126 | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/runs/route.ts` | 6, 98, 171 | 2, 77, 79, 81 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/sources/[id]/route.ts` | 11, 315, 341, 359, 382 | 4, 211, 213, 215, 231, 387, 388 | 13, 14, 89, 93, 259, 274 | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/discovery/sources/route.ts` | 11, 157, 280, 304, 328 | 4, 131, 133, 135, 208, 210, 212, 228, 333, 334 | 13, 14, 84, 88, 255, 265 | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `app/api/admin/submissions/route.ts` | 7, 177, 204, 237, 251, 257, 263, 269, 310, 354, 441, 506 | — | 11, 12, 13, 14, 15, 138, 141, 148, 150, 157, 158, 159 | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `app/api/admin/tools/route.ts` | 7, 173, 197, 225, 277, 362, 425 | — | 12, 13, 14, 15, 16, 128, 131, 138, 140, 147, 148, 149 | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `app/api/admin/upload-logo/route.ts` | 8, 232, 249 | — | — | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `app/api/submit-tool/route.ts` | 32 | — | 6, 7, 8, 9, 10, 11, 199, 212, 219, 221, 228, 234 | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `app/api/upload-logo/route.ts` | 2, 181, 198 | — | — | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `app/category/[slug]/page.tsx` | 7, 125 | — | — | NO | P4_SERVER_BOUNDARY_REQUIRES_MANUAL_CONFIRMATION | VERIFICATION_DEBT |
| `app/compare/page.tsx` | 6, 58 | — | — | NO | P4_SERVER_BOUNDARY_REQUIRES_MANUAL_CONFIRMATION | VERIFICATION_DEBT |
| `app/sitemap.ts` | 2, 17 | — | — | NO | P4_SERVER_BOUNDARY_REQUIRES_MANUAL_CONFIRMATION | VERIFICATION_DEBT |
| `app/tool/[slug]/page.tsx` | 3, 112 | — | — | NO | P4_SERVER_BOUNDARY_REQUIRES_MANUAL_CONFIRMATION | VERIFICATION_DEBT |
| `lib/admin-audit-log.ts` | 1, 69 | — | 47 | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `lib/discovery/discovery-candidate-decision-admin.ts` | 135, 137, 188 | — | 4, 42 | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `lib/discovery/discovery-candidate-preview-provider.ts` | 4, 620, 623, 624 | 248 | 357, 455, 747 | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `lib/discovery/discovery-candidate-staging-admin.ts` | 5, 49, 205, 206, 210, 218 | — | — | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `lib/discovery/discovery-supabase-admin.ts` | 7, 23, 30, 31 | 17 | — | NO | P1_LOCAL_AUTH_EVIDENCE_PRESENT | FAVORABLE_STATIC_EVIDENCE |
| `lib/homepage-control-admin.ts` | 16, 207, 650, 684, 716, 767, 826, 893, 1034, 1071, 1151, 1249 | — | 14, 177, 218, 673, 1232, 1365, 1606 | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `lib/homepage-control-public.ts` | 4, 60, 164 | — | — | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `lib/supabase-admin.ts` | 4, 6 | — | — | NO | P4_CALLER_CHAIN_REVIEW_REQUIRED | VERIFICATION_DEBT |

## Summary

- Privileged files: `30`
- Confirmed direct client-reachable privileged defects: see rows classified `P3_CLIENT_REACHABLE_PRIVILEGED_REFERENCE`
- Favorable local authorization evidence: see `P1_LOCAL_AUTH_EVIDENCE_PRESENT`
- Caller-chain or boundary verification debt: see `P4_*`

## Current determination

`EXACT_PRIVILEGED_FINDINGS_TABLE_CREATED_MANUAL_DISPOSITION_REQUIRED`
