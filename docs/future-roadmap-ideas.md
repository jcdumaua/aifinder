# AiFinder Future Roadmap Ideas

## Status / Scope

This document is a future idea vault for AiFinder. It captures non-committed concepts only.

Nothing in this document is implemented, approved for implementation, scheduled, or committed to a release. Each idea requires separate review, scoping, security analysis, Gemini review where appropriate, implementation planning, verification, and James approval before any code, schema, API, UI, infrastructure, model, automation, or operational change begins.

## Status Labels

- `Dream`: speculative idea; useful to remember, not yet evaluated.
- `Research`: worth investigating; requires discovery, constraints, and feasibility review.
- `Candidate`: plausible future direction; needs a written plan and review before implementation.
- `Ready`: concept is mature enough to draft a formal implementation plan, but still not approved for implementation.
- `Archived`: intentionally parked, replaced, or not worth pursuing now.

## Guardrails

- Do not treat roadmap ideas as approved work.
- Do not implement from this file directly.
- Do not add schema, migrations, generated types, API routes, UI, automation, model behavior, or infrastructure from this file without a separate approved phase.
- Do not expose secrets, credentials, raw user data, raw discovery payloads, or private operational data.
- Keep future systems admin-safe, human-reviewable, auditable, reversible, and scoped.

## AiFinder Development Orchestrator

### `Dream` — Local project conductor

An AiFinder-specific development orchestrator that coordinates ChatGPT, Codex, Gemini, terminal checks, docs, commits, and release gates around the existing CCR workflow.

Possible responsibilities:

- read the current phase brief;
- verify repo status and branch;
- suggest the next safe command;
- track hard boundaries;
- assemble CCR reports;
- maintain a phase timeline;
- flag missing Gemini/James gates before commits or pushes.

Non-goal: replacing James approval or bypassing human review.

### `Research` — Phase state machine

Explore whether AiFinder phases can be modeled as a state machine:

- draft;
- implementation;
- verification;
- Gemini review;
- commit-approved;
- pushed;
- closed;
- blocked.

The goal would be operational clarity, not automation-first execution.

### `Candidate` — CCR generator assistant

A future admin/local tool that generates CCR skeletons from command outputs and git status while forcing a human to verify the content before sharing.

## Email Approval Workflow

### `Dream` — Email-based approval inbox

Create a structured email approval workflow for review checkpoints, such as:

- Gemini review requested;
- James approval requested;
- migration approval requested;
- publish approval requested;
- rollback approval requested.

Each email would include a safe summary, affected files, verification results, risks, and a required approval phrase.

### `Research` — Approval audit trail

Investigate whether approval emails should be stored as:

- local docs artifacts;
- admin audit records;
- GitHub issue comments;
- external email-only records.

Key constraints:

- no secrets in approval emails;
- no raw database dumps;
- no raw discovery payloads;
- no one-click destructive actions.

### `Candidate` — Migration approval template

Create a standardized email template for database changes:

- migration summary;
- exact SQL file path;
- rollback SQL path;
- RLS implications;
- generated type implications;
- verification checklist;
- final approval wording.

## AiFinder Assistant

### `Dream` — Public discovery guide

A public-facing assistant that helps users find AI tools from the AiFinder catalog using filters, comparisons, and plain-language questions.

Boundaries:

- use approved public-safe tool data only;
- do not hallucinate unlisted tools as AiFinder records;
- do not expose admin/discovery/submission data;
- keep recommendations explainable and clearly sourced.

### `Research` — Admin copilot

An admin-only assistant for moderation and discovery review.

Potential tasks:

- summarize safe candidate fields;
- explain duplicate signals;
- draft rejection notes;
- identify missing metadata;
- help navigate Discovery Engine phases.

Hard boundary: no auto-approval, auto-publish, direct database mutation, or hidden action execution.

### `Candidate` — Compare-page helper

An assistant attached to `/compare` that explains differences between selected tools using only public-safe fields.

Initial scope could be read-only and deterministic before any AI generation is considered.

## Specialized AiFinder Model

### `Dream` — AiFinder-specific retrieval model

Train or tune a specialized retrieval/ranking layer for AI tool discovery after the catalog and taxonomy mature.

Potential uses:

- semantic search;
- duplicate detection assistance;
- category hinting;
- user-intent matching.

Boundaries:

- no automatic public ranking changes without review;
- no hidden paid placement behavior;
- no training on secrets or private admin data;
- no direct candidate approval.

### `Research` — Embeddings for public-safe catalog search

Evaluate whether embeddings could improve search relevance while preserving existing exact/category/platform filters.

Required research:

- cost;
- latency;
- explainability;
- stale embedding refresh;
- public-safe source fields only;
- fallback behavior when embedding search fails.

### `Archived` — Model-managed publishing

Do not pursue any model that autonomously approves, publishes, ranks, or edits public tool records.

Reason: conflicts with AiFinder’s human-approved public catalog model.

## Discovery Engine V2

### `Candidate` — Candidate extraction after staging schema

Future Discovery Engine V2 can build on the dedicated staging-table direction documented in Phase 8F and Phase 8G.

Potential sequence:

1. exact migration plan;
2. dedicated staging table;
3. generated type refresh;
4. safe insert normalizer;
5. admin review UI;
6. duplicate detection;
7. promotion-to-Discovery-Queue plan;
8. separate approval/publish workflow.

Current status: candidate extraction remains not implementation-ready until the staging schema, duplicate rules, and review workflow are approved.

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

### `Ready` — Static evidence foundations

Static evidence acquisition, static-derived evidence review, and audit timeline visibility are already documented through the current Discovery Engine phases. These remain foundations for future candidate extraction planning, not extraction itself.

## NAS / Local Infrastructure

### `Dream` — Local AiFinder lab

Set up a local/NAS-backed AiFinder lab for safe experimentation outside production.

Possible uses:

- local backups of docs and CCRs;
- model experiment artifacts;
- screenshot/archive storage for approved research only;
- local search/index experiments;
- phase history snapshots.

### `Research` — Private artifact storage policy

Before storing any artifacts locally or on NAS, define:

- what can be stored;
- what must never be stored;
- retention windows;
- encryption expectations;
- access control;
- backup policy;
- deletion process.

Never store secrets, cookies, raw private user data, unsafe discovery payloads, or unreviewed raw HTML by default.

### `Candidate` — Local observability dashboard

A local-only dashboard for developer operations:

- branch status;
- recent checks;
- open phases;
- pending reviews;
- local dev server notes;
- manual QA checklists.

No production secrets or database dumps should be displayed.

## Project Memory

### `Candidate` — Structured phase memory

Maintain a structured memory system for AiFinder phases:

- phase name;
- objective;
- files changed;
- verification commands;
- commit hash;
- push status;
- Gemini review status;
- risks;
- next recommended phase.

This could remain docs-only or become a local index later.

### `Research` — Decision log

Create a durable decision log for architectural choices, such as:

- why static evidence stayed raw-HTML-free;
- why dedicated candidate staging was preferred;
- why direct `public.tools` writes are forbidden;
- why homepage controls require Draft -> Preview -> Publish;
- why migrations require Gemini and James approval.

### `Dream` — Context pack generator

A local tool that produces safe context packs for ChatGPT/Codex/Gemini handoffs:

- recent phase summaries;
- relevant docs list;
- current branch status;
- active constraints;
- known warnings;
- next action.

It must never include secrets, cookies, tokens, raw database dumps, private admin session data, or unsafe raw payloads.

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
