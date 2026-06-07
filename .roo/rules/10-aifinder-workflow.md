# AiFinder Workflow, Approval, and Reporting Rules

## Approval Rules

- Do not commit without James approval.
- Do not push without James approval.
- Never force push.
- Never run destructive Git commands without explicit approval.
- Never apply Supabase migrations automatically.
- Never make database, auth, or security changes during UI tasks unless James explicitly approves them.
- Never make UI changes during security tasks unless required for the approved security fix.

## Scope Rules

- Preserve existing UI patterns.
- Do not perform unrelated refactors.
- Keep `security-hardening-pass` separate from UI/modal work.
- Do not mix unrelated UI, security, database, or auth changes in one task or commit.
- Do not weaken validation, RLS, admin route protection, duplicate-domain checks, `normalize_tool_domain`, or `approve_submitted_tool`.
- Do not auto-publish discovered tools into `public.tools`.
- Discovery candidates must stay in `discovered_tools` until admin review.

## Git Rules

Before any commit:

1. Run `git status`.
2. Stage only files related to the approved task.
3. Report staged files to James.
4. Wait for James approval before committing.

Do not push unless James explicitly approves.

## CCR Workflow

Use the CCR workflow whenever reporting back:

1. Roo executes the requested work.
2. Roo gives James a copy/paste CCR report.
3. James pastes the report to ChatGPT.
4. ChatGPT reviews and directs next steps.

Prefer reports over screenshots unless visual UI testing is required.

## Required CCR Report Format

End tasks with this format:

```text
# CCR REPORT
## Summary
## Files Changed
## Commands Run
## Tests/Build Result
## Risks
## Next Recommended Step
```

For Roo setup tasks, also include:

```text
## Roo Setup Created
## Rules Added
## QA Standards Added
## Approval Workflow Added
## How to Use Roo After Setup
## Git Status
## Risk Level
```

