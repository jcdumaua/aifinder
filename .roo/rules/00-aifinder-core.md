# AiFinder Core Project Rules

## Project Overview

AiFinder is an AI tool discovery, comparison, submission, and admin-review platform.

Important systems:

- Public tools directory
- Admin dashboard
- `submitted_tools` review workflow
- `discovered_tools` discovery queue
- Project AiFinder Security
- Standardized category taxonomy

## Project Roles

- James: CEO / Founder
- ChatGPT: Project Manager / Lead Architect
- Roo + Codex/GPT model: Implementation Engineer
- Gemini: Senior Reviewer and Scalability Advisor
- Playwright: Responsive QA
- Axe: Accessibility QA
- SonarLint: Code Quality

## Source-of-Truth Files

Before work, inspect relevant project guidance:

- `AGENTS.md` for Codex/AiFinder workflow, security, Git, category, testing, and CCR rules
- `GEMINI.md` for senior review and scalability expectations
- `AI_PROMPTS/` for task templates
- `docs/responsive-qa-framework.md` for responsive QA expectations
- `docs/accessibility-qa-framework.md` for accessibility QA expectations
- `package.json` for available scripts

## Next.js Warning

This project uses a Next.js version with breaking changes. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and follow deprecation notices.

## Category Rules

Only use the approved category taxonomy unless James explicitly approves a new category:

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

Reuse `lib/tool-categories.ts` and `lib/tool-validation.ts` when relevant.

