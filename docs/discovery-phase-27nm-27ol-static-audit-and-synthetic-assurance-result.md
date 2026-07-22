# Phase 27NM–27OL Static Audit and Synthetic Assurance Result — Option A Full-Load Correction

## Authority and exact boundary

The historical Phase 27RG–27RN repair completed at baseline `f7e7bd743a999f691bd30c593617aa191522fec6`. Gemini then returned `APPROVE_PHASE_27RO_27RZ_OPTION_A_STATIC_REPAIR_FULL_LOAD_REVIEW_FIX_EXACT_16_PATH_COMMIT_PUSH_AND_REMOTE_VERIFICATION`, consumed exactly once for independent review, in-scope test-first correction, validation, exact sixteen-path integration, push, and remote verification.

The token authorizes exact sixteen-path staging, one exact-subject commit, push to `origin/main`, and remote Git identity verification only after all static gates pass. It does not authorize key generation, trust installation, issuer or replay infrastructure, endpoint selection/contact, protected-launcher installation, connection-profile creation, service-material access, SQL, `psql`, database or Supabase access, migrations, type generation, application startup, deployment, publishing, operational reactivation, or public launch.

Primary classification: `OPTION_A_STATIC_FULL_LOAD_CORRECTED_PENDING_EXACT_INTEGRATION`.

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
| `docs/discovery-phase-27ot-27pe-authorization-trust-architecture-and-static-assurance-gate.md` | `57a8ccdeff2f80f8ddaaaccb73965281d3740ef5ddc4968de03ff45b1cdc4cf4` | 17888 |
| `scripts/_drafts/discovery-phase-27nm-27ol-live-preflight-activation-identity-manifest.json` | `6d4e55d8f7a0abacfde9091c9d719856dffdce03ba154c5d1bd03eec6153c401` | 19820 |

The activation manifest deliberately uses `EXTERNALLY_BOUND_NO_SELF_REFERENCE` for its own identity. Remaining governance-document identities are bound by the final exact Git tree and content-addressed CCR to avoid self-reference or circular hashing.

## Exact static checks

The successful repair requires all of the following in one fresh run:

1. exact baseline, branch, parent, subject, local refs, and `0/0` ahead/behind;
2. zero tracked modifications and an empty index;
3. exact nineteen-file untracked composition;
4. exact starting hashes, bytes, modes, and non-symlink properties for all sixteen authorized paths;
5. exact preservation of three eligible unchanged paths and three excluded paths;
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
16. exact sixteen-path staged-scope verification before the one authorized commit/push, with no live operation or prohibited side effect.

## Scope and assurance limit

Thirteen authorized paths are corrected. The bounded-evidence validator, fixtures, and runner remain byte-identical. Three superseded unsigned/local-consumption paths remain byte-identical and excluded. Before staging, the state remains exactly nineteen untracked files, zero tracked modifications, and an empty index.

The deterministic adapter is not production Ed25519. The replay model is in-memory and non-durable. The protected pending state, trust anchors, connection-profile mapping, descriptor validation, journal, launcher, and descriptor-bound `psql` execution remain external and unimplemented. Static success cannot be promoted to live readiness.

## Next action

After final identity rebinding and fresh validation, stage exactly the sixteen authorized paths, verify the staged name set, commit with the approved subject, push to `origin/main`, and verify local and remote identity. Every operational layer remains blocked.
