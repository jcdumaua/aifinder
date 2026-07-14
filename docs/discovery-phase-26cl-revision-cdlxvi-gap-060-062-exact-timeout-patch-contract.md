# AiFinder Phase 26CL — GAP-060–GAP-062 Exact Timeout Patch Contract

## Status

DOCUMENTATION-ONLY PATCH CONTRACT.

## Candidate anchor

- Repository baseline: `78705c6746aa14f74b89380c858963ef214343a5`
- Candidate SHA-256: `d6ddd7bbed701716c28db8787bd2476b9f4f607c04dae6c5619858932939423c`
- Candidate mode: `100644`
- Candidate executable: `NO`

## Exact approved transformation

Replace exactly:

`TIMEOUT_SECONDS="__LATER_REVIEWED_FIXED_TIMEOUT__"`

with:

`TIMEOUT_SECONDS="15"`

## Required controls

The future gate must:

1. require exactly one exact placeholder match;
2. reconstruct the expected patched bytes from the committed baseline;
3. compare the working candidate byte-for-byte with the reconstruction;
4. allow exactly one changed repository path;
5. preserve the inserted execution baseline unchanged;
6. preserve retry count `0`;
7. preserve mode `100644` and non-executable state;
8. run `bash -n` without invoking the candidate;
9. perform zero environment enumeration, token retrieval, selector discovery, or API requests;
10. restore the original candidate on every post-write failure;
11. return immediately after any failed condition.

## Authority boundary

This contract does not itself authorize applying, staging, committing, pushing, or executing the patch.
