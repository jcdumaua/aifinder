# AiFinder Accessibility QA Framework

Use this framework for UI, modal, keyboard, focus, and accessibility CCR reports.
It complements `docs/responsive-qa-framework.md` and uses Playwright plus Axe.

## Commands

```bash
npm run build
npm run qa:accessibility
```

Use this form when a built server is already running:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 PLAYWRIGHT_SKIP_WEB_SERVER=1 npm run qa:accessibility
```

The accessibility config is `playwright.accessibility.config.ts`. It runs
against a focused matrix:

- Desktop: 1440x900
- iPad portrait: 768x1024
- iPad landscape: 1024x768
- Mobile: iPhone 15, 393x852

## Pages Covered

- Homepage: `/`
- Submit page: `/submit`
- Admin login page: `/admin-login`
- Compare page: `/compare`
- Search Results Modal
- Tool Details Modal
- Submit Tool Modal

## Checks

- Axe violations, including color contrast when Axe detects it
- Hydration warnings
- Keyboard navigation smoke checks
- Focus visibility smoke checks
- Dialog accessible names
- Button and link labels
- Escape key behavior for dismissible modals

## Modal Expectations

Modal and dialog surfaces should have:

- Accessible dialog name
- Visible close control with a useful label
- Keyboard-reachable controls
- Escape key dismissal when the dialog is dismissible
- No unlabeled buttons or links
- No horizontal overflow
- Internal scrolling for long content

## CCR Accessibility Sections

Every UI-facing accessibility CCR should include:

- Axe setup result
- Pages tested
- Modal accessibility result
- Keyboard/focus result
- Desktop result
- Tablet result
- Mobile result
- Accessibility QA result
- Known accessibility gaps
