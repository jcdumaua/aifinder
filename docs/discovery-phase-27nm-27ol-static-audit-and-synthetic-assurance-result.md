# Phase 27NM–27OL Static Audit and Synthetic Assurance Result — Post-Integration Governance Closure

## Authority and exact boundary

The historical Phase 27RG–27RN repair completed at baseline `f7e7bd743a999f691bd30c593617aa191522fec6`. Gemini then returned `APPROVE_PHASE_27RO_27RZ_OPTION_A_STATIC_REPAIR_FULL_LOAD_REVIEW_FIX_EXACT_16_PATH_COMMIT_PUSH_AND_REMOTE_VERIFICATION`, consumed exactly once for independent review, in-scope test-first correction, validation, exact sixteen-path integration, push, and remote verification.

That token is now `SPENT_NON_REUSABLE`. Its completed integration is commit `31a684294fa9f5d0c375a3457f601e78faf07833`, parent `f7e7bd743a999f691bd30c593617aa191522fec6`, tree `0ffdfbd3d2541d5ae82f5e4a80283ddbb7f24ff7`, subject `Implement authenticated authorization trust redesign candidates`. Local `main`, local `origin/main`, and GitHub `main` were verified at that identity with ahead/behind `0/0`. The token cannot authorize another staging, commit, or push action and never authorized key generation, trust installation, issuer or replay infrastructure, endpoint selection/contact, protected-launcher installation, connection-profile creation, service-material access, SQL, `psql`, database or Supabase access, migrations, type generation, application startup, deployment, publishing, operational reactivation, or public launch.

Primary classification: `OPTION_A_STATIC_INTEGRATION_COMPLETE_LIVE_READINESS_BLOCKED`.

Phase 28AI–28AN authority `APPROVE_PHASE_28AI_28AN_EXACT_6_PATH_POST_INTEGRATION_GOVERNANCE_CLOSURE_IMPLEMENT_REVIEW_NO_STAGE_NO_COMMIT_NO_PUSH` is `SPENT_FOR_EXACT_6_PATH_IMPLEMENTATION_AND_REVIEW_ONLY_NO_STAGE_COMMIT_PUSH`. It cannot authorize staging, commit, push, or any operational action.

Phase 28AR–28AZ authority `APPROVE_PHASE_28AR_28AZ_EXACT_6_PATH_GOVERNANCE_FINAL_REVIEW_FIX_COMMIT_PUSH_AND_BOUNDED_VERCEL_GIT_SIDE_EFFECT_VERIFICATION` is consumed exactly once for the exact six-path final review, correction, static verification, staging, commit, push, GitHub verification, and bounded Vercel Git-side-effect verification. The exact parent/pre-commit baseline is `31a684294fa9f5d0c375a3457f601e78faf07833`; the resulting commit is `EXTERNALLY_BOUND_BY_GIT_AND_FINAL_CCR`; and the exact subject is `Reconcile authorization trust governance after integration`.

Bounded read-only correlation resolves one baseline-bound Vercel deployment: environment `PRODUCTION`, state `READY`, trigger `AUTOMATIC_GIT_INTEGRATION`, and materiality `MATERIAL_PRODUCTION_SIDE_EFFECT`. Access/protection and production branch remain `UNRESOLVED`. Only the GitHub target digest `d4fab4b57864a81d8c3a385403afc7b8929ddc26729507cee4fc7175c28c9e1b` and bounded identity digests are retained; no raw target, URL, alias, domain, team, project, actor, log, source, setting, environment value, or secret is retained.

## Repaired findings

| Finding | Static repair |
|---|---|
| Verifier accepted ASCII controls in `phase` | Enforces `^[ -~]{1,128}$` before signature acceptance |
| Thin client accepted noncanonical descriptor spellings | Accepts canonical decimal `3..1023`, normalizes before uniqueness and JSON, and rejects alternate spellings |
| Recovery required a caller receipt | Caller receipt fields/options removed; only the protected launcher queries replay authority |
| Reviewed `psql` identity was implicit | Both operations require inherited `psql_fd`; protected execution must use the exact opened and measured object |
| Caller/local time could be treated as authoritative | Local verifier is structural only; replay service time returns durable terminal `EXPIRED` |
| JSON boolean `true` was accepted as protocol version `1` | Assertion, receipt, replay-request, and replay-response parsers now require a non-boolean integer equal to `1`; both schemas state integer type explicitly |
| Signed-receipt and three false-authorization branches lacked adversarial tests | Adds signature, trust-role, four binding, boolean-version, deployment, publishing, and operational-reactivation cases |
| Concurrent consume and recovery eligibility were under-modeled | Uses actual concurrent callers with a locked atomic fabricated authority and binds protected pending state to request, assertion, nonce, and binding digests |
| Base64url request identifiers accepted noncanonical trailing bits | Schemas, verifier, replay client, and thin client now require canonical unpadded encodings |
| Protected output publication was unspecified | Defines exact-validator private piping, bounded digest verification, descriptor-relative atomic `0600` publication, file/directory fsync, and fresh-assertion failure ordering |
| Migration dependency gate retained a stale predecessor status | Marks the old boundary superseded while preserving every migration, type-generation, and live-operation block |

The repair also makes recovery eligibility explicit: a protected durable pending-request record must already be `AMBIGUOUS` before `RECOVER_AND_CLAIM` is accepted. The untrusted operation selector alone cannot authorize recovery.

## Test-first record

The historical Phase 27RG–27RN exact progression was:

```text
RED:             31 pass, 12 fail, exit 1
Verifier repair: 35 pass,  8 fail, exit 1
Replay repair:   37 pass,  6 fail, exit 1
Final repair:    43 pass,  0 fail, exit 0
```

The independent full-load regression layer then produced `48 pass / 13 fail`, exit `1`, empty stderr, proving all newly reviewed defects. The minimum correction produced `61/61 pass`. Adversarial closing review then drove four further direct RED/GREEN cycles and three mutation RED/GREEN cycles for recovery categorization, schema contracts, exact exception handling, scope constraints, concurrent callers, signed-receipt terminal semantics, and assertion lifetime. The final result is `73/73 pass`, exit `0`, empty stderr. Its output is SHA-256 `e02bad33e2fae1efb717710a37316cd4e5501aecb803ac38698a2cd2711627c5`, 5,212 bytes, 73 lines.

The preserved bounded-evidence fabricated corpus remains 33/33 pass. Neither corpus uses a real key, network, service material, SQL, database, Supabase, application module, route, server, migration, or type generation.

## Behavior-bearing artifact identities

| Path | SHA-256 | Bytes |
|---|---|---:|
| `scripts/_drafts/discovery-phase-27ot-27pe-signed-authorization-assertion-schema.json` | `c7dbf4abfc4e7341ad1272ce6ea0d30085848be0c0c9d4a234bb24209f75e543` | 8363 |
| `scripts/_drafts/discovery-phase-27ot-27pe-signed-authorization-verifier-candidate.py` | `ad846ba1eac022642459d1fa1e1c53b023d83df41ab374931781f4b5c2e8a122` | 18048 |
| `scripts/_drafts/discovery-phase-27ot-27pe-replay-authority-client-candidate.py` | `188f2ca33228b918d9c99cc406cf69904f9061d7979175c5c86fa1a329f7e9c8` | 10350 |
| `scripts/_drafts/discovery-phase-27ot-27pe-protected-launch-request-schema.json` | `282137e69a6a728237c145e6103cf828ad10dbadf3385d8bf9f2027e7770a7e7` | 8455 |
| `scripts/_drafts/discovery-phase-27ot-27pe-authorization-security-fixtures.json` | `d90d7442100d9ee48f783338d9094085ca1add633ad38e7a47fc7612e0079151` | 12730 |
| `scripts/_drafts/discovery-phase-27ot-27pe-authorization-security-runner-candidate.py` | `4655ea879a0e590b45da1b0be0ffd23b265f0d0247778b0b840bbd41c648f329` | 78596 |
| `scripts/_drafts/discovery-phase-27ot-27pe-authenticated-activation-client-candidate.sh` | `aa61ff84256a7f8e7b7ab8c02857fe82fafeb30e40eefe040d2c361900227aa5` | 6246 |
| `docs/discovery-phase-27ot-27pe-authorization-trust-architecture-and-static-assurance-gate.md` | `9a01afa909248ce5d31dd066e94e9669ec15ac0b49b5447bfb8e8b12bda1369e` | 20674 |
| `scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-identity-manifest.json` | `EXTERNALLY_BOUND_NO_SELF_REFERENCE` | `EXTERNALLY_BOUND_NO_SELF_REFERENCE` |

The activation manifest deliberately uses `EXTERNALLY_BOUND_NO_SELF_REFERENCE` for its own identity. Remaining governance-document identities are bound by the final exact Git tree and content-addressed CCR to avoid self-reference or circular hashing.

## Exact static checks

The successful repair requires all of the following in one fresh run:

1. exact completed commit, parent, tree, subject, branch, local refs, GitHub main, and `0/0` ahead/behind;
2. exactly six authorized governance modifications and an empty index;
3. exact three-file excluded untracked composition;
4. exact starting and final hashes, bytes, modes, and non-symlink properties for all six governance paths;
5. exact preservation of the completed behavior-bearing integration and the three excluded paths;
6. historical test-first counts `31/12`, `35/8`, `37/6`, then `43/43`, followed by full-load RED `48/13`, GREEN `61/61`, and adversarial closing cycles ending at `73/73`;
7. terminal persistent `EXPIRED` behavior and different-request rejection;
8. protected ambiguity eligibility modeled separately from definitive crash behavior;
9. accepted Bash cases: exit zero, empty stderr, exact canonical request;
10. rejected Bash cases: exit one, exact bounded stderr, zero request bytes;
11. Python AST parsing and bytecode compilation without application imports;
12. strict duplicate-key JSON parsing and exact schema assertions;
13. `/bin/bash -n` for the thin client;
14. secret, endpoint, private-key, connection-string, and token-pattern exclusions;
15. `git diff --check`;
16. exact six-path pre-commit scope and stable post-commit state verification with no live operation, direct remote-platform write, or prohibited side effect.

## Scope and assurance limit

The historical completed commit contains the exact sixteen reviewed integration paths. This governance finalization commits exactly six tracked governance/manifest paths and changes no behavior-bearing Python, Bash, schema, fixture, runner, validator, SQL, migration, application, configuration, or generated-type file. The six final identities are bound without self-reference by the final Git tree and content-addressed CCR.

The stable post-commit state is zero tracked modifications, an empty index, exactly three unchanged excluded untracked files, and ahead/behind `0/0`. Direct Vercel writes remain unauthorized; the only authorized write-side effect is the automatic Git-integration deployment caused by the exact push.

The deterministic adapter is not production Ed25519. The replay model is in-memory and non-durable. The protected pending state, trust anchors, connection-profile mapping, descriptor validation, journal, launcher, and descriptor-bound `psql` execution remain external and unimplemented. Static success cannot be promoted to live readiness.

## Next action

Preserve this completed governance finalization and its final CCR. Every subsequent repository modification requires new Gemini review and a separately named exact authorization. Every operational layer remains blocked.
