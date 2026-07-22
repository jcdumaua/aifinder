# Phase 27NG-27NL Secret-Safe Live-Preflight Static Repair Gate

## Authorization, baseline, and scope

- Gemini planning authorization (consumed once for this static-repair batch only): `APPROVE_PHASE_27NA_27NF_MIGRATION_HISTORY_GRANT_DEPENDENCY_AND_SECRET_SAFE_LIVE_PREFLIGHT_STATIC_READINESS_PLAN`
- Phase: `PHASE_27NG_27NL_SECRET_SAFE_LIVE_PREFLIGHT_STATIC_REPAIR`
- Required repository: `/Users/jamescarlodumaua/aifinder`; branch: `main`.
- Required HEAD, local `main`, local `origin/main`, and read-only remote `main`: `9cc9d08330ec2579c74a1db3094330f4bc458ed6`; required ahead/behind: `0/0`; required index: empty; required tracked tree: clean; required untracked count: `0` before the authorized batch.
- Required parent and subject: `f8e6a4c375acae7609b572b06376e5d0f14486b7` / `Restore fail-closed RLS migration guards`.
- This gate records the required baseline and exact candidate identities; it does not assert a live baseline, database state, or execution result.

The exact authorized scope is four new paths only:

1. `scripts/_drafts/discovery-phase-27ng-27nl-secret-safe-live-preflight-candidate.sql`
2. `scripts/_drafts/discovery-phase-27ng-27nl-secret-safe-live-preflight-wrapper-candidate.sh`
3. `scripts/_drafts/discovery-phase-27ng-27nl-static-identity-manifest.json`
4. `docs/discovery-phase-27ng-27nl-secret-safe-live-preflight-static-repair-gate.md`

No existing path is authorized to be modified, deleted, moved, renamed, chmodded, normalized, staged, committed, or pushed. The three prior metadata candidates remain ineligible: they predate this reviewed, identity-bound, secret-safe contract; do not provide the exact 56-key normalized output contract and per-key categorical validation; and do not provide this wrapper's one-use descriptor, bounded-output, atomic-consumption, and no-raw-error controls. Their identities remain preserved, not adopted: `scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql` (`b2b93480012f4dbec65203c556829b61b49500ab85fd5e0c493084b9b57f3589`), `scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql` (`2b231fe90f7e0cfca150535cb2d90b7ab96514fa50d7efc567cdeecba4738d43`), and `scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql` (`32ea49528123a7bbafe6d430fdc637a91da4a6c977ee5cc9e5f912770a907c55`).

## New artifact identities

| Path | SHA-256 | Bytes | Git mode expectation | Filesystem mode expectation |
| --- | --- | ---: | --- | --- |
| `scripts/_drafts/discovery-phase-27ng-27nl-secret-safe-live-preflight-candidate.sql` | `7ac8fef2247fb99a4987bfdd5ff14667c0f22519c1bfcd3453c58d19b64c99e7` | 30419 | `100644` | `0644` |
| `scripts/_drafts/discovery-phase-27ng-27nl-secret-safe-live-preflight-wrapper-candidate.sh` | `f7f989e92df1bb3f36a75dabbb62f71b55cf2fc55f59be534903aa0a713376fc` | 43318 | `100644` | `0644` |
| `scripts/_drafts/discovery-phase-27ng-27nl-static-identity-manifest.json` | `12b4fb63d0da0f6ff0db62e888646f584fb6a80f0600539088f522e45ae396a9` | 34443 | `100644` | `0644` |
| `docs/discovery-phase-27ng-27nl-secret-safe-live-preflight-static-repair-gate.md` | externally bound | externally bound | `100644` | `0644` |

The document self-path and mode are bound above. Its complete-file SHA-256 and byte count are deliberately not self-embedded: doing so would be circular. They must be computed after its final content is complete and bound externally by the timestamped final-review package.

## Bound planning inputs and preserved state

The controlling Phase 27NA-27NF artifacts are bound as follows:

| Artifact | SHA-256 |
| --- | --- |
| `docs/discovery-phase-27mw-27mz-active-migration-guard-divergence-containment-gate.md` | `48c225c3525536c9d942bd7f7c402ee1b8ab9427ae41330d96a679ba7d422c77` |
| `docs/discovery-phase-27mn-27mq-database-rls-migration-static-reconciliation-planning-gate.md` | `a9d13a7e6115d6d4e1842c7cd8c27dc2e16de6635c908d3ac280749ef5fd34e8` |
| `docs/discovery-phase-27mr-27mv-database-rls-migration-static-reconciliation-inspection-gate.md` | `43223adbe692874b9cf2a039fbb34dae0fe4a510fa8102777b9b8f766d02bf1b` |
| `docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md` | `3bd21fd9921650cd07f06f374d5cd34c644d8f134d0a1fcbdfd6b752ab0b7204` |
| `docs/discovery-phase-26xw-guard-removal-and-rls-remediation-execution-readiness-planning-gate.md` | `753b2fc1c6c9b238201a11ee067abb4c0ef831282951fe6b087c219d876f80a8` |
| `docs/discovery-phase-25cj-supabase-type-generation-execution-result-documentation-gate.md` | `2d652182ed96770801c872651ad00e7ca1a9c44eaf9a647bfd52bcad5048cb74` |

The manifest additionally binds the six Phase 27NA planning authorities at `/private/tmp/aifinder-phase-27na-27nf-static-readiness-20260721T004200Z`:

| Artifact | SHA-256 | Bytes | Filesystem mode |
| --- | --- | ---: | --- |
| `01-migration-filename-placement-disposition.md` | `8083bcea9a395e44d52e82daa7f011488ee8e0e34270470d98d9bee61c02a23a` | 6109 | `0644` |
| `02-migration-history-evidence-contract.md` | `165b5dcd9129a13069ec336b3e8d623662fbc6be7e636e79f4af134817582a0a` | 5109 | `0644` |
| `03-audit-grant-dependency-map.md` | `9a6b532ef341d87105ba5db414d2c2524cea0fb1d249c92568fc638975043bdc` | 5467 | `0644` |
| `04-secret-safe-live-preflight-design.md` | `292d982c95e39ee0663035c57b6b5a5f7ee2867aff72260c13b541ddacbf074b` | 4832 | `0644` |
| `05-failure-rollback-contract.md` | `7bf0109221c3357ff8256b121fec4ac79249596d284259cfd9d85d9234111765` | 3811 | `0644` |
| `06-type-generation-dependency-order.md` | `31d39d96edbbee4bb59a3f85596dea750ee4ae39ec3374158e8ca3093bb1202d` | 2363 | `0644` |

The active migration inventory is also bound in full: 24 active paths, of which 22 canonical 14-digit identities are `EXPECTED_HISTORY_IDENTITY` and two nonstandard 8-digit candidates are `QUARANTINED_NONSTANDARD_CANDIDATE`. Every entry binds path, prefix classification, SHA-256, Git blob, byte count, Git mode, and eligibility; the two quarantined entries also bind their byte-identical draft counterparts.

The active and draft forward guard identity remains `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9`; the active and draft rollback guard identity remains `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f`. Both pairs remain byte-identical, each guard remains before its transaction, and both migration candidates remain `QUARANTINED_NONSTANDARD_CANDIDATE`. Migration filename and placement remain unresolved and require targeted inspection; this phase neither activates nor places a migration.

Existing migrations, existing metadata candidates, guards, and drafts are unchanged. The generated-type target remains unchanged: `lib/supabase/database.types.ts`, SHA-256 `7173e35d74fa7f59ff3469c2d7e1c95984cfcf37c00b934b1b48ec0f39f1d72c`, Git mode `100644`, observed filesystem mode `0600`.

Audit-table and audit-sequence grant cleanup are a distinct dependency workstream from `public.tools` legacy-policy remediation. This candidate can classify both, but it neither merges their remediation nor authorizes either mutation.

## SQL candidate contract

The SQL candidate is inert until all three reviewed wrapper variables are present and exact; absent or invalid activation fails closed before the transaction. It sets `ON_ERROR_STOP`, opens exactly one `BEGIN TRANSACTION READ ONLY`, applies bounded statement (`5s`), lock (`2s`), and idle-in-transaction (`10s`) timeouts, uses no dynamic SQL, and ends in `ROLLBACK`.

Its only live input surfaces are approved PostgreSQL catalog/privilege surfaces: `pg_catalog.pg_class`, `pg_namespace`, `pg_policy`, `pg_roles`, `aclexplode`, `pg_get_expr`, and table/sequence privilege predicates for the fixed expected audit objects. It deliberately does not query `supabase_migrations.schema_migrations`: Phase 27NA establishes that version/name-only history cannot prove exact content identity, and the reviewed surface has no trustworthy content digest or approved deployment ledger. Repository-bound `VALUES`/CTEs provide expected relations, policies, policy shapes, and classification thresholds. It does not read application-table rows. Catalog facts are folded inside CTEs into integer counts and reviewed classifications, then emitted only through one ordered `key|value` aggregate surface. There are no mutation statements, DDL, grants/revokes, extension or temporary-table creation, or `COPY`/dynamic execution paths.

The output proof is structural: only the fixed 56 keys below can be selected; values are counts, booleans, a UTC timestamp, required literals, or reviewed categorical values. No raw catalog row, migration-history row, policy expression, grant row, owner/role name, function body, trigger/index/constraint/default definition, row value, URL, hostname, project reference, credential, secret, or raw error text is a permitted output value. Because trustworthy migration content identity is unavailable, keys 5 through 13 are deterministically `UNAVAILABLE`. The expected owner identity is unresolved. Exact table/column default ownership, default-reached functions, trigger enabled state, and linked function security are also not established by the planning inputs. Ownership, sequence dependency, function security, and trigger dependency therefore all emit `UNAVAILABLE`; partial catalog matches cannot overstate `EXPECTED_MATCH`. Any unavailable migration, policy, grant, ownership, sequence, function, or trigger evidence propagates to `OUT_OF_BAND_DRIFT_CLASSIFICATION`, `FORWARD_PRECONDITION_CLASSIFICATION`, and, where applicable, `ROLLBACK_PRECONDITION_CLASSIFICATION`; version-only or partial dependency matching can never produce `EXACT_MATCH`, `NONE`, or `PASS`.

## Exact 56-key output allowlist

```text
TARGET_ENVIRONMENT_CLASSIFICATION
EVIDENCE_TIMESTAMP_UTC
SNAPSHOT_IDENTITY_CLASSIFICATION
EXPECTED_REPOSITORY_MIGRATION_COUNT
EXPECTED_HISTORY_IDENTITY_COUNT
LIVE_HISTORY_ENTRY_COUNT
MATCHED_HISTORY_IDENTITY_COUNT
MISSING_HISTORY_IDENTITY_COUNT
UNEXPECTED_HISTORY_IDENTITY_COUNT
DUPLICATED_HISTORY_IDENTITY_COUNT
RENAMED_SAME_CONTENT_COUNT
DIFFERENT_CONTENT_COUNT
MIGRATION_HISTORY_OVERALL_CLASSIFICATION
EXPECTED_RELATION_COUNT
PRESENT_RELATION_COUNT
MISSING_RELATION_COUNT
RLS_ENABLED_COUNT
RLS_FORCED_COUNT
EXPECTED_POLICY_COUNT
MATCHED_POLICY_COUNT
UNEXPECTED_POLICY_COUNT
TOOLS_LEGACY_POLICY_COUNT
TOOLS_APPROVED_ONLY_POLICY_COUNT
POLICY_CLASSIFICATION
EXPECTED_GRANT_CLASS_COUNT
MATCHED_GRANT_CLASS_COUNT
UNEXPECTED_GRANT_CLASS_COUNT
PUBLIC_GRANT_CLASSIFICATION
ANON_GRANT_CLASSIFICATION
AUTHENTICATED_GRANT_CLASSIFICATION
SERVICE_ROLE_GRANT_CLASSIFICATION
OWNERSHIP_CLASSIFICATION
SEQUENCE_DEPENDENCY_CLASSIFICATION
FUNCTION_SECURITY_CLASSIFICATION
TRIGGER_DEPENDENCY_CLASSIFICATION
OUT_OF_BAND_DRIFT_CLASSIFICATION
FORWARD_PRECONDITION_CLASSIFICATION
ROLLBACK_PRECONDITION_CLASSIFICATION
TYPE_GENERATION_ELIGIBILITY_CLASSIFICATION
ROW_VALUES_PRINTED
RAW_CATALOG_ROWS_PRINTED
RAW_MIGRATION_HISTORY_ROWS_PRINTED
POLICY_EXPRESSIONS_PRINTED
GRANT_ROWS_PRINTED
OWNER_IDENTITIES_PRINTED
FUNCTION_BODIES_PRINTED
TRIGGER_DEFINITIONS_PRINTED
INDEX_DEFINITIONS_PRINTED
CONSTRAINT_DEFINITIONS_PRINTED
DATABASE_URL_PRINTED
HOSTNAMES_PRINTED
PROJECT_REFERENCE_PRINTED
CREDENTIALS_PRINTED
SECRETS_PRINTED
RAW_ERROR_TEXT_PRINTED
UNAPPROVED_DATABASE_IDENTIFIERS_PRINTED
```

`SNAPSHOT_IDENTITY_CLASSIFICATION` is exactly `SINGLE_READ_ONLY_TRANSACTION`; `EXPECTED_REPOSITORY_MIGRATION_COUNT` is exactly `24`; and `EXPECTED_GRANT_CLASS_COUNT` is exactly `4`. The migration-history identity counts, renamed/content counts, live relation counts, matched/unexpected policy counts, legacy-policy counts, and matched/unexpected grant-class counts accept either a non-negative integer or `UNAVAILABLE`. `TYPE_GENERATION_ELIGIBILITY_CLASSIFICATION` accepts `BLOCKED` or `UNAVAILABLE`. Every negative assertion key from `ROW_VALUES_PRINTED` through `UNAPPROVED_DATABASE_IDENTIFIERS_PRINTED` is exactly `false`.

## Exact categorical allowlists

| Key | Exact allowed values |
| --- | --- |
| `TARGET_ENVIRONMENT_CLASSIFICATION` | `LOCAL`, `PREVIEW`, `STAGING`, `PRODUCTION` |
| `MIGRATION_HISTORY_OVERALL_CLASSIFICATION` | `UNAVAILABLE`, `DUPLICATED`, `OUT_OF_BAND`, `DRIFT`, `EXACT_MATCH` |
| `POLICY_CLASSIFICATION` | `SEMANTIC_MISMATCH`, `MISSING`, `UNEXPECTED`, `EXACT_MATCH`, `UNAVAILABLE` |
| `PUBLIC_GRANT_CLASSIFICATION` | `UNAVAILABLE`, `EXPECTED_NONE`, `UNEXPECTED_PRESENT` |
| `ANON_GRANT_CLASSIFICATION` | `UNAVAILABLE`, `EXPECTED_NONE`, `UNEXPECTED_PRESENT` |
| `AUTHENTICATED_GRANT_CLASSIFICATION` | `UNAVAILABLE`, `EXPECTED_NONE`, `UNEXPECTED_PRESENT` |
| `SERVICE_ROLE_GRANT_CLASSIFICATION` | `UNAVAILABLE`, `INSUFFICIENT`, `SUFFICIENT`, `UNEXPECTED` |
| `OWNERSHIP_CLASSIFICATION` | `UNAVAILABLE`, `EXPECTED_MATCH`, `MISMATCH` |
| `SEQUENCE_DEPENDENCY_CLASSIFICATION` | `UNAVAILABLE`, `MISSING`, `EXPECTED_MATCH`, `MISMATCH` |
| `FUNCTION_SECURITY_CLASSIFICATION` | `UNAVAILABLE`, `EXPECTED_MATCH`, `MISSING`, `UNSAFE_DEFINER_OR_SEARCH_PATH`, `UNEXPECTED_EXECUTE_GRANT` |
| `TRIGGER_DEPENDENCY_CLASSIFICATION` | `UNAVAILABLE`, `EXPECTED_MATCH`, `MISSING`, `UNEXPECTED` |
| `OUT_OF_BAND_DRIFT_CLASSIFICATION` | `UNAVAILABLE`, `MULTIPLE`, `MIGRATION_HISTORY`, `SCHEMA`, `POLICY`, `GRANT`, `FUNCTION_OR_TRIGGER`, `NONE` |
| `FORWARD_PRECONDITION_CLASSIFICATION` | `UNAVAILABLE`, `PASS`, `FAIL` |
| `ROLLBACK_PRECONDITION_CLASSIFICATION` | `UNAVAILABLE`, `PASS`, `FAIL` |
| `TYPE_GENERATION_ELIGIBILITY_CLASSIFICATION` | `BLOCKED`, `UNAVAILABLE` |

## Planning-authority compatibility disposition

The Phase 27NA planning artifacts describe a broader possible future evidence surface, including per-identity migration-class counts and `CONNECTION_STRINGS_PRINTED=false`. The later Gemini-approved Phase 27NG-27NL implementation authority narrows that design to the exact enumerated 56-key schema and 17 exact negative assertions above, and requires the wrapper to reject every extra key. This implementation therefore does not add unapproved output keys. The authorized migration aggregate keys preserve the fail-closed semantics by emitting `UNAVAILABLE` until exact content identity exists. Connection-string safety is covered without accepting or printing a connection string: descriptor-only service material is never persisted, and `DATABASE_URL_PRINTED`, `HOSTNAMES_PRINTED`, `PROJECT_REFERENCE_PRINTED`, `CREDENTIALS_PRINTED`, `SECRETS_PRINTED`, and `RAW_ERROR_TEXT_PRINTED` are all fixed `false`.

The thirteen Phase 27NA failure classifications govern later action gates; they do not widen this candidate's output schema. The narrower successor authority requires only a bounded broad failure class for the wrapper boundary. Their disposition is still fail closed: identity drift maps to `BASELINE`/`MANIFEST`; environment or unauthorized-operation failures map to `AUTH`/`CONNECTION`; unavailable evidence and rollback-verification inability map to `CONNECTION`/`OUTPUT`/`IO`; secret-safe output violations map to `OUTPUT`; and history, dependency, grant, ownership, RLS, and policy conditions remain categorical 56-key evidence that force overall/precondition `UNAVAILABLE` or `FAIL`. No broad class authorizes a future action, and no raw database or SQLSTATE detail is emitted.

## Wrapper and manifest boundary

The wrapper is candidate-only, marked `# AIFINDER_AUTORUN_SCRIPT_V1`, and hard-stops by default. An environment variable alone cannot enable an execution path. A future one-use authorization record and service/connection material must each arrive through already-open file descriptors, never positional arguments or environment values. Service/connection material remains in bounded descriptor memory and is inherited only through `/dev/fd`; it is never materialized or persisted. Descriptor contents must not be printed, copied to a clipboard, or placed in process listings. The future authorization binds the exact clean baseline; SQL, wrapper, and manifest paths/hashes; environment classification; output-contract identity; issuance, expiry, nonce, and unused-to-used single-use state; read-only scope; and explicit prohibitions on migration execution, SQL mutation, and type generation.

Future consumption must be atomic and locked, use an owner-verified `0600` authorization record, fail closed on every ambiguity, impose byte/line bounds before parsing, reject missing/duplicate/unexpected/reordered/malformed/extra keys, reject unapproved identifier-shaped and secret-like values, suppress raw `psql` stderr/stdout and SQLSTATE detail, and permit no retry. Authorization expiry is rechecked immediately before the sole `psql` launch. Only normalized allowlisted output plus `BOUNDED_EVIDENCE_SHA256` may be saved outside the repository, with mode `0600`; cleanup completes before any signal-handler restoration on every exit path.

The deterministic JSON manifest binds version, phase, baseline parent/subject, the exact four-file authorized scope, final SQL and wrapper identities, ordered key contract, formats and categorical lists, negatives, repository-digest relation/policy identities, the full 24-file active migration inventory, the 22 expected and two quarantined eligibility classes, the six Phase 27NA planning-authority identities, grant classes, audit-table/sequence identities, dependency and ownership categories, generated-type identity/modes, guard ordering/identities, controlling-input identities, and exactly four false authorization flags. A future authorization record must bind the reviewed manifest hash, avoiding a circular claim.

## Authorized static-validation matrix

Only the following non-executing validations are authorized for this batch. This document records the allowed matrix, not any unperformed or live result.

| Check | Permitted evidence/result form |
| --- | --- |
| Wrapper syntax | Root-authorized `bash -n` only; passed without importing, sourcing, or invoking the candidate |
| Manifest | JSON parse and deterministic reserialization comparison |
| SQL | lexical inspection for required activation/read-only/rollback tokens and forbidden mutation/raw-output paths |
| Contract | exact ordered 56-key comparison; format and categorical-allowlist validation |
| Identities | path, SHA-256, byte count, Git/filesystem mode, and manifest-consistency checks |
| Repository text | static `rg` scans for required and forbidden tokens |
| Patch hygiene | `git diff --check` only |

Fresh root-authorized static state: the manifest parses as JSON; deterministic field/count and exact ordered-key checks pass; lexical SQL structure and identity/mode checks pass; and root-authorized `bash -n` passes for the final hard-inert wrapper. The wrapper was not imported, sourced, or invoked. No candidate, SQL, database client, package, test, build, or live action ran. The only network activity was the explicitly required read-only remote-`main` identity check.

## Prohibited-operation ledger and future authorization

`LIVE_PREFLIGHT_EXECUTION=BLOCKED_PENDING_SEPARATE_AUTHORIZATION`

`MIGRATION_EXECUTION=BLOCKED`

`TYPE_GENERATION=BLOCKED`

Prohibited here: wrapper or SQL invocation; sourcing/importing either candidate; database, catalog, environment, credential, URL, project-reference, or network inspection; `psql`; Supabase CLI; migrations; type generation; application code, routes, servers, harnesses, tests, builds, package scripts; policy/grant/sequence/function/trigger/row mutation; staging, commit, push, deployment, publishing, or operational reactivation.

A future live-preflight requires separate explicit authorization that supplies a reviewed one-use record through an already-open descriptor; verifies the exact baseline and all reviewed artifact/manifest identities; classifies the target environment without disclosing secret material; confirms read-only scope and strict expiry/single-use controls; names the bounded external output destination; and separately authorizes any later migration, guard-removal, policy/grant change, type generation, deployment, or launch. No positive static classification is execution authority.

Failure or rollback behavior is fail closed: missing or mismatched authorization, baseline, descriptor mode/ownership, manifest, contract, output bound, secret pattern, raw stderr, or cleanup condition produces only a bounded failure class, saves no raw database output, retries nothing, and removes temporary material. Since this phase executes nothing and changes no existing file, its rollback is to discard the four untracked review artifacts only under a separately authorized cleanup action; it cannot roll back a database, migration, policy, grant, or generated type.

## Final classification and next gate

`PHASE_27NG_27NL_SECRET_SAFE_LIVE_PREFLIGHT_STATIC_REPAIR_IMPLEMENTED_STATIC_REVIEW_ONLY`

`PROPOSE_PHASE_27NG_27NL_SECRET_SAFE_LIVE_PREFLIGHT_STATIC_REPAIR_GEMINI_FINAL_REVIEW`

The final Gemini package must bind the completed document identity externally, include all four files verbatim and all permitted static evidence, and obtain exactly: `APPROVE_PHASE_27NG_27NL_SECRET_SAFE_LIVE_PREFLIGHT_STATIC_REPAIR_AND_AUTHORIZE_EXACT_SCOPE_COMMIT_PUSH`. That proposed commit authorization does not authorize live preflight, migration execution, or type generation.

---

## Phase 27PY-27QC controlling predecessor-repair addendum

This addendum is the controlling disposition for the final three-file predecessor repair. Where the historical Phase 27NG-27NL text describes an earlier identity, defect, readiness label, or next gate, this addendum supersedes that statement while retaining it as audit history.

### Authorization, baseline, tokens, and exact scope

- Fresh Gemini authorization consumed exactly once for this repair:
  `APPROVE_PHASE_27PU_27PX_CORRECTED_CHECKER_INPUT_VALIDATION_RECOVERY_AND_AUTHORIZE_ONE_FRESH_EXACT_SCOPE_REPAIR_ATTEMPT`
- Repository baseline, local `main`, local `origin/main`, and read-only remote `main`:
  `7b740e3b83e3efde6de358b316d391b643889fad`
- Branch: `main`; initial ahead/behind: `0/0`; initial tracked modifications: `0`; initial index: empty; frozen untracked count: `11`.
- Permanently consumed and non-reusable predecessor token:
  `APPROVE_PHASE_27OM_27OS_COMMITTED_PREFLIGHT_PREDECESSOR_TARGETED_REPAIR_SCOPE`
- Permanently consumed and non-reusable predecessor token:
  `APPROVE_PHASE_27PL_27PN_MIGRATION_HISTORY_UNAVAILABLE_PREDICATE_RECOVERY_AND_AUTHORIZE_ONE_FRESH_EXACT_SCOPE_REPAIR_ATTEMPT`
- Separately approved redesign token remains unconsumed and out of scope:
  `APPROVE_PHASE_27OT_27PE_AUTHENTICATED_ISSUER_AND_REPLAY_AUTHORITY_REDESIGN_SCOPE`

The exact repository repair scope is only:

1. `scripts/_drafts/discovery-phase-27ng-27nl-secret-safe-live-preflight-candidate.sql`
2. `scripts/_drafts/discovery-phase-27ng-27nl-static-identity-manifest.json`
3. `docs/discovery-phase-27ng-27nl-secret-safe-live-preflight-static-repair-gate.md`

No fourth repository path is part of this repair.

### Historical failures and corrected checker

The first historical diagnosis was `INSPECTION_PREDICATE_FALSE_NEGATIVE`: a formatting-sensitive predicate rejected approved semantics. The subsequent checker failure was independently diagnosed as `CHECKER_REGION_EXTRACTION_DEFECT` at exact stage `SEMANTIC_ASSERTIONS.REGION_CLASSIFICATIONS.END_BOUNDARY`.

The defective checker assumed the next CTE must have the exact shape `output_rows AS (`. The valid SQL uses an explicit column list: `output_rows(sort_order, evidence_key, evidence_value) AS (`. The old extractor raised `ValueError("missing next CTE")`, and its generic top-level handler suppressed that stage before any named semantic assertion ran.

The immutable corrected checker is:

- path: `/private/tmp/aifinder-phase-27pu-27px-diagnostic.vMuYQX/corrected_semantic_checker.py`;
- SHA-256: `c0e6b840ca04cff528e6d41f025e6adb1241e1e7530f4cb8b818cd22f275712f`;
- bytes: `22957`;
- filesystem mode: `0600`;
- prequalification: `10/10` expectations matched, with four required passes and six required failures;
- result: `CORRECTED_CHECKER_PREQUALIFIED_FOR_FRESH_REPAIR_REVIEW`.

The corrected checker accepts CTE declarations with or without explicit column lists, locates CTE bodies by quote-aware balanced-parenthesis scanning, preserves role-specific modes, rejects duplicate JSON keys, compares generated deterministic serializations without requiring source-byte canonical form, retains every approved structural and semantic assertion, and emits stable stage IDs without raw source, exception, path, credential, or environment output.

### Original defects and exact repaired identities

The original SQL began its read-only transaction before validating the activation literals, contained two explicit `ROLLBACK;` occurrences, and used unqualified privilege and timestamp functions without a fixed trusted resolution boundary. The original manifest contained the exact approved policy objects but not their required lexical `repository_identity` order.

The repaired SQL rejects missing or invalid public activation literals before `BEGIN`; that comparison is only a precondition and does **not** establish trusted caller provenance or an authenticated issuer. It then opens one read-only transaction, applies exactly one transaction-local `SET LOCAL search_path = pg_catalog;`, uses qualified `pg_catalog` privilege and timestamp functions, emits only the bounded output projection, and ends with one terminal `ROLLBACK;`.

Final repaired SQL identity:

- SHA-256: `9d5d08ce4b279cf7d8143227603e6e8875f811459221fdfd7c63322cb17b4820`;
- bytes: `30940`;
- filesystem mode: `0644`;
- Git mode: `100644`;
- Git blob: `ea2aeae24027de6520e5aed59c29097561f9f8d3`.

Final repaired manifest identity:

- SHA-256: `e36bc2e44361db5a660e73075888b1c328d1476cea5f06a0f5aceb8c42ec5f43`;
- bytes: `38907`;
- filesystem mode: `0644`;
- Git mode: `100644`;
- Git blob: `2932ba9708bac4fec3353f1c480e27edcdede955`.

This gate deliberately does not self-embed its own SHA-256 or byte count. Its completed identity is computed only after the final bytes are frozen and is bound externally by the Phase 27QC Gemini final-review package.

### Repaired control flow and bounded-output semantics

The repaired SQL has one activation comparison before `BEGIN`, one `BEGIN TRANSACTION READ ONLY;`, one `SET LOCAL statement_timeout = '5s';`, one `SET LOCAL lock_timeout = '2s';`, one `SET LOCAL idle_in_transaction_session_timeout = '10s';`, one `SET LOCAL search_path = pg_catalog;`, and one terminal `ROLLBACK;` after the fixed output projection. Invalid activation does not reach an explicit transaction.

All `has_table_privilege`, `has_sequence_privilege`, `to_char`, and `clock_timestamp` calls are schema-qualified through `pg_catalog`. Executable mutation, DDL, temporary-table creation, extension operations, dynamic SQL, application-row reads, migration-history reads, and raw-output expansion remain absent.

The output contract remains exactly 56 ordered keys, 15 categorical allowlists, and 17 mandatory fixed-`false` assertions. The six migration metric aliases are literal text `UNAVAILABLE`; keys 5-10 reference those aliases exactly; keys 11-12 are literal `UNAVAILABLE`; and key 13 references the fail-closed migration-history classification. Unavailability is the first branch propagated to out-of-band drift, forward-precondition, and rollback-precondition classifications. No `supabase_migrations` or `schema_migrations` relation is read, no filename/version-only evidence is treated as applied-content identity, and unavailable history cannot become `EXACT_MATCH`, `PASS`, or `NONE`.

The manifest strictly rejects duplicate keys, binds the repaired SQL identity, preserves the exact 56-key sequence, 15 allowlists, 17 negatives, and the exact fifteen policy identity/digest/semantic-class objects as an unordered set, while placing those policies in exact lexical `repository_identity` order. Protected migrations, relations, grants, guards, generated-type target, controlling inputs, and false authorization flags remain unchanged. The manifest contains no self-referential manifest hash.

### Transaction failure limitation

The terminal source `ROLLBACK;` is guaranteed only when execution reaches that statement. An abrupt client, network, or process failure after `BEGIN` relies on client disconnect closing the read-only transaction; it does not guarantee execution of the terminal source rollback. This static repair makes no stronger runtime claim.

### Preservation ledger

- Hard-inert wrapper preserved unchanged: SHA-256 `f7f989e92df1bb3f36a75dabbb62f71b55cf2fc55f59be534903aa0a713376fc`, Git mode `100644`, filesystem mode `0644`; it was not sourced or invoked.
- Frozen ledger preserved: SHA-256 `7c0993404e8d3f509988db097a61aa6eeadbfb1495d25cfeaa5a67ba97e19b84`, 5804 bytes, mode `0400`; all eleven regular non-symlink mode-`0644` files remain exact with aggregate `153376` bytes.
- Forward active/draft migration pair preserved at SHA-256 `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9`.
- Rollback active/draft migration pair preserved at SHA-256 `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f`.
- Each of the four migration guards remains present exactly once before its explicit transaction; no migration was executed or placed.
- Generated type preserved unchanged: `lib/supabase/database.types.ts`, SHA-256 `7173e35d74fa7f59ff3469c2d7e1c95984cfcf37c00b934b1b48ec0f39f1d72c`, Git mode `100644`, filesystem mode `0600`.
- Previously bound metadata-query candidates remain byte-for-byte unchanged.

### Phase 27PY-27QC static-verification and prohibited-operation ledger

Authorized static evidence consists only of exact identity/mode/type/owner checks, immutable checker execution over its approved static role bindings, duplicate-key manifest parsing inside that checker, non-executing lexical/semantic inspection, Git status/diff/history inspection, and final-review packaging. It is not live-readiness or execution authority.

- Repository tracked paths changed: exactly the three approved paths.
- Added, deleted, or renamed repository paths: none.
- Index: empty; staging, commit, and push: not performed.
- SQL or wrapper execution: not performed.
- Database, Supabase, catalog, environment, credential, URL, service-material, or secret access: not performed.
- Application, route, server, test, build, package script, bounded-evidence validator, synthetic runner, or repository harness execution: not performed.
- Migration action, type generation, key creation, infrastructure creation, deployment, publishing, operational reactivation, and public launch: not performed.
- Only the initial and final read-only remote-`main` identity checks are permitted network activity.

### Controlling blocked-state ledger

`LIVE_PREFLIGHT_EXECUTION=BLOCKED`

`AUTHORIZATION_TRUST_REDESIGN=REQUIRED`

`MIGRATION_EXECUTION=BLOCKED`

`TYPE_GENERATION=BLOCKED`

`DEPLOYMENT=BLOCKED`

`PUBLISHING=BLOCKED`

`OPERATIONAL_REACTIVATION=BLOCKED`

`PUBLIC_LAUNCH=BLOCKED`

No static success, public literal comparison, or future commit/push authorization can relax these blocked states. The next permitted gate is Gemini review of the complete Phase 27QC package. Only an exact later approval may authorize staging, committing, and pushing these same three paths; it cannot authorize execution or operations.
