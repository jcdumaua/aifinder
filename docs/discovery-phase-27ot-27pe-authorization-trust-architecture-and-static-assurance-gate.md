# Phase 27OT–27PE Option A Authorization-Trust Architecture and Static-Assurance Gate — Post-Integration Governance Closure

## Status and authority

This document describes a repository-local, non-secret, fabricated-only static model. It does not establish production trust, install a protected launcher, select or contact an endpoint, create a key, resolve a connection profile, consume authoritative replay state, invoke `psql`, execute SQL, access a database or Supabase, move a migration, generate types, deploy, publish, reactivate operations, or launch publicly.

The exact parent and pre-commit baseline for this governance finalization is `31a684294fa9f5d0c375a3457f601e78faf07833`. Its parent is `f7e7bd743a999f691bd30c593617aa191522fec6`, its tree is `0ffdfbd3d2541d5ae82f5e4a80283ddbb7f24ff7`, and its subject is `Implement authenticated authorization trust redesign candidates`.

Gemini returned the earlier exact repair authority:

`APPROVE_PHASE_27RG_27RN_OPTION_A_STATIC_IMPLEMENTATION_EXACT_11_PATH_REPAIR_SCOPE`

That token is consumed only for the exact eleven-path static repair, the 43-case fabricated corpus, the bounded descriptor harness, static checks, governance rebinding, rollback, and an external final-review package. It does not authorize staging, commit, push, live keys or trust, infrastructure, endpoints, network calls, service material, SQL, database access, migrations, type generation, application execution, deployment, publishing, operational reactivation, or public launch.

The earlier Phase 27QM–27RF implementation token remains `CONSUMED_FOR_EXACT_12_PATH_STATIC_IMPLEMENTATION`. The superseded Phase 27OT–27PE token remains `SUPERSEDED_UNCONSUMED_NON_EXECUTABLE`.

Gemini subsequently returned `APPROVE_PHASE_27RO_27RZ_OPTION_A_STATIC_REPAIR_FULL_LOAD_REVIEW_FIX_EXACT_16_PATH_COMMIT_PUSH_AND_REMOTE_VERIFICATION`. That authority is `SPENT_NON_REUSABLE`: it was consumed exactly once for independent review, in-scope test-first correction, static validation, exact sixteen-path integration, push, and remote verification. The exact sixteen-path static integration completed at the bound commit, and local `main`, local `origin/main`, and GitHub `main` were verified at that same identity with ahead/behind `0/0`. The spent authority may not be reused and does not authorize any operational layer listed above.

Phase 28AI–28AN used `APPROVE_PHASE_28AI_28AN_EXACT_6_PATH_POST_INTEGRATION_GOVERNANCE_CLOSURE_IMPLEMENT_REVIEW_NO_STAGE_NO_COMMIT_NO_PUSH` exactly once for the six-path implementation and review only. That authority is `SPENT_FOR_EXACT_6_PATH_IMPLEMENTATION_AND_REVIEW_ONLY_NO_STAGE_COMMIT_PUSH`; it cannot authorize the integration or any operational action.

Gemini then returned `APPROVE_PHASE_28AR_28AZ_EXACT_6_PATH_GOVERNANCE_FINAL_REVIEW_FIX_COMMIT_PUSH_AND_BOUNDED_VERCEL_GIT_SIDE_EFFECT_VERIFICATION`. It is consumed exactly once for the exact six-path final review, in-scope correction, static verification, staging, one commit with subject `Reconcile authorization trust governance after integration`, one push to `origin/main`, GitHub verification, and bounded read-only Vercel Git-side-effect verification. The resulting commit is `EXTERNALLY_BOUND_BY_GIT_AND_FINAL_CCR`, with parent `31a684294fa9f5d0c375a3457f601e78faf07833`. This authority does not authorize any direct Vercel write or operational layer.

Primary classification: `OPTION_A_STATIC_INTEGRATION_COMPLETE_LIVE_READINESS_BLOCKED`.

The bounded read-only GitHub/Vercel pre-push correlation resolves exactly one target, team, project, and baseline-bound deployment. The GitHub target SHA-256 is `d4fab4b57864a81d8c3a385403afc7b8929ddc26729507cee4fc7175c28c9e1b`; the deployment is `PRODUCTION`, state `READY`, trigger `AUTOMATIC_GIT_INTEGRATION`, and materiality `MATERIAL_PRODUCTION_SIDE_EFFECT`. Access/protection and production-branch metadata remain `UNRESOLVED`; no claim of public, private, or authentication-required access is made. Bounded connector responses transiently exposed aliases, URLs, actor/account/team/project/deployment identifiers, and related deployment metadata solely for identity correlation. Clear-text values were not persisted to repository files, the sanitized ledger, or the final CCR. Deployment/build/runtime logs, source contents, environment values, secrets, authenticated content, and settings mutations were not accessed or performed. Final evidence retains only reviewed categories, counts, booleans, and content digests.

## Selected architecture

| Decision | Exact value |
|---|---|
| Architecture | `OPTION_A_EXTERNAL_AUTHORIZATION_SERVICE_WITH_PROTECTED_LOCAL_LAUNCHER` |
| Execution boundary | `PROTECTED_LOCAL_LAUNCHER` |
| Launch owner | `ROOT_OR_ADMIN_OUTSIDE_ORDINARY_USER_WRITE_DOMAIN` |
| Trust anchors | `PROTECTED_LOCAL_CONFIGURATION` |
| Replay authority | `EXTERNAL_ATOMIC_DURABLE_NO_OFFLINE_FALLBACK` |
| Signature algorithm | `ED25519` |
| Connection profile | `PROTECTED_AND_NOT_CALLER_SUBSTITUTABLE` |
| CI/OIDC | `OPTIONAL_NOT_MANDATORY` |
| Ambiguous consume recovery | `SAME_REQUEST_ID_SIGNED_RECEIPT_ONLY` |

Repository files are untrusted parsers, request builders, fabricated models, and governance documents. None is an issuer, replay authority, trust anchor, protected transport, connection-profile store, protected journal, protected launcher, or execution authority.

## Trust boundaries

1. **Ordinary-user boundary.** Repository content and the thin request client are writable or debuggable by the ordinary user and are never authoritative.
2. **Protected local boundary.** A future root/admin-owned launcher, protected trust configuration, protected connection-profile mapping, durable pending-request state, and atomic launch journal must be outside ordinary-user write and debugging control.
3. **Issuer boundary.** An external issuer owns assertion policy and private signing material.
4. **Replay boundary.** An external authority owns registered assertion metadata, service time, atomic durable nonce state, terminal status, and same-request recovery.
5. **Service boundary.** Connection material is resolved only inside the protected launcher from a protected digest mapping.
6. **Evidence boundary.** Only bounded normalized evidence may be published after the protected operation.

Compromise of root/admin, the kernel, issuer, replay authority, protected transport, or protected launcher remains outside repository guarantees.

## Canonical assertion and local verification

The assertion envelope has exactly `payload`, `protected`, and `signature`. Its maximum encoded size is 16,384 bytes. Canonical bytes are ASCII JSON with lexicographically sorted object keys, compact separators, no trailing line feed, no duplicate fields, no arrays, no null, no floating-point values, and no alternate encoding.

The assertion payload uses a 1-through-300-second structural lifetime. The local verifier checks exact integer bounds, `expiry_epoch > issued_at_epoch`, and the maximum lifetime. It does not accept a caller-supplied clock or decide current-time validity. Final not-before and expiry acceptance belongs to the external replay authority's protected service time during atomic consume.

`phase` is exactly 1–128 printable ASCII characters matching `^[ -~]{1,128}$`. Newline, tab, C0 controls, and DEL are rejected before signature acceptance.

The signature input is:

```text
AIFINDER-LIVE-PREFLIGHT-AUTHORIZATION-V1
<canonical protected object>
<canonical payload object>
```

Each separator is one LF byte. The signature field is excluded. Exact digests are:

- `assertion_sha256`: SHA-256 of exact canonical assertion-envelope bytes, including the signature;
- `nonce_sha256`: SHA-256 of the decoded 32-byte nonce;
- `binding_sha256`: SHA-256 of `AIFINDER-LIVE-PREFLIGHT-BINDING-V1`, one LF, and the canonical execution-binding object defined by the verifier.

Production signature acceptance exists only through `ProtectedVerifierAdapter.verify`. The repository contains no trust anchor, private key, issuer, revocation database, or public approval secret.

## Replay protocol and terminal service-time decisions

The transport-free replay client accepts canonical responses with statuses:

- `CONSUMED`, carrying the exact stored signed receipt;
- `EXPIRED`, mapped to `AUTH_EXPIRED`;
- `REPLAY_REJECTED`, mapped to `AUTH_REPLAY_FAILED`;
- `UNAVAILABLE`, mapped to `AUTHORITY_UNAVAILABLE`;
- `AMBIGUOUS`, mapped to `AUTHORITY_AMBIGUOUS`.

The v1 broad `EXPIRED` status covers any consume attempt outside the registered issue/expiry service-time window, including a future-dated assertion. It is a durable terminal replay decision. The authority stores the request ID and terminal status; the same request returns `EXPIRED`, a status recovery returns `EXPIRED`, and a different request ID for that nonce returns `REPLAY_REJECTED`. No receipt is produced for `EXPIRED`, and later service time cannot reopen the authorization.

A successful `CONSUMED` result stores one exact role-separated signed receipt. Status recovery may return the exact stored receipt after assertion expiry, but it cannot create, extend, replace, or renew authorization.

The repository replay client implements no endpoint, authentication, certificate, credential, retry loop, replay database, or offline fallback. `ProtectedTransportAdapter.exchange` remains external.

## Protected pending-request recovery policy

The untrusted operation string cannot authorize recovery. A future protected launcher must maintain a durable protected pending-request record keyed by the consume request ID and bound to the assertion, nonce, and binding digests.

Required protected states are:

- `PENDING`: created before the first consume exchange;
- `AMBIGUOUS`: entered only after the protected transport reports a bounded ambiguous outcome;
- `DEFINITIVE`: entered after any definitive `CONSUMED`, `EXPIRED`, `REPLAY_REJECTED`, or other non-ambiguous outcome.

`RECOVER_AND_CLAIM` is permitted only when the protected record is already `AMBIGUOUS` and all request bindings match. A caller-supplied operation field, restored repository data, or a bare request ID cannot create that eligibility. A crash while the record remains merely `PENDING`, or a crash after a definitive result or journal claim, does not enter recovery; a fresh assertion is required. This intentionally fails closed if a process crash prevents protected ambiguity recording.

A caller never supplies a receipt descriptor or receipt digest. The protected launcher performs `RECOVER_SAME_REQUEST`, accepts only the exact terminal response from the replay authority, verifies a returned signed receipt when status is `CONSUMED`, and then closes the pending record as `DEFINITIVE`.

## Protected descriptor and `psql` contract

Descriptor numbers are process-local labels, not capabilities when copied between unrelated processes. The only permitted model is a protected parent opening the exact objects and spawning the thin client with the approved descriptors inherited.

Both launch operations require these object descriptors:

- assertion;
- SQL;
- activation manifest;
- validator;
- reviewed `psql` executable;
- output directory.

The Bash client accepts only canonical decimal descriptor spellings from `3` through `1023`, normalizes before comparison and serialization, and rejects pairwise duplicates. This client validation is not a security boundary.

The protected launcher must independently:

1. validate the exact required field set and descriptor range;
2. require all descriptor roles to be pairwise distinct;
3. reject symlinks, wrong object types, wrong owners, wrong modes, unsafe link counts, and wrong access modes;
4. measure the exact opened assertion, SQL, manifest, validator, `psql`, output directory, and activation-client image;
5. compare every protected measurement to the signed bindings;
6. execute the exact already-opened and measured `psql` object through an approved descriptor-bound mechanism;
7. reject caller paths, `PATH` lookup, ordinary-user configuration, or reopen-by-path substitution.

The caller's `activation_client_sha256`, `psql_sha256`, and other request digests are non-authoritative hints. Protected measurements win on every mismatch.

The future output boundary is `PROTECTED_VALIDATOR_DESCRIPTOR_PIPELINE`. The protected launcher must connect the exact opened and measured `psql` descriptor to the exact opened and measured validator descriptor through private inherited pipes. Raw `psql` output and stderr must never be published. The launcher accepts only an empty bounded validator stderr, the exact success category, the exact normalized 56-line contract, one terminal digest line, and a locally recomputed SHA-256 match.

Publication is `DESCRIPTOR_RELATIVE_ATOMIC_EVIDENCE_PUBLICATION`: the protected launcher uses only the already-opened output-directory descriptor, creates a new regular temporary file with exact mode `0600` and no-follow/exclusive semantics, writes the complete normalized evidence plus digest line, fsyncs the file, publishes without replacement, revalidates the published object, removes the temporary name, and fsyncs the directory. `FILE_AND_DIRECTORY_FSYNC_BEFORE_SUCCESS` is mandatory. No caller path, reopen-by-path operation, overwrite, hard-link substitution, or repository-local output is permitted.

## Required future protected-launch order

The following remains an external contract, not repository implementation:

1. Protected parent opens, validates, measures, and inherits every exact descriptor.
2. Protected launcher validates the canonical request and protected pending-request state.
3. It verifies baseline, branch policy, tracked cleanliness, artifact identities, and output identity.
4. It parses the assertion and verifies Ed25519 through role-scoped protected trust.
5. It verifies structural lifetime, environment, single read-only scope, exactly-one requirement, and all six false operational flags.
6. For a first consume, it creates the durable `PENDING` record and contacts replay authority once.
7. It accepts only bounded terminal statuses. Ambiguity cannot authorize launch.
8. Recovery is permitted only from the durable protected `AMBIGUOUS` state with the same request ID and bindings.
9. It verifies the role-separated signed `CONSUMED` receipt and exact request/assertion binding.
10. It atomically claims `SHA256(exact canonical receipt bytes)` in the protected local journal.
11. It resolves the connection profile only through protected `connection_profile_identity_sha256` mapping.
12. Only that protected process may execute the exact opened and measured `psql` object for one future read-only invocation, with stdout connected only to the exact opened and measured validator descriptor.
13. It verifies the validator's bounded status, empty stderr, normalized evidence shape, terminal digest line, and independently recomputed digest before publication.
14. It performs descriptor-relative atomic evidence publication with exact mode `0600`, file fsync, no-replace publication, published-object verification, temporary cleanup, and directory fsync.
15. It reports success only after both child processes are reaped, the publication is durable, and fallible descriptor cleanup is complete. A failure after definitive consume, journal claim, or publication requires a fresh assertion. No automatic retry or offline fallback exists.

## Repaired artifact identities

| Path | SHA-256 | Bytes |
|---|---|---:|
| `scripts/_drafts/discovery-phase-27ot-27pe-signed-authorization-assertion-schema.json` | `c7dbf4abfc4e7341ad1272ce6ea0d30085848be0c0c9d4a234bb24209f75e543` | 8363 |
| `scripts/_drafts/discovery-phase-27ot-27pe-signed-authorization-verifier-candidate.py` | `ad846ba1eac022642459d1fa1e1c53b023d83df41ab374931781f4b5c2e8a122` | 18048 |
| `scripts/_drafts/discovery-phase-27ot-27pe-replay-authority-client-candidate.py` | `188f2ca33228b918d9c99cc406cf69904f9061d7979175c5c86fa1a329f7e9c8` | 10350 |
| `scripts/_drafts/discovery-phase-27ot-27pe-protected-launch-request-schema.json` | `282137e69a6a728237c145e6103cf828ad10dbadf3385d8bf9f2027e7770a7e7` | 8455 |
| `scripts/_drafts/discovery-phase-27ot-27pe-authorization-security-fixtures.json` | `d90d7442100d9ee48f783338d9094085ca1add633ad38e7a47fc7612e0079151` | 12730 |
| `scripts/_drafts/discovery-phase-27ot-27pe-authorization-security-runner-candidate.py` | `4655ea879a0e590b45da1b0be0ffd23b265f0d0247778b0b840bbd41c648f329` | 78596 |
| `scripts/_drafts/discovery-phase-27ot-27pe-authenticated-activation-client-candidate.sh` | `aa61ff84256a7f8e7b7ab8c02857fe82fafeb30e40eefe040d2c361900227aa5` | 6246 |

All remain non-secret static candidates. The deterministic adapter is not Ed25519, the replay model is not external or durable, and the descriptor harness is not a protected operating-system installation.

## Fabricated static assurance

The Phase 27RG–27RN runner preserved the original 33 fixture IDs and added ten repair fixtures, for 43 historical cases. That test-first sequence was:

- original implementation with repaired fixtures/runner: `31 pass / 12 fail`;
- verifier repair: `35 pass / 8 fail`;
- replay repair: `37 pass / 6 fail`;
- launch schema/client repair: `43/43 pass`.

The independent Phase 27RO–27RZ full-load review added eighteen focused cases for integer-version exactness, adversarial receipts, all six false authorization flags, canonical request IDs, actual concurrent callers, complete protected recovery bindings, exact schema contracts, protected output publication, and predecessor-governance supersession. The initial full-load progression was `48 pass / 13 fail` RED, then `61/61 pass` GREEN with empty stderr.

Adversarial closing review added twelve more regression cases and corrected the duplicate-descriptor reachability, recovery-failure category, exception specificity, exact assertion/receipt field sets, every JSON-Schema terminal-control boundary, all three core execution-scope constraints, signed-receipt terminal semantics, and signed-assertion lifetime limits. The closing test-first sequence was `60/61`, then `61/61`; `60/64`, then `64/64`; `63/65`, then `65/65`; a three-failure scope-constraint mutation RED followed by `68/68`; a concurrency-probe `67/68` RED followed by `68/68`; a three-failure receipt mutation RED followed by `71/71`; and a two-failure lifetime mutation RED followed by final `73/73`, always with empty stderr. The final schemas use control-safe anchored patterns for phases, identifiers, hashes, opaque IDs, signatures, and request IDs. The runner proves exact `required == properties` and `additionalProperties: false` contracts at every assertion and receipt object boundary, rejects non-read-only or non-single-run scope, rejects invalid receipt terminal state/category/time and invalid assertion lifetime, and requires an eight-caller barrier rendezvous with an observed concurrency peak of eight before accepting the atomic replay race model.

The lifetime fixtures require persistent same-request `EXPIRED` results and different-request rejection. The Bash harness requires accepted cases to exit zero, emit no stderr, and produce exact canonical JSON. Rejection cases must exit one, emit only `PROTECTED_LAUNCH_REQUEST_FAILED`, and write no request bytes. A successful process emitting malformed JSON is a test failure, not an expected schema rejection.

Passing this corpus establishes only consistency of the fabricated grammar, deterministic adapter boundary, in-memory replay model, protected-state model, and documented fail-closed categories. It does not establish production cryptography, durable replay, root ownership, protected profile resolution, protected process isolation, exact-once operating-system launch, database safety, or live readiness.

## Repository and integration boundary

The completed static integration contains exactly sixteen reviewed paths: thirteen corrected paths plus the byte-identical bounded-evidence validator, fixtures, and runner. Three superseded unsigned/local-consumption paths remain byte-identical, excluded, untracked, and outside any integration or governance staging scope.

The Phase 28AR–28AZ finalization has an exact six-path scope. Its resulting commit is externally bound by Git and the final CCR, with the exact subject above. The stable post-commit state is zero tracked modifications, empty index, exactly three unchanged excluded untracked files, and local/remote ahead/behind `0/0`. The six final content identities are recorded non-circularly by the final Git tree and content-addressed CCR rather than embedded in files that would hash themselves or one another.

Every repository modification after this exact finalization requires new Gemini review and separately named exact authorization. Assertion issuance, authorization-record generation, live execution, migration execution, mutation, type generation, direct deployment, publishing, operational reactivation, and public launch remain false and blocked.
