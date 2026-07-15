# Phase 26TO — Exact Logging Findings Table

## Bound baseline

`e68136c91dfd015d33126381e872536dffeafe2a`

## Inspection boundary

Static committed-source analysis only.

No runtime logs, request bodies, response bodies, database rows, environment values, credentials, tokens, cookies, or production systems were accessed.

## Classification method

The table records exact file paths and line candidates for:

- selective `.message` logging;
- full error-object logging;
- potentially sensitive request, session, token, payload, data, or row context;
- ambiguous logging requiring manual review.

Pattern matching intentionally over-selects candidates to avoid false closure.

## Exact findings table

| File | Log lines | Message-only lines | Full-error lines | Sensitive-context lines | Disposition | Evidence type |
| --- | --- | --- | --- | --- | --- | --- |
| `app/api/admin/audit-logs/route.ts` | 83, 104, 135, 154, 168, 182, 199, 227 | 83, 104, 135, 154, 168, 182, 199 | 227 | — | L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/candidate-extraction/invoke/route.ts` | 122 | — | — | 122 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts` | 181, 261 | — | — | 181 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | 263 | — | — | 263 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` | 78, 118 | — | — | 78 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | 123, 227, 255, 273, 305 | — | — | 123 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | 39, 59, 77, 91, 106, 123, 140, 222, 287, 326, 349 | — | — | 39, 222 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | 121, 177, 222, 248 | — | — | 121 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/discovered-tools/route.ts` | 85, 146, 178, 193, 208 | — | — | 85 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/intake/route.ts` | 198, 296, 325, 341, 398, 437, 476, 519, 560, 602, 621 | — | — | 198 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts` | 83 | — | — | 83 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | 305, 866, 909, 972, 1055, 1124, 1219, 1349, 1482, 1571, 1659, 1724, 1782, 1817, 1895, 2086 | — | — | 972, 1055, 1124, 1219, 1349, 1724, 1895 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/runs/manual/route.ts` | 61, 114, 143, 193, 235 | — | — | 61 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/runs/route.ts` | 80, 124, 179 | — | — | 80 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/sources/[id]/route.ts` | 214, 323, 348, 369, 394 | — | — | 214 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/discovery/sources/route.ts` | 134, 189, 211, 287, 321, 346 | — | — | 134, 211 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts` | 45, 79 | — | — | 45 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts` | 45, 84 | — | — | — | L5_CONTEXTUAL_MANUAL_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `app/api/admin/homepage-control/drafts/[id]/publish/route.ts` | 46, 77 | — | — | 46 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/homepage-control/drafts/[id]/route.ts` | 78, 146 | — | — | 78 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/homepage-control/drafts/route.ts` | 33, 63 | — | — | 33 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/login/route.ts` | 98, 206 | — | 206 | — | L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/submissions/route.ts` | 185, 212, 246, 278, 293, 362, 457, 515 | 185, 212, 246, 278, 362, 457, 515 | 293 | — | L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/tools/route.ts` | 186, 210, 231, 240, 296, 378, 437 | 186, 210, 231, 296, 378, 437 | 240 | — | L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED | POTENTIAL_SOURCE_FINDING |
| `app/api/admin/upload-logo/route.ts` | 241, 272 | 241 | 272 | — | L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED | POTENTIAL_SOURCE_FINDING |
| `app/api/submit-tool/route.ts` | 89, 113, 270 | 89, 270 | — | 270 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `app/api/upload-logo/route.ts` | 190, 207 | 190 | 207 | — | L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED | POTENTIAL_SOURCE_FINDING |
| `app/category/[slug]/page.tsx` | 131 | 131 | — | — | L1_SELECTIVE_MESSAGE_LOGGING | FAVORABLE_STATIC_EVIDENCE |
| `app/compare/page.tsx` | 64 | 64 | — | — | L1_SELECTIVE_MESSAGE_LOGGING | FAVORABLE_STATIC_EVIDENCE |
| `app/page.tsx` | 272, 579 | 272 | — | — | L1_SELECTIVE_MESSAGE_LOGGING | FAVORABLE_STATIC_EVIDENCE |
| `app/sitemap.ts` | 23 | 23 | — | — | L1_SELECTIVE_MESSAGE_LOGGING | FAVORABLE_STATIC_EVIDENCE |
| `app/tool/[slug]/page.tsx` | 118 | 118 | — | — | L1_SELECTIVE_MESSAGE_LOGGING | FAVORABLE_STATIC_EVIDENCE |
| `components/public/tool-card.tsx` | 71 | — | — | — | L5_CONTEXTUAL_MANUAL_REVIEW_REQUIRED | VERIFICATION_DEBT |
| `lib/admin-audit-log.ts` | 85, 88 | 85 | 88 | — | L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED | POTENTIAL_SOURCE_FINDING |
| `lib/admin-auth.ts` | 50 | — | — | 50 | L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING | POTENTIAL_SOURCE_FINDING |
| `lib/homepage-control-admin.ts` | 1163, 1183, 1259, 1307 | 1259 | — | — | L1_SELECTIVE_MESSAGE_LOGGING | FAVORABLE_STATIC_EVIDENCE |

## Summary

- Files containing logging calls: `36`
- Selective message logging candidates: `L1_SELECTIVE_MESSAGE_LOGGING`
- Full-error review candidates: `L2_FULL_ERROR_OBJECT_REVIEW_REQUIRED`
- Potential sensitive-context candidates: `L3_POTENTIAL_SENSITIVE_CONTEXT_LOGGING`
- Manual contextual review debt: `L5_CONTEXTUAL_MANUAL_REVIEW_REQUIRED`

## Current determination

`EXACT_LOGGING_FINDINGS_TABLE_CREATED_MANUAL_DISPOSITION_REQUIRED`
