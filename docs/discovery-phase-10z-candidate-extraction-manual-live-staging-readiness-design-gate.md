# Discovery Phase 10Z — Candidate Extraction Manual Live Staging Readiness Design Gate

## 1. Title and Phase Summary

Phase 10Z is a docs-only readiness design gate for a possible future manual live candidate staging write from candidate extraction.

This phase does not enable `dry_run: false`.

This phase does not implement live staging.

This phase does not authorize live database writes.

This phase only defines prerequisites, contracts, safety boundaries, and future gates that would be required before AiFinder can even consider a future manual admin-triggered live staging write.

## 2. Current State Recap

Latest pushed commit:

```text
6342db5 Document extraction production readiness boundary
```

Current completed foundation:

- Phase 10V implemented the admin UI dry-run panel.
- Phase 10W defined and executed the exact approval-gated live UI dry-run verification.
- Phase 10X documented the successful live UI dry-run result.
- Phase 10Y established the production readiness boundary.
- The admin UI dry-run path is verified.
- Production extraction is not enabled.
- `dry_run: false` remains blocked.

The verified admin route remains:

```text
POST /api/admin/discovery/candidate-extraction/invoke
```

The existing admin UI sends `dry_run: true` only. The internal invocation helper still rejects `dry_run: false` with `live_invocation_not_enabled`.

## 3. Purpose of Future Manual Live Staging

If a future phase ever proposes live staging, manual live staging would mean:

- an admin manually invokes candidate extraction for one trusted source/run context;
- the system stages normalized candidate output into the candidate staging table only;
- the system does not write to public `tools`;
- the system does not publish anything;
- the system does not auto-approve candidates;
- the system does not write to `discovered_tools`;
- the system records bounded audit evidence;
- the system returns safe summary output only.

This future capability would be a staging-only administrative operation, not a public publishing workflow.

## 4. Production Write Boundary

The only future write under consideration is candidate staging insertion or update through the already designed mapper-to-staging pipeline.

Any future production-write proposal must explicitly forbid:

- public `tools` writes;
- `discovered_tools` writes;
- public publishing;
- automatic candidate approval;
- crawler automation;
- LLM automation;
- scheduled or background discovery;
- autonomous discovery;
- broad batch extraction;
- repeated UI invocation without exact approval.

The staging boundary must remain separate from public publishing and discovery queue workflows.

## 5. Required Future Code Changes Before Live Staging Can Exist

A future implementation phase would need separate Gemini review and James approval before any code changes.

Likely future areas to design or modify later:

- the internal invocation helper currently fails closed for `dry_run: false`;
- the route currently remains dry-run-only;
- the admin UI currently sends only `dry_run: true`;
- future live staging mode would need a separate server-controlled gate;
- future UI would need additional explicit confirmation copy;
- tests would need to prove `dry_run: false` cannot be reached accidentally.

Do not implement any of this in Phase 10Z.

Phase 10Z does not change helpers, routes, UI, tests, database schema, migrations, package files, or generated types.

## 6. Exact Row Mutation Contract Needed Before Implementation

Before implementation, a future live staging design must define:

- target table name;
- exact inserted columns;
- exact updated columns, if any;
- immutable fields;
- nullable fields;
- audit correlation fields;
- source/run linkage fields;
- candidate status after live staging;
- schema version field;
- raw/evidence reference fields;
- duplicate/provenance fields;
- timestamps;
- admin identity derivation;
- service-role usage boundary;
- RLS expectations;
- read-after-write verification query.

The current staging helper inserts into `discovery_candidate_tools` and forces `candidate_status: "staged"` in its insert payload. A future live staging design must decide whether to reuse this existing helper unchanged, wrap it with additional live-mode controls, or add a narrow orchestration layer around it.

Any future row mutation contract must be specific enough to audit, test, and clean up.

## 7. Candidate Status Boundary

Any future live staging write must keep candidates in a non-public staging state, such as:

```text
candidate_status = "staged"
```

Explicit boundaries:

- no automatic approval;
- no direct public publishing;
- no `approved` status;
- no `published` status;
- no public `tools` row.

Candidate staging must remain a review input for admins, not a publishing action.

## 8. Audit Event Contract

Future live staging must define audit event requirements before implementation.

Minimum audit expectations:

- one audit correlation ID per live staging invocation;
- server-derived admin identity;
- action name;
- source/run IDs;
- `dry_run` value;
- candidate count;
- staging result summary;
- safety flags;
- no raw payloads;
- no raw HTML;
- no secrets;
- no service-role details;
- no credentials;
- no tokens, cookies, or CSRF values;
- clear failure/rejection events;
- cleanup or rollback events if applicable.

Audit writes are not added in Phase 10Z.

Any future audit implementation must be separately reviewed and must not leak raw extraction payloads, prompt/model output, secrets, stack traces, credentials, cookies, tokens, or CSRF values.

## 9. Rollback and Cleanup Strategy

A future rollback/cleanup plan is required before any live staging write.

The future plan must include:

- exact-ID cleanup strategy for test rows if a smoke or live staging test is approved;
- audit cleanup policy, if any;
- whether audit events are preserved or cleaned;
- how to verify no orphaned rows remain;
- how to handle partial insert failure;
- how to handle duplicate conflict;
- how to handle validation failure after partial processing;
- how to document cleanup results.

If future live staging uses an existing real Discovery Run/source context, the cleanup plan must distinguish between cleanup of newly staged candidate rows and preservation of pre-existing source/run rows.

If cleanup cannot be verified, the future run must fail closed and report exact fixture or row IDs for separate approved remediation.

## 10. Duplicate and Quality Safety

Future live staging design must address:

- canonical URL checks;
- domain matching;
- normalized name checks;
- duplicate candidate staging checks;
- existing public tool checks;
- existing discovered tool checks;
- provenance requirements;
- minimum quality threshold;
- rejection reasons;
- safe skipped candidate reporting.

Duplicate and quality signals must remain advisory/review-oriented unless a separate approval flow explicitly defines blocking behavior.

The system must not stage low-quality or ambiguous candidates merely because an admin clicked a live staging button.

## 11. Read-After-Write Verification Plan

A future live staging gate must define exact read-after-write verification before any live write.

It must verify:

- exactly expected candidate staging rows were created or updated;
- correct source/run IDs;
- correct audit correlation ID;
- correct candidate status;
- correct schema version;
- no public `tools` writes;
- no `discovered_tools` writes;
- no unexpected row counts;
- no raw payload leakage;
- safe UI summary matches database state if DB read verification is approved.

Any read-after-write verification must use approved read paths and must not rely on arbitrary remote SQL unless a separate phase authorizes it.

## 12. Rate Limit and Abuse Protection

Future live staging must remain:

- admin-only;
- CSRF-protected;
- rate-limited;
- manually triggered;
- confirmation-gated;
- free of automatic retries;
- free of polling-triggered repeated writes;
- free of scheduled or background execution;
- free of crawler or LLM automation.

The future design must define low default limits, fail-closed behavior on rate-limit errors, and safe response bodies.

## 13. Future UI Requirements Before Live Staging

If future live staging is ever considered, UI must include:

- separate live-staging mode design;
- very explicit warning copy;
- exact source/run context;
- candidate count cap;
- one-click final confirmation after prepare step;
- disabled repeated click after submission;
- no accidental double-submit;
- safe success/rejection summary;
- no raw payload, raw HTML, or secrets rendering;
- clear statement that public publishing is not happening.

The existing dry-run panel must not be silently repurposed into a live write control.

Any future live mode must be visually and behaviorally distinct from dry-run mode and must require separate Gemini review and James approval.

## 14. Future Testing Requirements

Future tests needed before implementation or live run:

- helper rejects unauthorized `dry_run: false`;
- route rejects `dry_run: false` unless a server-side gate is enabled;
- UI cannot enter live mode unless future gate exists;
- request never sends client-supplied admin identity;
- staging write uses exact source/run;
- candidate status remains staged;
- no public `tools` writes;
- no `discovered_tools` writes;
- audit event sanitized;
- duplicate conflict safe;
- rollback/cleanup helper tested;
- read-after-write verification tested;
- rate-limit behavior safe;
- no double-submit;
- safe rendering.

Future live tests must document whether they are mocked/unit, local safe opt-out, or explicitly approved live tests.

## 15. Future Live Staging Approval Phrase Boundary

Placeholder future phrase:

```text
Approve run candidate extraction live staging write
```

This phrase is not active in Phase 10Z.

It must not be accepted yet.

It can only become active after a future Gemini-approved live staging gate explicitly defines the exact scope, command or UI action, row limits, cleanup, and verification plan.

Until then, no live staging write is authorized.

## 16. Recommended Future Phase Sequence

Recommended careful sequence after Phase 10Z:

```text
Phase 11A — Candidate Extraction Manual Live Staging Contract Design
Phase 11B — Candidate Extraction Manual Live Staging Implementation Plan
Phase 11C — Candidate Extraction Manual Live Staging Implementation
Phase 11D — Candidate Extraction Manual Live Staging Verification Gate
Phase 11E — Candidate Extraction Manual Live Staging Result Documentation
```

Each phase requires Gemini review and James approval before commit/push.

Any live write requires an exact approval phrase defined by a prior Gemini-approved gate.

## 17. Current Hard Stops

Current hard stops:

- no `dry_run: false`;
- no production candidate staging write;
- no public publishing;
- no public `tools` write;
- no `discovered_tools` write;
- no automatic approval;
- no crawler automation;
- no LLM automation;
- no scheduled or background discovery;
- no autonomous discovery;
- no repeated UI live invocation;
- no batch widening;
- no live staging approval phrase active yet.

These hard stops remain active after Phase 10Z.

## 18. Non-Goals

Phase 10Z explicitly forbids:

- source code changes;
- test changes;
- API route changes;
- helper changes;
- UI changes;
- package changes;
- migrations;
- generated type changes;
- dependency changes;
- rerunning the live UI dry-run;
- clicking the UI;
- sending another POST to `/api/admin/discovery/candidate-extraction/invoke`;
- live smoke;
- opt-in smoke environment variables;
- database commands;
- remote SQL;
- `supabase db push`;
- candidate row creation;
- discovery source row creation;
- discovery run row creation;
- `public.tools` writes;
- `discovered_tools` writes;
- audit event writes;
- crawler automation;
- LLM automation;
- live executor wiring;
- production write wiring;
- public UI changes;
- homepage changes;
- public submit flow changes;
- enabling `dry_run: false`;
- commits;
- pushes.

## 19. Recommended Next Step

Recommended next step: Gemini review of Phase 10Z.

If Phase 10Z is approved and committed/pushed, recommended next phase:

```text
Phase 11A — Candidate Extraction Manual Live Staging Contract Design
```

Phase 11A should still be docs-only contract design before any implementation.
