# AiFinder Phase 26EF — Trace Count Verification Contract

Exactly one occurrence is required for each approved diagnostic trace:

1. preflight validation passed;
2. curl exit and HTTP status;
3. parser exception class.

Zero, duplicate, renamed, or expanded traces fail closed.
