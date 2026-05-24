# Upgrade Prompt Template

## Goal

Describe the upgrade to make, why it is needed, and the desired project outcome.

## Files to Inspect First

- `PROJECT_RULES.md`
- `AGENTS.md`
- Relevant app, lib, component, API route, data, docs, or security files connected to the upgrade.
- Existing tests or testing notes that cover the affected behavior.

## Rules

- Check the project structure before editing.
- Keep changes scoped to the requested upgrade.
- Do not modify unrelated files.
- Preserve existing behavior unless the upgrade explicitly requires a change.
- Follow existing project patterns and naming conventions.
- Avoid dependency, configuration, or deployment changes unless requested.

## Expected Output

- The requested upgrade is implemented or documented.
- Modified files are limited to the upgrade scope.
- Any new files follow the existing project organization.
- Risky assumptions or incomplete areas are clearly noted.

## Testing Checklist

- Run the most relevant automated checks available for the touched area.
- Manually review affected flows when automated tests are not enough.
- Confirm there are no unrelated file changes.
- Confirm no secrets or sensitive data were added.

## What to Explain After Changes

- Exactly what files were modified or created.
- What changed in each file.
- What testing or verification was performed.
- What the project owner should review before committing.
