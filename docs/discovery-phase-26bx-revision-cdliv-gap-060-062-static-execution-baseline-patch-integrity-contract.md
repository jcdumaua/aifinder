# AiFinder Phase 26BX — GAP-060–GAP-062 Static Execution Baseline Patch Integrity Contract

## Status

DOCUMENTATION-ONLY INTEGRITY CONTRACT.

## Pre-patch requirements

Any future patch gate must fail closed unless all of the following are true:

1. Repository path is `/Users/jamescarlodumaua/aifinder`.
2. Origin is `https://github.com/jcdumaua/aifinder.git`.
3. Branch is `main`.
4. Local `HEAD` and `origin/main` equal `96f91601611e7d0be168e68fa6d5554aa76fa1a3`.
5. Working tree and index contain no unrelated changes.
6. Candidate SHA-256 equals `560cbbc2a547d06b5f6237f28a6df7af4404ab391e34b2794bf029bca12b3617`.
7. Candidate mode is `100644`.
8. Candidate is non-executable.
9. Candidate passes `bash -n`.
10. No candidate process is invoked.

## Exact patch contract

The future patch must:

- replace exactly one reviewed inert baseline placeholder;
- insert exactly `96f91601611e7d0be168e68fa6d5554aa76fa1a3`;
- produce exactly one changed repository path;
- preserve mode `100644`;
- leave the timeout unresolved;
- leave every confirmation and authorization field unresolved;
- perform zero network requests.

Zero or multiple placeholder matches must fail closed.

## Post-patch identity

The new SHA-256 must be calculated after patching and recorded in the review package. It must not be predicted or accepted without local calculation.

## Authorization boundary

This contract does not authorize applying, committing, or executing the patch.
