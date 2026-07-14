# AiFinder Phase 26MX — Recovery and Rollback Plan

Implementation recovery must:

- require the exact approved baseline and source hashes;
- create no partial source state on failed anchor matching;
- restore original bytes on failed static tests;
- never rewrite pushed history;
- never invoke the wrapper or candidate.
