# Phase 26VI — Live RLS Execution Stop and Rollback Contract

## Pre-execution stop conditions

Do not connect when:

- baseline differs;
- origin/main differs;
- repository is dirty or unsynchronized;
- SQL or wrapper SHA-256 differs;
- either candidate mode differs from `100644`;
- connection variable is absent;
- `psql` is unavailable;
- SQL preflight fails;
- an unapproved source or mutation keyword appears.

## Execution stop conditions

Fail immediately when:

- `psql` reports any error;
- statement timeout occurs;
- connection authentication fails;
- unexpected prompts occur;
- output contains secret-like values;
- output contains application-row data;
- output columns exceed the approved allowlist;
- the read-only transaction cannot be established;
- rollback is not reached;
- repository state changes.

## Rollback posture

The query file explicitly ends with `ROLLBACK`.

Because the transaction is declared `READ ONLY`, mutation is prohibited before rollback. No automatic retry is allowed.

## Failure handling

- remove raw output;
- do not copy raw failure output to the clipboard;
- preserve only a local high-level failure log;
- do not modify SQL, wrapper, policies, schema, migrations, or credentials;
- request a reviewed recovery phase.

## Post-execution state

Operational reactivation remains blocked regardless of pass or failure.

## Corrected provenance stop condition

Stop when approved package baseline `bcdc55495061592e1d60af6ed3f16ca0256db0ae` is not an ancestor of the clean synchronized current `HEAD`.
