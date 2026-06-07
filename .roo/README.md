# AiFinder Roo Setup

This folder contains project-level Roo Code guidance for AiFinder.

Roo should load the files in `.roo/rules/` as reusable project rules. These rules are documentation/configuration only and do not change application behavior.

## Recommended Structure

- `.roo/rules/00-aifinder-core.md` - project roles, source-of-truth docs, core boundaries
- `.roo/rules/10-aifinder-workflow.md` - approval, Git, CCR reporting, task separation
- `.roo/rules/20-aifinder-qa.md` - required commands, responsive QA, accessibility QA, modal QA
- `.roo/rules/30-aifinder-current-context.md` - current urgent project context and next priority

## How Roo Should Use This Setup

1. Read all `.roo/rules/*.md` files before planning or editing.
2. Check `AGENTS.md`, `GEMINI.md`, `AI_PROMPTS/`, and the QA framework docs when the task touches those areas.
3. Keep implementation work scoped to the current request.
4. Ask James before committing, pushing, applying migrations, or making security/database/auth changes outside the approved task.
5. End every task with the AiFinder CCR report format.

## Important References

- `AGENTS.md`
- `GEMINI.md`
- `AI_PROMPTS/`
- `docs/responsive-qa-framework.md`
- `docs/accessibility-qa-framework.md`
- `package.json`

