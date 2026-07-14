# AiFinder Phase 26CI — GAP-060–GAP-062 Timeout Static Patch Plan

## Status

PLANNING ONLY — NO PATCH AUTHORIZED.

## Candidate anchor

- Repository baseline: `43e8f18d1ac0e0e3cf151f69f9940e17300722e9`
- Candidate SHA-256: `d6ddd7bbed701716c28db8787bd2476b9f4f607c04dae6c5619858932939423c`
- Candidate mode: `100644`
- Candidate executable: `NO`

## Future exact patch target

The future reviewed patch may replace only:

`TIMEOUT_SECONDS="__LATER_REVIEWED_FIXED_TIMEOUT__"`

with the separately approved integer value.

## Required controls

The future gate must:

- require exactly one exact placeholder match;
- reconstruct the expected bytes independently from the committed baseline;
- allow exactly one changed path;
- preserve mode `100644` and non-executable state;
- run `bash -n` without executing the candidate;
- preserve the inserted execution baseline unchanged;
- preserve retry count `0`;
- perform no environment enumeration, token access, selector discovery, or API request;
- restore original bytes on every post-write failure;
- stop immediately after any failed condition.

## Authorization boundary

This plan does not select a timeout or authorize applying, staging, committing, or executing the patch.
