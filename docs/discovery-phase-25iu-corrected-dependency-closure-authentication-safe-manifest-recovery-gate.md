# Phase 25IU — Corrected Dependency Closure and Authentication-Safe Manifest Recovery Gate

## Phase identity

- Phase: `25IU`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static corrected-manifest recovery gate
- Approved predecessor phase: `25IT`
- Approved predecessor commit: `c163aa827280bf0f113c935bd00f340e88afeb4a`
- Source manifest baseline: `25df6000c66edc0a773facb98ea917d3e5f0f316`
- Historical manifest SHA-256: `cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c`
- Corrected evidence-manifest SHA-256: `1c87356e8e566aefd9ab3f6ee137910070db7658ba76b9e359b9c89e2db2a55d`
- Reduced public-only execution-manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Operational reactivation state: `BLOCKED`

## Recovery history

Two prior static recovery attempts failed closed:

1. the first attempt stopped on an unlabeled assertion;
2. the second attempt identified that `C02` is not credential-free.

Both failures occurred before artifact creation and before any runtime action.

No server was started, no route was invoked, no environment file or value was inspected, no live database or external service was accessed, and no commit or push occurred.

## Correction applied

The corrected recovery no longer requires every historical candidate to be public.

It now:

- preserves both historical candidates as static evidence;
- recognizes `PUBLIC_NO_SESSION_REQUIRED`, `SESSION_REQUIRED`, and `ADMIN_SESSION_REQUIRED`;
- excludes authenticated entries from the first controlled execution manifest;
- derives a reduced credential-free public-only manifest;
- keeps authenticated routes blocked pending a separately reviewed value-hidden authentication design;
- invalidates the earlier two-route execution authorization.

## Corrected invariant results

| Invariant | State | Evidence |
|---|---|---|
| `phase25is-old-manifest-sha-present` | `PASS` | Phase 25IS contains a manifest SHA-256 marker. |
| `phase25is-old-manifest-sha-matches` | `PASS` | The committed Phase 25IS manifest SHA matches the approved historical value. |
| `phase25is-entry-count-present` | `PASS` | Phase 25IS contains a selected-entry-count marker. |
| `phase25is-declared-entry-count-two` | `PASS` | The historical candidate manifest declares exactly two entries. |
| `phase25it-preserves-old-manifest-sha` | `PASS` | The committed Phase 25IT preflight preserves the historical manifest SHA. |
| `phase25it-runtime-not-executed` | `PASS` | The committed preflight records that runtime execution did not occur. |
| `manifest-table-rows-parse` | `PASS` | Parsed 2 deterministic candidate row(s); expected 2. |
| `source-tree-unchanged-since-manifest-baseline` | `PASS` | Only the committed Phase 25IS and Phase 25IT documentation artifacts changed after the source manifest baseline. |
| `C01-route-exists` | `PASS` | Selected route exists at the manifest baseline: app/api/homepage-control/published/route.ts. |
| `C01-get-only` | `PASS` | Selected route methods remain exactly GET: app/api/homepage-control/published/route.ts. |
| `C01-auth-class-recognized` | `PASS` | Selected route authentication class is recognized: PUBLIC_NO_SESSION_REQUIRED. |
| `C02-route-exists` | `PASS` | Selected route exists at the manifest baseline: app/api/admin/session/route.ts. |
| `C02-get-only` | `PASS` | Selected route methods remain exactly GET: app/api/admin/session/route.ts. |
| `C02-auth-class-recognized` | `PASS` | Selected route authentication class is recognized: ADMIN_SESSION_REQUIRED. |
| `local-import-resolution-complete` | `PASS` | Unresolved local/alias imports: 0. |
| `corrected-evidence-entry-count-two` | `PASS` | Corrected evidence manifest preserves 2 entry or entries. |
| `public-execution-candidate-present` | `PASS` | Credential-free public candidate count: 1. |
| `authenticated-entries-excluded-from-first-execution` | `PASS` | Authenticated entry count excluded from first execution: 1. |
| `corrected-evidence-manifest-sha-produced` | `PASS` | A deterministic corrected evidence-manifest SHA-256 was produced. |
| `public-execution-manifest-sha-produced` | `PASS` | A deterministic reduced public-only execution-manifest SHA-256 was produced. |
| `public-execution-manifest-differs-from-historical` | `PASS` | The reduced public-only manifest is distinct from the historical two-entry manifest. |

## Corrected two-entry evidence manifest

- Schema version: `3`
- Evidence entry count: `2`
- Corrected evidence-manifest SHA-256: `1c87356e8e566aefd9ab3f6ee137910070db7658ba76b9e359b9c89e2db2a55d`
- Runtime state: `STATIC_EVIDENCE_ONLY_NOT_EXECUTABLE`

| Entry | Route | Method | Auth | Old deps | Corrected deps | Execution class | Corrected entry SHA-256 |
|---|---|---|---|---:|---:|---|---|
| `C01` | `/api/homepage-control/published` (`app/api/homepage-control/published/route.ts`) | GET | `PUBLIC_NO_SESSION_REQUIRED` | 1 | 15 | `PUBLIC_CREDENTIAL_FREE_CANDIDATE` | `92866e677beda429a3d1687746c8142ede91ad5c165c60f3925017acb30aa762` |
| `C02` | `/api/admin/session` (`app/api/admin/session/route.ts`) | GET | `ADMIN_SESSION_REQUIRED` | 1 | 2 | `AUTHENTICATION_MECHANISM_REQUIRED_NOT_AUTHORIZED` | `b9f5f405df94255224c0a7dffa7cf476234e3d1b74172ca9aff10e7703cc01e4` |

## Reduced public-only execution candidate manifest

- Schema version: `3`
- Mode: `read_only_public_get_stop_on_first_failure`
- Public candidate count: `1`
- Reduced manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Runtime manifest file created: `no`
- Runtime execution performed: `no`
- Candidate state: `PUBLIC_ONLY_CANDIDATE_NOT_EXECUTED`

| Entry | Route | Auth | Dependency count | Entry SHA-256 |
|---|---|---|---:|---|
| `C01` | `/api/homepage-control/published` (`app/api/homepage-control/published/route.ts`) | `PUBLIC_NO_SESSION_REQUIRED` | 15 | `92866e677beda429a3d1687746c8142ede91ad5c165c60f3925017acb30aa762` |

## Authenticated candidates excluded from first execution

| Entry | Route | Auth requirement | State |
|---|---|---|---|
| `C02` | `/api/admin/session` (`app/api/admin/session/route.ts`) | `ADMIN_SESSION_REQUIRED` | `AUTHENTICATED_ROUTE_EXCLUDED_PENDING_SEPARATE_AUTH_DESIGN` |

An authenticated entry may be reconsidered only after a separate static authentication design proves:

- how session or administrator state is supplied without printing values;
- how cookies, tokens, headers, and sessions remain hidden;
- how authorization failure stops before route execution;
- how the authentication mechanism avoids mutation and external-service expansion;
- how Gemini and the user separately approve that mechanism.

## Corrected dependency closures

### C01 — `/api/homepage-control/published`

- Route file: `app/api/homepage-control/published/route.ts`
- Authentication class: `PUBLIC_NO_SESSION_REQUIRED`
- Execution class: `PUBLIC_CREDENTIAL_FREE_CANDIDATE`
- Corrected dependency count: `15`
- Corrected entry SHA-256: `92866e677beda429a3d1687746c8142ede91ad5c165c60f3925017acb30aa762`

| Dependency file | SHA-256 at source baseline |
|---|---|
| `app/api/homepage-control/published/route.ts` | `c7242b326a71eb54f14d72dc060f7d13709bafcb7cac753329cb42551dc05289` |
| `app/data/tools.ts` | `4cbd06d987e2a20ffe2fa1b1aa2a368335233b58fae2077b1afa0c6e96c067b4` |
| `components/public/tool-card.tsx` | `6e9add11d92b49f2d6dc7cbac5314cdd840b182eca592295eff2bbf655cb33fe` |
| `components/ui/badge.tsx` | `46a0de5224f6a5d5d63d45246534288518dce888f031064bff925bbc7fe6ad97` |
| `components/ui/button.tsx` | `cc36af0f8b5019c33cc039fbf03bb952a513072b15b55b53c592b78af3e5f4c4` |
| `components/ui/card.tsx` | `0cc9420f39823ff1f999007ec24ee54190a719ecefdbab247b848e4ea8febb44` |
| `lib/homepage-control-parser.ts` | `1d681e10139e978adaf8b30c932e9827be871b62ebb06e4f6a9ddacf71f53299` |
| `lib/homepage-control-public.ts` | `e9e2e5acdca6ebd7dcd26cd3883119a41153945c1fa7556bde0ed2b591cb4a71` |
| `lib/homepage-control-schema.ts` | `6f4c1d9252a8a12011881616e4218aaf956dbf290679804978f51a272287df31` |
| `lib/homepage-control-types.ts` | `82f0171bbaf5a28fc5475355b7bb7ddcacfd4023b52d712b7dc2c83244215f91` |
| `lib/homepage-control-validation.ts` | `337741f139ee2351abbaae9efea572deafc5b97bad721c539502fdfa49663c22` |
| `lib/public-tool-adapter.ts` | `a27e0c8e0459f3c280c955b76cd8de86b2ab61c0641acf375e6de5307497f565` |
| `lib/supabase-admin.ts` | `f48a3c80c6f66f32affa6b84460cfa539c4c5bc84719bea1fc5013fe17760637` |
| `lib/tool-categories.ts` | `5d7ae105a6539b070cdc214316ec37f2f2970c0a377ceef761e159d3cb619046` |
| `lib/utils.ts` | `7c8c3dfc0cdd370d44932828eb067ef771c8fe7996693221d5d4b90af6d54f2d` |

### C02 — `/api/admin/session`

- Route file: `app/api/admin/session/route.ts`
- Authentication class: `ADMIN_SESSION_REQUIRED`
- Execution class: `AUTHENTICATION_MECHANISM_REQUIRED_NOT_AUTHORIZED`
- Corrected dependency count: `2`
- Corrected entry SHA-256: `b9f5f405df94255224c0a7dffa7cf476234e3d1b74172ca9aff10e7703cc01e4`

| Dependency file | SHA-256 at source baseline |
|---|---|
| `app/api/admin/session/route.ts` | `dab0a973b44c5cb56a12d23e5da61c46088b1d4bf20748e122bfabe4a072d958` |
| `lib/admin-auth.ts` | `df5c2b6466f339a948406a1b0a06014fe2e0a024b2d6cca74d152df6dfd9decd` |

## Authorization impact

The prior human authorization referenced the historical two-entry manifest:

`cae251c8410b30636ea4da67a6506e2f51f411dc7da301cff8081727c38f696c`

The reduced public-only manifest is:

`19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`

Therefore, the previous execution authorization is invalid.

Authorization state:

`NEW_EXECUTION_SPECIFIC_HUMAN_AUTHORIZATION_REQUIRED_AFTER_GEMINI_AND_CORRECTED_PREFLIGHT_APPROVAL`

Runtime execution:

`NOT_EXECUTED`

## Successor requirements

No runtime script may be generated or run until:

1. Gemini approves this Phase 25IU recovery;
2. Phase 25IU is committed and pushed separately;
3. a Phase 25IV corrected preflight binds exactly to `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`;
4. Gemini approves Phase 25IV;
5. the user supplies a new exact authorization for the reduced public-only manifest;
6. local-only, GET-only, timeout, output, secret-safety, shutdown, and before/after controls remain fail-closed.

## Phase decision

Corrected static recovery:

`READY_FOR_GEMINI_REVIEW`

Reduced public-only execution candidate:

`NOT_AUTHORIZED`

Authenticated candidate execution:

`NOT_AUTHORIZED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Gemini senior-review questions

Gemini should approve Phase 25IU only if all answers are affirmative:

1. Is Phase 25IU anchored to exact Phase 25IT commit `c163aa827280bf0f113c935bd00f340e88afeb4a`?
2. Is exactly one documentation artifact introduced?
3. Did both prior attempts fail before artifact creation or runtime work?
4. Are exactly two GET-only historical candidates preserved as static evidence?
5. Is `C02` correctly retained as evidence but excluded from first execution because it is not credential-free?
6. Are recognized authentication classes handled without treating an authenticated route as an invariant failure?
7. Are local and alias dependency closures fingerprinted against `25df6000c66edc0a773facb98ea917d3e5f0f316`?
8. Is the reduced public-only manifest deterministic and bound to `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`?
9. Is no runtime manifest file created or populated?
10. Is the prior human authorization correctly invalidated?
11. Are authenticated execution, server startup, route invocation, live database access, mutation, cleanup, publishing, deployment, Batch D, operational reactivation, and launch unauthorized?
12. Are environment files and values untouched?
13. Are secrets and response bodies neither requested nor printed?
14. Does operational reactivation remain `BLOCKED`?

## Conditional successor

Only after Gemini approval and a separate Phase 25IU commit-and-push gate may Phase 25IV begin as the corrected preflight for reduced public-only manifest SHA-256 `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`.
