# AiFinder Phase 27MR–27MV Database/RLS/Migration Static Reconciliation Inspection Gate

## Determination

`PHASE_27MR_27MV_DATABASE_RLS_MIGRATION_STATIC_RECONCILIATION_INSPECTION_IMPLEMENTED_READY_FOR_GEMINI_FINAL_REVIEW`

## Authorization

`APPROVE_PHASE_27MR_27MV_DATABASE_RLS_MIGRATION_STATIC_RECONCILIATION_INSPECTION_AND_AUTHORIZE_ONE_REPOSITORY_ONLY_RUN`

This authorization permits exactly one repository-only static inspection and creation of this one documentation artifact plus two private `/tmp` evidence files. It does not authorize SQL execution, database or Supabase access, environment inspection, guard removal, migration activation, or operational activity.

## Repository baseline

- Repository: `/Users/jamescarlodumaua/aifinder`
- Origin: `https://github.com/jcdumaua/aifinder.git`
- Branch: `main`
- HEAD/local main/local origin-main: `1882128889cd904dc0d53fe950787dc6e4353d07`
- Parent: `6d964f3d10ba113858235c6033c4f164d674e106`
- Subject: `Document database RLS migration reconciliation plan`
- Ahead/behind: `0/0`
- Index before inspection: empty
- Tracked tree before inspection: clean
- Untracked files before inspection: `0`
- Inspection timestamp: `2026-07-20T18:28:02Z`

## Bound planning and candidate identities

| Input | SHA-256 | Mode |
|---|---|---|
| `docs/discovery-phase-27mn-27mq-database-rls-migration-static-reconciliation-planning-gate.md` | `a9d13a7e6115d6d4e1842c7cd8c27dc2e16de6635c908d3ac280749ef5fd34e8` | `100644` |
| `docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md` | `3bd21fd9921650cd07f06f374d5cd34c644d8f134d0a1fcbdfd6b752ab0b7204` | `100644` |
| `docs/discovery-phase-26xw-guard-removal-and-rls-remediation-execution-readiness-planning-gate.md` | `753b2fc1c6c9b238201a11ee067abb4c0ef831282951fe6b087c219d876f80a8` | `100644` |
| `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql` | `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9` | `100644` |
| `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql` | `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f` | `100644` |

## Tracked SQL inventory summary

- Tracked SQL files: `30`
- Active migration SQL files: `24`
- `_drafts` SQL files: `2`
- Other tracked SQL files: `4`
- Duplicate active migration timestamp groups: `0`
- Active migrations without a 14-digit timestamp prefix: `2`
- Active `GRANT` statements: `13`
- Active `REVOKE` statements: `38`
- Active `CREATE POLICY` statements: `16`
- Active `DROP POLICY` statements: `16`
- Active RLS-enable statements: `13`
- Active RLS-force statements: `0`
- Function definitions: `18`
- Trigger definitions: `14`
- Sequence-reference observations: `2`
- `service_role` reference observations: `8`

Static counts describe repository intent only. They do not establish applied migration history, live schema, current grants, current policies, or enforced RLS.

## Complete tracked SQL identity inventory

| Path | Category | SHA-256 | Mode | Lines | Statements |
|---|---|---|---|---|---|
| `scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql` | other_sql | 32ea49528123a7bbafe6d430fdc637a91da4a6c977ee5cc9e5f912770a907c55 | 0644 | 78 | 10 |
| `scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql` | other_sql | 2b231fe90f7e0cfca150535cb2d90b7ab96514fa50d7efc567cdeecba4738d43 | 0644 | 68 | 7 |
| `scripts/discovery-live-rls-metadata-catalog-query.sql` | other_sql | 759d285ffa9f84eb5f996a80625a94342c77ca69e423b6aefc7bfcdae6d99bde | 0644 | 72 | 7 |
| `scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql` | other_sql | b2b93480012f4dbec65203c556829b61b49500ab85fd5e0c493084b9b57f3589 | 0644 | 126 | 11 |
| `supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql` | active_migration | 59535ac5db55e3d083a4c83094e2aabd089046044320d6391833957ea73b719c | 0644 | 306 | 14 |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | active_migration | c22e3662ebf71202a35f8e439ff231441b4fbfa1021af0a0d46f50e66a858c21 | 0644 | 83 | 9 |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | active_migration | c8c4b394f5d13290d9954bdaf19464a6133c0121f75173256ca849cf469f6fb9 | 0644 | 235 | 44 |
| `supabase/migrations/20260612000200_harden_discovered_tools_access.sql` | active_migration | 72b476fbdce344994984dfdfc07b1fa50ea28ecc6581c6e9ff9bf85c7e7494b9 | 0644 | 37 | 13 |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | active_migration | d2158dc437b949c9221236e87a39eedf4d445ab87260628d2824abd7b307d1f5 | 0644 | 147 | 6 |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | active_migration | 9b7563eff78bba38c64d3454a901530575355f356dffffe820c25480f8f54777 | 0644 | 23 | 2 |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | active_migration | 04ea95601993b373ab3b45bf310df578aa7c59322519c03ca58627b258caf0b3 | 0644 | 189 | 9 |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | active_migration | 51ca6418c43b3944f096b6c33fc07537c09997504b034002a9dc649c5f1967cb | 0644 | 235 | 32 |
| `supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql` | active_migration | 97c54dc39c1d40349bcfd26f313ea6c3702c6b7fac7de0521e17563453e7a9f7 | 0644 | 65 | 8 |
| `supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql` | active_migration | 48c368ae821583456111488f2cd33093d5ce8b94377705e28b09f6bb91c60019 | 0644 | 52 | 7 |
| `supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql` | active_migration | 4479be746e7aeb425b62c308d8f0fda04414d743a02e3ba7b200e50a6ee46cc4 | 0644 | 105 | 5 |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | active_migration | 1d80e6a73afc8cfdd1b28cc8e807c552036d27b1016e7193b56a7159528c4148 | 0644 | 254 | 62 |
| `supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql` | active_migration | 53bf7dfc094c0d1724bcfbf1259f30327066a286fef52b8503c6ffb23e05d563 | 0644 | 183 | 5 |
| `supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql` | active_migration | 507bab9f850e59150d6e16b1a437c8fe050f977d1f778809152169741fc1c2a8 | 0644 | 32 | 1 |
| `supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql` | active_migration | 335e48902bb7634a196cfc07c3e6712cc68225b510b6490df9feb429ee7651e4 | 0644 | 20 | 4 |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | active_migration | b835318afb883d9f387447eae515118997912042a0004b27782217be9dfb78b9 | 0644 | 218 | 23 |
| `supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql` | active_migration | 292a4e91941f4321762152e0d742f3777c9bff81abb38167f3ca910f42b8e5ed | 0644 | 54 | 7 |
| `supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql` | active_migration | 8d63b3f64fa2d7ab85d6a821a9885f3fdcd613d97623842ad0928da50b5e6744 | 0644 | 231 | 27 |
| `supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql` | active_migration | 9a718a2ec24cf425821afece711de9561e53c7cfd236953391671b628c01c538 | 0644 | 104 | 12 |
| `supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql` | active_migration | 1ccdcdfacd38933cbd6edfd80b6591ff757216e5a7204eb0db9940598e307922 | 0644 | 183 | 14 |
| `supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql` | active_migration | 7b3cbb1234aa0e492f366baa5e340bda174b619ede1cfb48616658a0f631651f | 0644 | 279 | 6 |
| `supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql` | active_migration | 47b9ee1bde06c9f54cb4ece2c8b70d827ca0215e634cf2f58554d97b82fd6511 | 0644 | 35 | 6 |
| `supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql` | active_migration | 7ab6d4ee6ca08eee5a4ce5894bf6bdc4fa9dfcbcf1a688e1aa991a3413d8b2d3 | 0644 | 67 | 5 |
| `supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql` | active_migration | bbdaaf439a8203eba7e459f632d0b8a0d0bb60499ee6dade17139dbb247432f2 | 0644 | 33 | 4 |
| `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql` | draft | 0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9 | 0644 | 73 | 6 |
| `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql` | draft | 9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f | 0644 | 39 | 5 |

## Relevant relation-reference map

| Relation | Active migration references | Draft references |
|---|---|---|
| `public.tools` | 98 | 12 |
| `public.submitted_tools` | 31 | 0 |
| `public.discovered_tools` | 46 | 0 |
| `public.discovery_sources` | 19 | 0 |
| `public.discovery_runs` | 14 | 0 |
| `public.discovery_evidence` | 12 | 0 |
| `public.discovery_duplicate_candidates` | 15 | 0 |
| `public.discovery_audit_events` | 19 | 0 |
| `public.discovery_candidate_tools` | 55 | 0 |
| `public.discovery_candidate_preview_artifacts` | 41 | 0 |
| `public.homepage_control_configs` | 24 | 0 |
| `public.homepage_control_audit_events` | 18 | 0 |
| `public.homepage_control_checklist_runs` | 15 | 0 |
| `public.admin_audit_logs` | 2 | 2 |
| `public.admin_audit_archives` | 2 | 2 |

Reference counts include source-level mentions after comment removal. A reference is not proof that a relation exists or that a statement was applied.

## Migration ordering and conflict inspection

- Duplicate timestamp groups: `{}`
- Active migrations lacking timestamp prefixes: `["supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql", "supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql"]`
- Filename-order classification: `UNRESOLVED_REQUIRES_TARGETED_INSPECTION`

This inspection does not read the database migration-history table and does not claim that repository order matches applied order.

## Guarded candidate symmetry

| Check | Result |
|---|---:|
| Forward abort guard count | `1` |
| Rollback abort guard count | `1` |
| Forward legacy-policy drop count | `1` |
| Rollback legacy-policy create count | `1` |
| Forward active grant/revoke count | `0` |
| Rollback active grant/revoke count | `0` |
| Narrow policy symmetry | `true` |

The candidates are symmetric only for the deliberately narrow legacy `public.tools` policy operation. They are not a complete grant-cleanup forward/rollback pair, because grant cleanup is intentionally excluded.

## Historical-versus-current evidence disposition

- Phase 26WC catalog observations: `SUPERSEDED_OR_HISTORICAL_CONTEXT_ONLY`
- Current tracked SQL inventory: `CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING`
- Current live schema, RLS, policy, grant, and migration-history state: `BLOCKED_PENDING_SEPARATE_AUTHORIZATION`

The historical catalog inventory remains useful for defining questions and expected counts. It is not treated as current live truth.

## Required primary classifications

| Output | Primary classification | Reason |
|---|---|---|
| `current_tracked_schema_intent` | `CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING` | Tracked active SQL and relation-reference inventory provide current repository intent only; live schema remains unverified. |
| `current_tracked_rls_policy_intent` | `CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING` | Tracked RLS and policy statements are statically enumerable; live enforcement and policy counts remain unverified. |
| `current_tracked_migration_ordering_and_conflicts` | `UNRESOLVED_REQUIRES_TARGETED_INSPECTION` | Active migration filename timestamps are statically not conflict-free. |
| `forward_candidate_completeness` | `CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING` | The guarded forward candidate has bounded policy scope and no active grant/revoke statements. |
| `rollback_candidate_completeness` | `CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING` | The guarded rollback is symmetric for the narrow legacy policy operation and excludes grant rollback. |
| `audit_grant_cleanup_dependency_status` | `UNRESOLVED_REQUIRES_TARGETED_INSPECTION` | Grant cleanup is intentionally excluded and live grant dependencies have not been inspected. |
| `historical_versus_current_evidence_drift` | `SUPERSEDED_OR_HISTORICAL_CONTEXT_ONLY` | Phase 26WC catalog observations remain historical context; current repository intent is separately inventoried. |
| `live_evidence_requirements` | `BLOCKED_PENDING_SEPARATE_AUTHORIZATION` | Live schema, RLS, policy, grant, and migration-history evidence requires separate environment and database authorization. |
| `later_execution_readiness_package_eligibility` | `UNRESOLVED_REQUIRES_TARGETED_INSPECTION` | Static planning is sufficient, but grant dependencies and live baseline evidence must be resolved first. |

Exactly one primary classification is assigned to each required output. No classification grants execution authority.

## Facts still requiring live database evidence

1. Whether all 15 expected relations currently exist in the selected environment.
2. Whether RLS is enabled or forced on each relation.
3. The exact current policy count and policy semantics for each relation.
4. Whether the legacy `Public can read tools` policy still exists.
5. Whether the approved-only `tools` policy exists exactly once with the expected predicate.
6. Current grants on audit tables, sequences, and relevant functions.
7. Current migration-history identity, ordering, and drift.
8. Whether audit relations and the audit sequence exist with the expected ownership and privileges.
9. Whether any out-of-band schema, policy, grant, trigger, or function changes exist.
10. Whether the target environment is eligible for a later execution-readiness package.

These facts remain unknown. No live connection was made.

## Secret-safe future preflight output contract

A future separately authorized preflight may emit only bounded categories and counts:

- `TARGET_ENVIRONMENT_CLASSIFICATION=<NON_SECRET_CATEGORY>`
- `EXPECTED_RELATION_COUNT=<COUNT_ONLY>`
- `PRESENT_RELATION_COUNT=<COUNT_ONLY>`
- `MISSING_RELATION_COUNT=<COUNT_ONLY>`
- `RLS_ENABLED_COUNT=<COUNT_ONLY>`
- `RLS_FORCED_COUNT=<COUNT_ONLY>`
- `EXPECTED_POLICY_COUNT=<COUNT_ONLY>`
- `MATCHED_POLICY_COUNT=<COUNT_ONLY>`
- `UNEXPECTED_POLICY_COUNT=<COUNT_ONLY>`
- `EXPECTED_GRANT_CLASS_COUNT=<COUNT_ONLY>`
- `MATCHED_GRANT_CLASS_COUNT=<COUNT_ONLY>`
- `MIGRATION_HISTORY_CLASSIFICATION=<MATCH|DRIFT|UNAVAILABLE>`
- `FORWARD_PRECONDITION_CLASSIFICATION=<PASS|FAIL|UNAVAILABLE>`
- `ROLLBACK_PRECONDITION_CLASSIFICATION=<PASS|FAIL|UNAVAILABLE>`
- `ROW_VALUES_PRINTED=false`
- `HOSTNAMES_PRINTED=false`
- `DATABASE_URL_PRINTED=false`
- `CREDENTIALS_PRINTED=false`
- `RAW_CATALOG_ROWS_PRINTED=false`

It must fail closed before any mutation and must not print identifiers discovered only from the live catalog, row data, policy expressions, raw grant rows, URLs, hostnames, or secrets.

## Rollback and failure triggers required before guard removal

1. Any reviewed file hash, mode, path, or baseline identity changes.
2. Either unconditional abort guard is absent or moved behind an active statement.
3. The expected narrow forward policy-drop count is not exactly one.
4. The expected narrow rollback policy-create count is not exactly one.
5. Any active grant or revoke statement appears in either candidate.
6. Expected relation, RLS, policy, or migration-history counts do not match.
7. An unexpected policy or grant class is observed.
8. Audit grant-cleanup dependencies remain unresolved.
9. The target environment cannot be classified without exposing a secret.
10. Any preflight would print row values, raw catalog rows, hostnames, URLs, or credentials.

Any trigger stops the workflow before guard removal, draft activation, SQL execution, or migration application.

## Eligibility decision

`LATER_EXECUTION_READINESS_PACKAGE=UNRESOLVED_REQUIRES_TARGETED_INSPECTION`

The repository-only static inspection is sufficient to plan a future live preflight. It is not sufficient to authorize that preflight or any execution package. Audit grant dependencies and live baseline evidence remain unresolved.

## Evidence files

- JSON inventory: `/tmp/aifinder-phase-27mr-27mv-sql-static-inventory-20260720T182802Z.json`
- Text inventory: `/tmp/aifinder-phase-27mr-27mv-sql-static-inventory-20260720T182802Z.txt`

The evidence files contain repository paths, hashes, modes, counts, and categorical classifications only. They contain no environment values, database output, credentials, hostnames, or row data.

## Safety boundary

- `REPOSITORY_SOURCE_EXECUTED=false`
- `TEST_EXECUTION=false`
- `HARNESS_EXECUTION=false`
- `DATABASE=false`
- `SUPABASE=false`
- `ENVIRONMENT_INSPECTION=false`
- `SQL_EXECUTION=false`
- `MIGRATION_EXECUTION=false`
- `GUARD_REMOVAL=false`
- `DRAFT_ACTIVATION=false`
- `POLICY_OR_GRANT_MUTATION=false`
- `TYPE_GENERATION=false`
- `DEPLOYMENT=false`
- `PUBLISHING=false`
- `OPERATIONAL_REACTIVATION=false`
- `STAGING=false`
- `COMMIT=false`
- `PUSH=false`

## System-layer progress ledger

### Active

- Governance / phase control
- Static verification
- Documentation continuity
- Static evidence / manifest readiness
- Database/RLS/migration static reconciliation

### Supporting or indirect

- Security hardening
- Service-role isolation
- Admin route safety
- Secret-safe logging
- Runtime validation harness discipline

### Blocked

- Live database/schema validation
- Live RLS and policy validation
- Grant and ownership validation
- Migration-history validation
- Credential and environment inspection
- Guard removal and draft activation
- SQL and migration execution
- Type generation
- Deployment
- Publishing
- Operational reactivation
- Public launch

## Next gate

`PROPOSE_PHASE_27MR_27MV_DATABASE_RLS_MIGRATION_STATIC_RECONCILIATION_INSPECTION_FINAL_REVIEW`

A positive final review may authorize exact-scope commit and push of this one inspection document only. It may not authorize a live preflight, database access, guard removal, draft activation, SQL execution, or migration application.
