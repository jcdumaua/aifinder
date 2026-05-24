# UI Upgrade Prompt Template

## Goal

Describe the UI improvement, target page or component, user need, and desired visual or interaction outcome.

## Files to Inspect First

- `PROJECT_RULES.md`
- `AGENTS.md`
- Relevant app pages, layouts, components, styles, and design-system files.
- Existing screenshots, brand notes, or UI documentation when available.
- Related tests or accessibility checks.

## Rules

- Inspect existing UI patterns before editing.
- Keep the upgrade scoped to the requested screen or component.
- Do not change app logic, data flow, dependencies, or deployment behavior unless required.
- Preserve accessibility, responsive behavior, and existing navigation.
- Avoid unrelated styling churn.
- Use existing components and styling conventions where possible.

## Expected Output

- The requested UI improvement is implemented.
- The page or component remains responsive and accessible.
- Visual changes match the existing project direction.
- No unrelated app areas are changed.

## Testing Checklist

- Check desktop and mobile layouts.
- Verify text does not overlap or overflow.
- Confirm interactive elements remain usable by keyboard and pointer.
- Run relevant lint, type, or build checks when practical.
- Review the diff for unrelated app logic changes.

## What to Explain After Changes

- Exactly what files were modified.
- What changed visually or behaviorally.
- What responsive or accessibility checks were performed.
- Any remaining design decisions to review before committing.
