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
- For UI bugs, use `docs/responsive-qa-framework.md` and the shared matrix in `testing/qa-device-matrix.ts`.
- For accessibility, modal, keyboard, focus, or label bugs, also use `docs/accessibility-qa-framework.md` and run `npm run qa:accessibility`.
- For code-quality-sensitive bug fixes, review SonarLint findings in VS Code when available.
- Run relevant tests, linting, type checks, or build checks when appropriate.
- Inspect the final diff for unrelated edits.

## Responsive CCR Requirements

For UI-facing bug fixes, include:

- Desktop Result
- Tablet Result
- Large Tablet Result
- Mobile Result
- Foldable Result
- Hydration Result
- Accessibility Result
- Accessibility QA Result
- Code Quality / SonarLint Result when applicable
- Animation Result
- Responsive Issues Found

## What to Explain After Changes

- Exactly what files were modified.
- The root cause or likely cause.
- How the fix addresses the bug.
- What tests or manual checks were performed.
- Code Quality / SonarLint Result when applicable.
- What should be reviewed before committing.
