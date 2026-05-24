# AiFinder Project Rules

## AI Coding Workflow

- Preserve the existing UI unless a requested change explicitly requires visual updates.
- Avoid unrelated rewrites, broad refactors, formatting churn, or file moves outside the requested scope.
- Make TypeScript-safe changes only: keep types explicit where helpful, avoid `any` unless justified, and do not bypass compiler errors.
- Prefer modular upgrades that fit the existing project structure, naming conventions, and component boundaries.
- Follow secure coding practices: protect secrets, validate inputs, avoid leaking sensitive data, and keep privileged operations server-side.
- Explain every modified file in the final response, including the purpose of each change.
- Explain required testing in the final response, including commands run and any manual checks still recommended.

## Change Discipline

- Read nearby code before editing so new work matches existing patterns.
- Keep changes small, reversible, and directly tied to the task.
- Do not modify unrelated files.
- Do not change dependencies, configuration, authentication, database access, or deployment behavior unless requested.
- When uncertain, choose the least invasive implementation that preserves current behavior.
