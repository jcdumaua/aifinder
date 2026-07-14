# AiFinder Phase 26DQ — GAP-060–GAP-062 Anchor-Locked Static Verification Contract

## Status

PLANNING ONLY — NO PATCH APPLIED.

A future patch gate must:

1. reconstruct the candidate from baseline `05088496f68fc111af0409f165dcf03c5b2cea31`;
2. require pre-patch SHA-256 `b6015959e32c3fd09756a51417dc9b503323e4befe6cef611ce2fc529852da2e`;
3. require each exact anchor block exactly once;
4. apply only the approved replacements;
5. verify each diagnostic trace occurs exactly once;
6. verify the original anchor blocks no longer remain where replacement is required;
7. pass `bash -n`;
8. preserve mode `100644` and non-executable state;
9. change exactly one repository path;
10. perform zero candidate executions and zero network requests;
11. produce the post-patch SHA-256 for Gemini review;
12. perform no staging, commit, or push.

Any anchor mismatch must restore the original candidate and stop.
