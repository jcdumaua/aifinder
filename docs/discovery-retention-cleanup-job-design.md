# AiFinder Discovery Retention Cleanup Job Design

## Status

Planning only. Cleanup automation is not approved yet.

## Purpose

AiFinder needs a safe cleanup design before high-volume crawler automation starts. The cleanup system must prevent database and storage bloat while preserving review history, evidence needed for admin decisions, and audit accountability.

This document defines the intended cleanup boundaries and safety model only. It does not approve cleanup automation, crawler automation, workers, cron jobs, delete scripts, API changes, or schema changes.

## Cleanup Principles

- Never delete `new` or `pending_review` candidates.
- Never delete live approved tools from `public.tools`.
- Never delete audit logs casually.
- Cleanup must be exact, reviewed, logged, and reversible where possible.
- Prefer dry-run mode before destructive cleanup.
- Cleanup should run only after retention policy review.

## Data Covered

- `discovery_runs`
- `discovered_tools`
- `discovery_evidence`
- `discovery_duplicate_candidates`
- `discovery_audit_events`
- Future raw HTML artifacts
- Future screenshots

## Proposed Retention Rules

Use the existing Discovery Engine retention policy:

- Completed runs: keep 90 days.
- Failed runs: keep 180 days.
- Running/pending runs: never delete while active.
- Approved discovered tool history: keep 1 year.
- Duplicate candidates: keep 180 days.
- Rejected/ignored candidates: keep 90 days.
- Evidence for active candidates: keep.
- Evidence for approved candidates: keep 180 days.
- Evidence for duplicate/rejected/ignored candidates: keep 90 days.
- Audit events: keep at least 1 year during MVP, preferably 2 years once crawler automation is active.
- Raw HTML/screenshots later: keep 30-90 days.

## Cleanup Safety Design

- Dry-run first.
- Batch deletion limits.
- Source/run/candidate counts before and after.
- Admin-only execution.
- Service-role-only backend execution.
- Audit event written for each cleanup run.
- Never clean records newer than a safety buffer, such as 7 days.
- Delete child records before parent records when cascade is not enough.
- Stop cleanup if unexpected row counts are detected.

## Suggested Cleanup Flow

A future cleanup flow should:

1. Start cleanup run.
2. Calculate eligible records.
3. Print/report dry-run counts.
4. Require admin confirmation.
5. Delete eligible evidence/artifacts.
6. Delete eligible duplicate candidates if needed.
7. Delete eligible reviewed discovered tools.
8. Delete eligible old runs.
9. Write cleanup audit event.
10. Return cleanup summary.

## Manual First, Scheduled Later

The MVP should start with manual admin-triggered cleanup. Scheduled cleanup can come later after multiple safe manual runs prove that eligibility rules, dry-run output, audit logging, and row-count safeguards are reliable.

Do not add hourly or daily cleanup in the first version.

## Risks

- Accidental deletion of active review data.
- Loss of audit/debug history.
- Storage bloat if cleanup is delayed too long.
- Crawler high-volume writes increasing cleanup urgency.

## Required Before Implementation

- Gemini review of cleanup design.
- Confirm cascade behavior.
- Confirm audit event format for cleanup actions.
- Decide dry-run output format.
- Decide admin confirmation UI/API.
- Decide storage bucket cleanup strategy.
- Add tests before any destructive cleanup code.

## Future Phases

- Phase 6D: Manual-trigger crawler prototype design.
- Phase 6E: Gemini review before crawler implementation.
- Future phase: Manual cleanup job implementation.
- Future phase: Scheduled cleanup job implementation after manual cleanup is proven safe.
