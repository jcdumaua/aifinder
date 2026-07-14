# AiFinder Phase 26NH — Source Implementation and Rollback Plan

## Authorized future source scope

A later implementation gate may modify only:

- candidate lines 79–80 by removing the exact reviewed block;
- wrapper line 23 by applying the reviewed local namespace replacement;
- wrapper line 24 by applying the reviewed remote namespace replacement;
- wrapper line 147 by applying the reviewed sanitizer admission replacement;
- wrapper insertion immediately before original line 318;
- wrapper insertion immediately after original line 319.

## Mandatory verification

- Verify exact pre-change source identities.
- Apply transformations by exact byte matches, never line-number-only editing.
- Verify proposed candidate and wrapper SHA-256 identities.
- Run `bash -n` on both files.
- Run only the Phase 26NG zero-network synthetic matrix.
- Keep both source files mode `100644` and non-executable.
- Stop before staging for independent Gemini review.

## Rollback

On any mismatch or test failure:

1. restore candidate and wrapper from baseline `124e12300309fb03bde72dd20a4e6a0a6ec05805`;
2. verify original SHA-256 identities;
3. remove generated temporary fixtures;
4. leave the repository clean;
5. do not retry automatically.

No live request or operational reactivation is authorized.
