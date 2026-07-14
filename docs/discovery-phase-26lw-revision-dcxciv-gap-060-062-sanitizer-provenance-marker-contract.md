# AiFinder Phase 26LW — Sanitizer Provenance-Marker Contract

The sanitizer may admit each producer marker at most once.

Duplicate, malformed, or unexpected producer markers fail closed. Producer markers must never weaken the existing denylist.
