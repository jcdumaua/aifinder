# AiFinder Future Roadmap Ideas

## Status / Scope

This document is a future idea vault and project memory expansion for AiFinder.

Nothing in this document is implemented, approved for implementation, scheduled, or committed to a release. Ideas here are future/non-committed concepts only. An idea becomes actionable only if James later promotes it into a real phase document with scope, boundaries, review gates, verification requirements, and explicit approval.

This file must not be used as direct implementation authority.

## Status Labels

- `Dream`: speculative idea; useful to remember, not yet evaluated.
- `Research`: worth investigating; requires discovery, constraints, and feasibility review.
- `Candidate`: plausible future direction; needs a written plan and review before implementation.
- `Ready`: concept is mature enough to draft a formal phase or implementation plan, but still not approved for implementation.
- `Archived`: intentionally parked, replaced, or not worth pursuing now.

## Global Guardrails

- Do not treat roadmap ideas as approved work.
- Do not implement from this file directly.
- Do not add schema, migrations, generated types, API routes, UI, automation, model behavior, infrastructure, or operational processes from this file without a separate approved phase.
- Do not expose secrets, credentials, raw user data, raw discovery payloads, private operational data, or unsafe raw artifacts.
- Preserve human approval gates for commits, pushes, migrations, deployments, public publishing, and destructive actions.
- Keep future systems admin-safe, human-reviewable, auditable, reversible, and scoped.
- Lovable may be used only for prototyping, design exploration, and validation. It must not replace AiFinder’s production Next.js codebase or bypass the GitHub/Vercel review workflow.

## Long-Term Roadmap Order

### `Candidate` — Preferred strategic sequence

Current preferred long-term order:

```text
Discovery Engine
→ Security Hardening
→ Stability & QA
→ Production Readiness
→ Visual Identity Upgrade
→ Research Layer
```

Interpretation:

- Discovery Engine remains the current priority until V1 is complete.
- Security hardening follows Discovery V1 so the data intake, staging, review, and approval boundaries are protected before scale.
- Stability and QA should consolidate reliability, regression coverage, manual QA flows, and release discipline.
- Production readiness should focus on operational posture, monitoring, incident handling, backup/restore, and deployment confidence.
- Visual Identity Upgrade should come after the product foundation is stable enough to preserve quality through redesign.
- Research Layer should build on a mature, reliable public catalog and reviewed Discovery workflow.

This order is directional, not binding. Any item can be reprioritized by James through a future real phase plan.

### `Research` — Dependency map

Future planning should map dependencies between roadmap tracks:

- Discovery Engine V1 before automated source expansion.
- Candidate staging before candidate extraction writes.
- Duplicate safety before promotion.
- Human review before public publishing.
- Security hardening before broader automation.
- Stable QA baseline before major visual redesign.
- Public-safe catalog quality before research/model layers.

## AiFinder Development Orchestrator

### `Dream` — Local project conductor

An AiFinder-specific development orchestrator that coordinates ChatGPT, Codex, Gemini, terminal checks, docs, commits, and release gates around the existing CCR workflow.

Possible responsibilities:

- read the current phase brief;
- verify repo status and branch;
- suggest the next safe command;
- track hard boundaries;
- assemble CCR report skeletons;
- maintain phase timelines;
- flag missing Gemini/James gates;
- remind the operator when checks, screenshots, manual QA, or review gates are required.

Hard boundary: the orchestrator must preserve human approval gates for commit and push. It must never auto-commit, auto-push, auto-apply migrations, auto-deploy, or auto-publish without explicit James approval.

### `Research` — Phase state machine

Explore whether AiFinder phases can be modeled as a state machine:

- draft;
- implementation;
- verification;
- Gemini review;
- James approval;
- commit-approved;
- pushed;
- closed;
- blocked.

The goal is operational clarity, not automation-first execution.

### `Candidate` — CCR generator assistant

A future local/admin tool that generates CCR skeletons from command outputs and git status while requiring human verification before sharing.

Required boundaries:

- no secrets;
- no raw database dumps;
- no hidden edits;
- no auto-commit;
- no auto-push;
- no automatic external messaging.

## Email Approval Workflow

### `Dream` — Email-based approval inbox

Create a structured email approval workflow for review checkpoints, such as:

- Gemini review requested;
- James approval requested;
- migration approval requested;
- deployment approval requested;
- rollback approval requested;
- public publishing approval requested.

Each email would include a safe summary, affected files, verification results, risks, and required approval wording.

### `Research` — Approval audit trail

Investigate whether approval emails should be stored as:

- local docs artifacts;
- GitHub issue comments;
- admin audit records;
- external email-only records;
- project memory summaries.

Constraints:

- no secrets in approval emails;
- no raw cookies, session tokens, or CSRF values;
- no raw database dumps;
- no raw discovery payloads;
- no one-click destructive actions;
- no ambiguous approval wording for migrations, pushes, deletes, or public publishing.

### `Candidate` — Migration approval template

Create a standardized email template for database changes:

- migration summary;
- exact SQL file path;
- rollback SQL path;
- RLS implications;
- generated type implications;
- verification checklist;
- apply instructions;
- explicit “do not apply until approved” language;
- final approval wording.

## AiFinder Assistant

### `Dream` — Public discovery guide

A public-facing assistant that helps users find AI tools from the AiFinder catalog using filters, comparisons, and plain-language questions.

Boundaries:

- use approved public-safe tool data only;
- do not hallucinate unlisted tools as AiFinder records;
- do not expose admin, discovery, candidate staging, submission, or audit data;
- keep recommendations explainable and clearly sourced;
- avoid paid placement or ranking semantics unless separately designed and disclosed.

### `Research` — Admin copilot

An admin-only assistant for moderation and discovery review.

Potential tasks:

- summarize safe candidate fields;
- explain duplicate advisory signals;
- draft bounded rejection notes;
- identify missing metadata;
- help navigate Discovery Engine phases;
- produce safe CCR skeletons.

Hard boundary: no auto-approval, auto-publish, direct database mutation, hidden action execution, or bypass of review gates.

### `Candidate` — Compare-page helper

An assistant attached to `/compare` that explains differences between selected tools using only public-safe fields.

Initial scope should be read-only and deterministic before any AI generation is considered.

## Specialized AiFinder Model

### `Dream` — AiFinder-specific retrieval model

Train or tune a specialized retrieval/ranking layer for AI tool discovery after the catalog and taxonomy mature.

Potential uses:

- semantic search;
- duplicate detection assistance;
- category hinting;
- user-intent matching;
- public-safe comparison summaries.

Boundaries:

- no automatic public ranking changes without review;
- no hidden paid placement behavior;
- no training on secrets, private admin data, raw discovery payloads, cookies, or session data;
- no direct candidate approval;
- no public publishing authority.

### `Research` — Embeddings for public-safe catalog search

Evaluate whether embeddings could improve search relevance while preserving existing exact/category/platform filters.

Required research:

- cost;
- latency;
- explainability;
- stale embedding refresh;
- public-safe source fields only;
- fallback behavior when embedding search fails;
- evaluation against known useful searches and noisy false positives.

### `Archived` — Model-managed publishing

Do not pursue any model that autonomously approves, publishes, ranks, or edits public tool records.

Reason: it conflicts with AiFinder’s human-approved public catalog model.

## Discovery Engine V2

### `Ready` — V1 completion remains current priority

Discovery Engine remains the current priority until V1 is complete.

V1 should finish the safe path before V2 begins:

- bounded evidence acquisition;
- reviewed candidate staging schema;
- normalizer implementation;
- migration apply and generated type refresh only after approval;
- safe candidate staging writes;
- duplicate advisory checks;
- admin review UI;
- audit visibility;
- smoke tests;
- no direct `public.tools` writes.

### `Candidate` — Candidate extraction after staging contract

Future Discovery Engine V2 can build on the dedicated staging-table direction documented across Phases 8F–8K.

Potential sequence:

1. migration apply review;
2. generated type refresh;
3. safe normalizer implementation;
4. normalizer tests;
5. staging insert service plan;
6. duplicate advisory plan;
7. admin review UI plan;
8. promotion-to-Discovery-Queue plan;
9. separate approval/publish workflow plan.

Current status: candidate extraction remains not implementation-ready until staging schema apply, generated types, normalizer implementation, duplicate rules, and review workflow are approved.

### `Research` — Source expansion model

Explore safe source expansion beyond manual curated URLs:

- vetted launch directories;
- RSS feeds;
- partner-submitted feeds;
- public APIs with clear terms;
- manually approved source registries.

Avoid:

- broad open-web crawling;
- login-only scraping;
- aggressive crawling;
- social scraping without review;
- scheduler/cron automation without a separate safety plan.

## Security Hardening

### `Candidate` — Discovery security review checkpoint

After Discovery V1 is complete, run a focused security hardening track around:

- admin route boundaries;
- CSRF behavior;
- service-role usage;
- RLS posture;
- candidate staging exposure;
- audit metadata safety;
- unsafe payload rejection;
- migration/rollback procedures;
- source intake constraints.

This is a future review track, not a current implementation commitment.

### `Research` — Security regression checklist

Create a recurring checklist for:

- no direct public reads of staging tables;
- no raw payload persistence;
- no direct public tool publishing;
- no auto-approval;
- no exposed secrets in logs, emails, CCRs, or docs;
- no unsafe generated type drift.

## Stability & QA

### `Candidate` — Regression QA baseline

After Discovery V1 and security hardening, define a stability baseline:

- `npm run check`;
- targeted unit tests;
- normalizer tests;
- migration verification;
- admin manual smoke tests;
- public homepage/search/compare spot checks;
- mobile/tablet/desktop QA checklists.

### `Research` — QA evidence archive

Explore a lightweight docs-only archive for:

- smoke test runs;
- manual QA notes;
- known warnings;
- accepted build notes;
- recurring checks;
- rollback notes.

This should avoid screenshots or artifacts containing secrets, cookies, tokens, raw database data, or private admin context.

## Production Readiness

### `Research` — Operational readiness gate

Before broader launch or automation, define production readiness expectations:

- backup and restore posture;
- migration apply protocol;
- rollback protocol;
- deployment checklist;
- monitoring/alerting needs;
- admin access recovery;
- incident response notes;
- data retention policy.

### `Candidate` — Release gate checklist

A release gate checklist could standardize:

- branch status;
- diff summary;
- tests/build;
- manual QA;
- migration state;
- generated type state;
- Gemini review;
- James approval;
- commit/push/deploy boundaries.

## Visual Identity Upgrade

### `Dream` — Premium visual refresh

After Discovery V1, security hardening, stability, and production readiness, explore a visual identity upgrade for AiFinder.

Potential directions:

- stronger brand system;
- refined typography;
- more polished tool cards;
- cleaner comparison layouts;
- stronger category landing pages;
- improved empty states;
- stronger admin/public visual distinction.

Boundary: visual refresh must not weaken search quality, public-safe data boundaries, accessibility, performance, or admin workflows.

### `Research` — Lovable-assisted design validation

Lovable can be used for rapid prototyping and design validation only.

Allowed uses:

- rough visual concepts;
- alternate landing page explorations;
- component inspiration;
- copy/layout experiments;
- stakeholder design review.

Not allowed:

- replacing the production Next.js codebase;
- bypassing GitHub review;
- bypassing Vercel deployment workflow;
- bypassing security review;
- committing generated code directly without inspection;
- using Lovable as the source of truth for production architecture.

### `Candidate` — Design system audit

Before any major visual implementation, audit:

- typography;
- spacing;
- colors;
- responsive behavior;
- card/list density;
- accessibility;
- loading/empty/error states;
- admin vs public visual boundaries.

## Research Layer

### `Dream` — Public research layer

A research layer could eventually help users evaluate tools with richer context:

- market positioning;
- use-case clusters;
- public benchmark summaries;
- pricing-pattern comparisons;
- public changelog summaries;
- public-safe source references.

Boundaries:

- research content must be sourced and explainable;
- no hidden ranking or paid placement;
- no private/admin/discovery candidate data;
- no LLM-generated claims without review;
- no medical, legal, financial, or high-stakes recommendations without strict source policy.

### `Research` — Research ingestion policy

Before adding a research layer, define:

- allowed source types;
- citation requirements;
- update cadence;
- stale content handling;
- manual review needs;
- public-safe storage fields;
- LLM/no-LLM decision boundary.

### `Candidate` — Tool research cards

Future public tool pages could include reviewed research cards:

- best for;
- limitations;
- pricing notes;
- integrations;
- alternatives;
- source links.

This must remain separate from unreviewed Discovery candidate data.

## NAS / Local Infrastructure

### `Dream` — Local AiFinder lab

Set up a local/NAS-backed AiFinder lab for safe experimentation outside production.

Possible uses:

- local backups of docs and CCRs;
- project memory snapshots;
- model experiment artifacts;
- screenshot/archive storage for approved research only;
- local search/index experiments;
- phase history snapshots.

### `Research` — Private artifact storage policy

Before storing artifacts locally or on NAS, define:

- what can be stored;
- what must never be stored;
- retention windows;
- encryption expectations;
- access control;
- backup policy;
- deletion process.

Never store secrets, cookies, raw private user data, unsafe discovery payloads, raw admin session data, or unreviewed raw HTML by default.

### `Candidate` — Local observability dashboard

A local-only dashboard for developer operations:

- branch status;
- recent checks;
- open phases;
- pending reviews;
- local dev server notes;
- manual QA checklists;
- commit/push status.

No production secrets, database dumps, cookies, tokens, or raw discovery payloads should be displayed.

## Project Memory System

### `Candidate` — Structured phase memory

Maintain a structured memory system for AiFinder phases:

- phase name;
- objective;
- files changed;
- verification commands;
- commit hash;
- push status;
- Gemini review status;
- James approval status;
- risks;
- next recommended phase.

This could remain docs-only or become a local index later.

### `Research` — Decision log

Create a durable decision log for architectural choices, such as:

- why static evidence stayed raw-HTML-free;
- why dedicated candidate staging was preferred;
- why direct `public.tools` writes are forbidden;
- why homepage controls require Draft → Preview → Publish;
- why migrations require Gemini and James approval;
- why Lovable is limited to prototype/design validation.

### `Dream` — Context pack generator

A local tool that produces safe context packs for ChatGPT/Codex/Gemini handoffs:

- recent phase summaries;
- relevant docs list;
- current branch status;
- active constraints;
- known warnings;
- next action.

It must never include secrets, cookies, tokens, raw database dumps, private admin session data, raw discovery payloads, or unsafe artifacts.

## Idea Intake Template

Use this lightweight format for future additions:

```text
### `Status` — Idea name

Short description.

Why it might matter:
- ...

Required gates:
- ...

Hard boundaries:
- ...
```

## Parking Lot

### `Archived` — Fully autonomous discovery-to-publish pipeline

Do not pursue a fully autonomous pipeline that crawls, extracts, approves, and publishes tools without human review.

Reason: it conflicts with AiFinder’s safety model, public catalog quality bar, duplicate protections, and approval workflow.

### `Archived` — Raw payload archive by default

Do not store raw discovery payloads, raw HTML, raw metadata dumps, headers, cookies, or transport bodies by default.

Reason: unnecessary privacy, security, retention, and review risk.
