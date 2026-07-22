# Phase 27NM–27OL Full-Load Static Execution-Readiness Gate — Option A Full-Load Correction

## Determination

Primary classification: `OPTION_A_STATIC_FULL_LOAD_CORRECTED_PENDING_EXACT_INTEGRATION`.

The consumed Phase 27RO–27RZ full-load token authorizes independent review, repeated in-scope test-first correction, exact sixteen-path staging, one exact-subject commit, push to `origin/main`, and remote Git identity verification at baseline `f7e7bd743a999f691bd30c593617aa191522fec6`. It does not authorize production keys or trust, infrastructure, endpoints, protected-launcher installation, connection profiles, network calls, service material, SQL, database or Supabase access, migrations, type generation, application execution, deployment, publishing, operational reactivation, or public launch.

## Architecture gate

Option A remains the only permitted architecture:

- external authenticated issuer;
- external atomic durable replay authority with protected service time and no offline fallback;
- Ed25519 assertion and role-separated receipt signatures;
- root/admin-owned protected local launcher outside ordinary-user write/debug control;
- durable protected pending-request states `PENDING`, `AMBIGUOUS`, and `DEFINITIVE`;
- recovery permitted only from protected `AMBIGUOUS` state with the same request ID and bindings;
- no caller-supplied receipt;
- inherited reviewed `psql_fd`, with protected validation, measurement, and descriptor-bound execution;
- protected non-substitutable connection-profile mapping;
- protected atomic local journal keyed by SHA-256 of exact canonical receipt bytes;
- optional, non-mandatory CI/OIDC issuance evidence.

The corrected architecture gate identity is `57a8ccdeff2f80f8ddaaaccb73965281d3740ef5ddc4968de03ff45b1cdc4cf4`. The corrected activation manifest identity is `6d4e55d8f7a0abacfde9091c9d719856dffdce03ba154c5d1bd03eec6153c401`.

## Exact repair scope

Exactly thirteen of the sixteen eligible untracked paths are changed:

1. signed-authorization assertion schema;
2. signed-authorization verifier candidate;
3. replay-authority client candidate;
4. protected-launch request schema;
5. authorization security fixtures;
6. authorization security runner;
7. authenticated activation thin client;
8. authorization-trust architecture gate;
9. activation identity manifest;
10. static audit and synthetic assurance result;
11. failure and recovery contract;
12. this readiness gate;
13. migration-history placement/grant/type-generation dependency gate.

Three paths remain byte-identical and eligible for integration: the bounded-evidence validator, bounded-evidence fixtures, and bounded-evidence runner.

Three superseded unsigned/local-consumption paths remain byte-identical and excluded. They may not be staged in a later redesign commit.

## Static assurance gate

A pass requires all of the following in one fresh run:

- exact pre-repair baseline and nineteen-file identities;
- token consumption only after complete backup of all eleven repair paths;
- RED `31 pass / 12 fail`;
- verifier stage `35 pass / 8 fail`;
- replay stage `37 pass / 6 fail`;
- final Option A repair corpus `43/43 pass`, empty stderr, output SHA-256 `57a0dc3b32f9b7be171c86395d345c351664dd94c9305a076a5ea362e353d03e`;
- full-load RED `48 pass / 13 fail`, followed by corrected `61/61 pass`, then adversarial closing RED/GREEN and mutation cycles ending at `73/73 pass`, empty stderr, output SHA-256 `e02bad33e2fae1efb717710a37316cd4e5501aecb803ac38698a2cd2711627c5`;
- preserved bounded-evidence corpus `33/33 pass`;
- printable-phase rejection;
- durable terminal `EXPIRED` behavior and different-request rejection;
- protected ambiguity eligibility distinct from crash-after-definitive behavior;
- canonical descriptor spelling, normalized uniqueness, required `psql_fd`, and no caller receipt arguments;
- exact non-boolean integer versions, canonical Base64url identifiers, adversarial signed receipts, and all six false authorization flags;
- actual concurrent fabricated consume callers, atomic authority state, and assertion/nonce/binding-bound protected recovery eligibility;
- exact-validator private piping and descriptor-relative atomic output publication with file/directory fsync before success;
- accepted Bash cases emit exact canonical JSON; rejected cases emit no request bytes;
- Python AST parsing and bytecode compilation;
- strict JSON duplicate-key and schema checks;
- `/bin/bash -n` for the thin client;
- secret, endpoint, private-key, connection-string, and token-pattern scan;
- `git diff --check`;
- exact nineteen-file untracked composition, zero tracked modifications, and empty index;
- a complete external Gemini final-review package;
- no forbidden operational action.

## Assurance limit

The deterministic adapter is not production Ed25519. The replay and protected-pending models are in-memory and non-durable. The descriptor harness is not a protected operating-system installation. The repository has no trust anchors, protected connection profile, launcher, endpoint, credential, service material, durable replay store, or execution capability. Passing static checks cannot be promoted to live readiness.

## Repository completion state

The successful pre-integration state is zero tracked modifications, exactly nineteen untracked files, and an empty index. The consumed Phase 27RO–27RZ authority permits staging exactly the sixteen eligible paths only after every fresh gate passes. After integration, exactly three excluded paths must remain untracked and unchanged.

## Next action

Finish identity rebinding and fresh validation, stage exactly the sixteen authorized paths, commit with the approved subject, push to `origin/main`, and verify all local and remote identities. Every operational layer remains blocked.
