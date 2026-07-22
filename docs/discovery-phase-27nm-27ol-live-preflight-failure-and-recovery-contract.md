# Phase 27NM–27OL Live-Preflight Failure and Recovery Contract — Post-Integration Governance Closure

## Status

This is a static future-runtime contract. The repository models signed assertions, signed consume receipts, a transport-free replay client, an untrusted protected-launch request client, and fabricated replay, protected-pending, and journal behavior. It installs or operates no protected component and authorizes no live execution.

The static Option A integration completed at commit `31a684294fa9f5d0c375a3457f601e78faf07833`, parent `f7e7bd743a999f691bd30c593617aa191522fec6`, tree `0ffdfbd3d2541d5ae82f5e4a80283ddbb7f24ff7`, subject `Implement authenticated authorization trust redesign candidates`. The Phase 27RO–27RZ integration authority is `SPENT_NON_REUSABLE`.

The Phase 28AI–28AN token `APPROVE_PHASE_28AI_28AN_EXACT_6_PATH_POST_INTEGRATION_GOVERNANCE_CLOSURE_IMPLEMENT_REVIEW_NO_STAGE_NO_COMMIT_NO_PUSH` is spent for implementation and review only. The Phase 28AR–28AZ token `APPROVE_PHASE_28AR_28AZ_EXACT_6_PATH_GOVERNANCE_FINAL_REVIEW_FIX_COMMIT_PUSH_AND_BOUNDED_VERCEL_GIT_SIDE_EFFECT_VERIFICATION` is consumed exactly once for exact six-path final review, correction, verification, staging, commit, push, GitHub verification, and bounded Vercel Git-side-effect verification. Its parent/pre-commit baseline is `31a684294fa9f5d0c375a3457f601e78faf07833`, resulting commit is `EXTERNALLY_BOUND_BY_GIT_AND_FINAL_CCR`, and subject is `Reconcile authorization trust governance after integration`.

The bounded Vercel correlation classifies the baseline-bound deployment as environment `PRODUCTION`, state `READY`, trigger `AUTOMATIC_GIT_INTEGRATION`, and materiality `MATERIAL_PRODUCTION_SIDE_EFFECT`. Access/protection and production branch remain `UNRESOLVED`; only bounded digests and categories are retained.

This post-integration governance closure changes documentation and manifest state only. It does not alter any verifier, client, schema, fixture, runner, protected-state model, runtime failure category, recovery rule, or operational boundary below. Live readiness remains blocked.

## Local verifier and service-time authority

The local verifier performs exact canonical parsing, signature-adapter calls, structural epoch validation, and the 1-through-300-second lifetime bound. It accepts no caller-supplied current time.

The external replay authority owns registered issue/expiry metadata and protected service time. A consume outside that window creates durable terminal status `EXPIRED`, mapped to `AUTH_EXPIRED`. Under v1, this includes both already-expired and not-yet-valid assertions. The same request and same-request status recovery return `EXPIRED`; a different request ID returns `AUTH_REPLAY_FAILED`. No receipt is created and later time cannot reopen the assertion.

## Protected process and descriptor model

Numeric descriptor labels are accepted only when a future protected parent preopens the exact objects and spawns the thin client with those descriptors inherited. Numeric labels from an unrelated process are never capabilities. Cross-process handle transfer is not implemented here.

Both `CONSUME_AND_CLAIM` and `RECOVER_AND_CLAIM` require inherited descriptors for the assertion, SQL, activation manifest, validator, reviewed `psql`, and output directory. A caller never supplies a receipt descriptor or receipt digest.

The thin client validates canonical decimal spelling and pairwise uniqueness only as an untrusted well-formedness check. The protected launcher independently validates required fields, bounds, pairwise-distinct roles, object type, owner, mode, link count, access mode, and content identity. It must execute the exact opened and measured `psql` object; caller paths, `PATH`, reopen-by-path, and ordinary-user configuration are non-authoritative.

## Protected pending-request states

A future protected launcher must durably bind request ID, assertion digest, nonce digest, and binding digest before the first replay exchange.

| State | Meaning | Recovery allowed |
|---|---|---|
| `PENDING` | Consume started but no bounded transport result recorded | No |
| `AMBIGUOUS` | Protected transport returned a bounded ambiguous result | Same request only |
| `DEFINITIVE` | `CONSUMED`, `EXPIRED`, rejection, or another definitive result recorded | No |

The untrusted operation field cannot create or alter these states. `RECOVER_AND_CLAIM` is accepted only when the protected record is already `AMBIGUOUS` and every binding matches. A crash while merely `PENDING`, after a definitive result, or after journal claim requires a fresh assertion. This may strand a consumed authorization after an unrecorded crash, but it cannot create a second launch.

## Required future order

1. Protected parent opens, validates, measures, and inherits every exact descriptor and the activation-client image.
2. Protected launcher verifies the canonical request, baseline, branch policy, tracked cleanliness, artifact identities, output identity, and protected profile identity.
3. It parses the assertion and verifies Ed25519 through assertion-role protected trust.
4. It verifies structural lifetime, environment, single read-only scope, exactly-one requirement, and all six false operational flags.
5. For a first consume, it creates the protected `PENDING` record and sends the exact digests and request ID through protected replay transport.
6. A definitive `EXPIRED` or rejection closes the record and cannot launch.
7. A bounded transport ambiguity atomically changes `PENDING` to `AMBIGUOUS`; no launch occurs.
8. Recovery from `AMBIGUOUS` queries only the same request ID. The caller supplies no receipt.
9. A returned `CONSUMED` receipt is verified through the replay-receipt trust role and closes the record as `DEFINITIVE`.
10. The launcher atomically claims `SHA256(exact canonical receipt bytes)` in its protected journal.
11. It resolves the connection profile only through protected digest mapping.
12. Only that protected process may use the exact opened and measured `psql` descriptor for one future read-only invocation; stdout flows only through a private pipe to the exact opened and measured validator descriptor.
13. The launcher accepts only an empty bounded validator stderr, exact success category, exact normalized 56-line contract, one terminal digest line, and an independently recomputed SHA-256 match. Raw `psql` output and raw errors are never publication inputs.
14. `DESCRIPTOR_RELATIVE_ATOMIC_EVIDENCE_PUBLICATION` uses only the already-opened output-directory descriptor: exclusive no-follow temporary creation, exact mode `0600`, complete write, file fsync, no-replace publication, published-object verification, temporary cleanup, and directory fsync.
15. `FILE_AND_DIRECTORY_FSYNC_BEFORE_SUCCESS` is mandatory, and success is reported only after child reaping and fallible descriptor cleanup. `OUTPUT_FAILURE_AFTER_JOURNAL_CLAIM_REQUIRES_FRESH_ASSERTION`; no automatic retry or offline fallback exists.

## Failure matrix

| Failure point | Required category or state | Recovery |
|---|---|---|
| Noncanonical assertion/request or wrong schema | `AUTH_SCHEMA_FAILED` | correct static input; no consume |
| Phase contains control or DEL | `AUTH_SCHEMA_FAILED` | new valid assertion |
| Invalid, unknown, revoked, or cross-role key | `AUTH_SIGNATURE_FAILED` | new valid assertion |
| Outside registered service-time window | durable `EXPIRED`; `AUTH_EXPIRED` | new assertion only |
| Binding, baseline, artifact, output, descriptor, or profile mismatch | `BINDING_FAILED` | correct protected measurement; new assertion if already consumed |
| Noncanonical, duplicate, missing, or unsafe descriptor role | `PROTECTED_LAUNCH_FAILED` | no consume or launch |
| Replay authority unavailable | `AUTHORITY_UNAVAILABLE` | no launch; later attempt only under new authority |
| Protected transport ambiguity | `AUTHORITY_AMBIGUOUS`; protected state `AMBIGUOUS` | same request ID recovery only |
| Recovery request without matching protected `AMBIGUOUS` state, or with mismatched request/assertion/nonce/binding identity | `PROTECTED_LAUNCH_FAILED` | fresh assertion |
| Different request ID for terminal nonce | `AUTH_REPLAY_FAILED` | fresh assertion and nonce |
| Copied receipt or second journal claim | `AUTH_REPLAY_FAILED` | fresh assertion |
| Crash while `PENDING` or after definitive consume | terminal authority retained; `PROTECTED_LAUNCH_FAILED` | fresh assertion; no recovery |
| Crash after evidence publication or before durable completion | `OUTPUT_FAILED`; publication state must be revalidated from the protected directory descriptor | treat output untrusted; fresh assertion; never overwrite or resume |
| Protected profile, trust, pending state, journal, or launcher unavailable | `PROTECTED_LAUNCH_FAILED` | no launch |

## Secret and output safety

No assertion, receipt, request, log, repository file, or review package may contain credentials, connection strings, hostnames, project identifiers, service-profile names or paths, private keys, MAC secrets, certificates, service material, raw SQL errors, or raw remote response text. Only bounded categories and content identities may be emitted.

## Static-only rollback

The historical eleven-file repair rollback applied only before commit `31a684294fa9f5d0c375a3457f601e78faf07833`; it is now `HISTORICAL_NON_EXECUTABLE` and must never overwrite or reverse committed integration state.

The Phase 28AI–28AN six-file backups remain historical recovery evidence. Phase 28AR–28AZ used its own exact six-file pre-edit backups before review and correction. No broad Git reset, `git clean`, checkout-based rollback, infrastructure action, or operational retry is authorized. After the authorized commit and push, rollback is not automatic: any subsequent repository modification requires new Gemini review and separately named exact authorization.

The stable post-commit repository state is zero tracked modifications, empty index, exactly three unchanged excluded untracked files, and ahead/behind `0/0`. Final file identities are bound without circular self-reference by the final Git tree and final CCR. The only authorized Vercel write-side effect is the automatic Git-integration deployment caused by the exact push; direct deployment, promotion, rollback, cancellation, or settings mutation remains prohibited.

## Live readiness

Live authorization, replay consumption, protected pending-state operation, protected launch, service-material handling, descriptor-bound `psql`, SQL, database access, migration execution, type generation, deployment, publishing, operational reactivation, and public launch remain false and blocked.
