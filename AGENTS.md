<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AiFinder Codex Project Instructions

## 1. Project Overview

AiFinder is an AI tool discovery, comparison, submission, and admin-review platform.

Important current systems:
- Public tools directory
- Admin dashboard
- `submitted_tools` review workflow
- `discovered_tools` discovery queue
- Project AiFinder Security
- Standardized category taxonomy

## 2. Workflow Rules

- Use CCR Workflow whenever reporting back: Codex executes -> Codex gives COPY/PASTE REPORT -> user pastes report to ChatGPT -> ChatGPT reviews.
- Prefer reports over screenshots unless visual UI testing is required.
- When asked for a report, include clear sections and raw command outputs when relevant.

## 3. Terminal/Git Rules

- Codex should handle terminal commands when possible.
- Never force push.
- Never run destructive Git commands without explicit approval.
- Before commits, run `git status`.
- Stage only files related to the requested task.
- Do not mix unrelated UI/security/database changes in one commit.
- Always report staged files before committing.

## 4. Database/Supabase Rules

- Never apply migrations automatically unless explicitly approved.
- For migrations:
  - Create migration.
  - Review migration.
  - Provide rollback SQL.
  - Verify dependencies.
  - Commit/push.
  - Apply manually in Supabase SQL Editor only after approval.
- Never auto-publish discovered tools into `public.tools`.
- Discovery candidates must stay in `discovered_tools` until admin review.

## 5. Security Rules

- Preserve Project AiFinder Security protections.
- Reuse `lib/tool-validation.ts` and `lib/tool-categories.ts`.
- Preserve `normalize_tool_domain` and `approve_submitted_tool` workflow.
- Do not bypass duplicate-domain database protections.
- Do not weaken validation, RLS, or admin route protection.

## 6. Category Rules

Standard categories:
- Chatbots
- Image AI
- Video AI
- Voice AI
- Writing
- Coding
- Business
- Productivity
- Education AI
- Marketing AI
- SEO AI
- Design AI
- AI Agents

Do not introduce new category strings without approval.

## 7. Testing Rules

- For TypeScript/code changes, run:
  `./node_modules/.bin/tsc --noEmit`
- For production confidence, run:
  `npm run build`
- For UI changes, tell the user what to test on:
  - Desktop
  - iPad
  - Mobile
  - Admin pages
  - Public pages

## 8. Current Milestones

- Project AiFinder Security deployed
- Category taxonomy standardized
- Discovery Engine Phase 1 schema deployed
- `security-release-complete` tag exists

## 9. Report Format

At the end of tasks, provide:

```text
# CCR REPORT
## Summary
## Files Changed
## Commands Run
## Tests/Build Result
## Risks
## Next Recommended Step
```
