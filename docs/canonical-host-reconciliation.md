# Canonical Host Reconciliation

## Decision

AiFinder’s selected public canonical origin is
`https://www.aifinder.to`. Phase 30JP–30KF confirmed this direction with exactly
two anonymous HEAD requests:

- `https://aifinder.to/` returned `307` with the exact normalized Location
  `https://www.aifinder.to/`;
- `https://www.aifinder.to/` returned `200` without a Location redirect.

No redirect was followed, no response body was retained, and no browser or
full seven-surface runtime suite was executed.

## Failed predecessor

The one-use Phase 30JC–30JO runtime attempt remains immutable failed evidence:

- classification:
  `FAILED_PHASE_30JC_30JO_CANONICAL_METADATA_ORIGIN_MISMATCH_FAIL_CLOSED`;
- failure code: `RUNTIME_CANONICAL_METADATA_ORIGIN`;
- failure message SHA-256:
  `bdfceb0f94def1c781b827f1c02bae7a7759001d63f50f5b074f637743ac7c23`;
- CCR SHA-256:
  `804ecfa2d25216c1a9c589bfdff90c64822cd1b3859f4c1f9bcca1a0d829094d`;
- runtime attempts/retries: `1/0`.

Its authorization is spent and non-reusable. Canonical source reconciliation
does not convert that failed result into successful runtime evidence.

## Source of truth

`lib/public-canonical-origin.ts` is the sole current source for the public
canonical origin, host, and security disclosure URL. The root layout, robots,
sitemap, compare page, category page, and tool page import that source. The
security disclosure’s Canonical field uses the same `www` origin.

The static perimeter and resilience tests parse the shared source and its six
consumers without importing or executing application modules. Historical
Phase-29 apex identities remain explicit historical evidence rather than
current canonical values.

## Readiness boundary

All 69 readiness-matrix entries remain launch-blocking, and the five-workstream
partition remains `7/13/3/18/28`. The seven public-production-runtime entries
now use
`CANONICAL_HOST_SOURCE_ALIGNED_FULL_RUNTIME_RETEST_REQUIRED`. The overall
decision remains `NO_GO_PENDING_SEPARATE_AUTHORITIES`.

The exact next gate is
`SEPARATE_ONE_USE_PUBLIC_PRODUCTION_RUNTIME_RETEST_REVIEW`. It requires a new,
separately reviewed one-use authority. This phase does not authorize a browser
retest, application start, real environment access, Supabase, SQL, database
access, direct Vercel writes, operational reactivation, publishing, or public
launch.

## Stable finalization binding

The non-circular Phase 30JP–30KF binding is appended only after the external
finalization validator records the required missing-binding RED.

```text
AIFINDER_PHASE_30JP_30KF_STABLE_FINALIZATION_BINDING_BEGIN
PHASE=PHASE_30JP_30KF_EXACT_20_PATH_WWW_CANONICAL_HOST_SOURCE_OF_TRUTH_RECONCILIATION_STATIC_REBIND_CI_AND_BOUNDED_POST_DEPLOY_METADATA_VERIFICATION
GEMINI_AUTHORIZATION=APPROVE_PHASE_30JP_30KF_EXACT_20_PATH_WWW_CANONICAL_HOST_SOURCE_OF_TRUTH_RECONCILIATION_BOUNDED_ALIAS_HEAD_CONFIRMATION_TDD_MUTATION_ASSURANCE_STATIC_REBIND_FINAL_REVIEW_STAGE_COMMIT_PUSH_AUTOMATIC_GITHUB_ACTIONS_AND_VERCEL_GIT_SIDE_EFFECTS_BOUNDED_POST_DEPLOY_CANONICAL_METADATA_HTTP_VERIFICATION_APPLICATION_INITIATED_PUBLIC_ANONYMOUS_INDIRECT_READ_ONLY_NO_BROWSER_NO_REAL_ENV_NO_SECRET_NO_CODEX_CONSTRUCTED_SUPABASE_NO_SQL_NO_DATABASE_API_NO_FORM_OR_USER_MUTATION_NO_DIRECT_VERCEL_WRITE_NO_MANUAL_WORKFLOW_DISPATCH_NO_RERUN_NO_FORCE_PUSH_NO_PUBLIC_LAUNCH
AUTHORIZATION_STATE=CONSUMED_EXACTLY_ONCE_SPENT_NON_REUSABLE
FAILED_RUNTIME_CCR_SHA256=804ecfa2d25216c1a9c589bfdff90c64822cd1b3859f4c1f9bcca1a0d829094d
STARTING_COMMIT=ba73dcb73415e38e8b226290b2eb8d290032ca5d
CANONICAL_ORIGIN=https://www.aifinder.to
ALTERNATE_ORIGIN=https://aifinder.to
ALIAS_DIRECTION=APEX_REDIRECTS_ONE_HOP_TO_WWW
AUTHORIZED_PATHS=20
COMPOSITION=18M,2A,0D
OLD_GAP=SYNTHETIC_BROWSER_PASSED_PRODUCTION_RUNTIME_UNVERIFIED
NEW_GAP=CANONICAL_HOST_SOURCE_ALIGNED_FULL_RUNTIME_RETEST_REQUIRED
BROWSER_EXECUTED=false
DIRECT_VERCEL_WRITE=false
COMMIT_SUBJECT=Align canonical metadata with www production host
SUCCESS_CLASSIFICATION=PASSED_PHASE_30JP_30KF_EXACT_20_PATH_WWW_CANONICAL_HOST_RECONCILIATION_AND_BOUNDED_POST_DEPLOY_METADATA_VERIFICATION
AIFINDER_PHASE_30JP_30KF_STABLE_FINALIZATION_BINDING_END
```
