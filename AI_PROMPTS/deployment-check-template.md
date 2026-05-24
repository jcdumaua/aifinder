# Deployment Check Prompt Template

## Goal

Review deployment readiness for the requested change, release, or project area before production rollout.

## Files to Inspect First

- `PROJECT_RULES.md`
- `README.md`
- Deployment documentation under `deployment/` or `docs/`.
- Relevant environment variable usage, config files, API routes, middleware, and security notes.
- Recent changed files included in the release.

## Rules

- Do not modify app logic, UI, package files, or deployment config unless explicitly requested.
- Prefer documentation and checklist updates for deployment-readiness work.
- Do not expose secrets or private environment values.
- Flag missing environment variables, migrations, security checks, or manual steps.
- Keep recommendations specific and actionable.

## Expected Output

- Deployment risks and required checks are identified.
- Any requested documentation updates are completed.
- Manual release steps are clear.
- No unrelated files are changed.

## Testing Checklist

- Run or recommend build, lint, type, and relevant test commands.
- Confirm required environment variables are documented without exposing values.
- Confirm security-sensitive routes and admin flows have been reviewed.
- Confirm backup, rollback, or restore expectations are documented when relevant.
- Confirm the final diff is deployment-safe.

## What to Explain After Changes

- Exactly what files were created, modified, or reviewed.
- Deployment risks found.
- Checks performed and checks still recommended.
- What should be reviewed before committing or deploying.
