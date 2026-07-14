# AiFinder Phase 26CM — GAP-060–GAP-062 Timeout Patch Verification Plan

## Status

PLANNING ONLY.

## Future verification sequence

The successor timeout patch gate must verify:

1. exact repository path, origin, and branch;
2. local `HEAD` and `origin/main` equal the approved baseline;
3. ahead and behind counts are zero;
4. working tree and index are clean before the patch;
5. candidate pre-patch SHA-256 is exact;
6. mode is `100644`;
7. candidate is non-executable;
8. pre-patch `bash -n` passes;
9. exact timeout placeholder occurs once;
10. exact execution baseline already inserted remains unchanged;
11. timeout changes only to integer `15`;
12. exactly one repository path changes;
13. post-patch mode remains `100644`;
14. post-patch `bash -n` passes;
15. retry count remains `0`;
16. candidate remains unstaged and uncommitted during review;
17. candidate executions remain zero;
18. API requests remain zero;
19. post-patch SHA-256 is calculated locally;
20. review package is copied to the clipboard.

## Failure handling

Any failure must restore the original candidate bytes, verify the original SHA-256, preserve the original nonzero status, and copy the raw failure log to the clipboard.
