# Bugfix Prompt Template

## Goal

Describe the bug, expected behavior, actual behavior, and any known reproduction steps.

## Files to Inspect First

- `PROJECT_RULES.md`
- `AGENTS.md`
- Files directly involved in the failing behavior.
- Related API routes, components, utilities, data files, middleware, or tests.
- Recent docs or notes that describe the intended behavior.

## Rules

- Reproduce or reason through the bug before editing.
- Keep the fix as small and targeted as possible.
- Do not refactor unrelated code.
- Do not change UI, data shape, dependencies, or configuration unless required by the fix.
- Preserve existing behavior outside the bug.
- Add or update focused tests when practical.

## Expected Output

- The bug is fixed with minimal scope.
- The cause of the bug is identified or clearly inferred.
- Any remaining risk or unverified behavior is noted.
- No unrelated files are changed.

## Testing Checklist

- Verify the original bug scenario now works.
- Check at least one nearby normal path still works.
- Run relevant tests, linting, type checks, or build checks when appropriate.
- Inspect the final diff for unrelated edits.

## What to Explain After Changes

- Exactly what files were modified.
- The root cause or likely cause.
- How the fix addresses the bug.
- What tests or manual checks were performed.
- What should be reviewed before committing.
