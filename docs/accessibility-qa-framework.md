# AiFinder Accessibility QA Framework

Use this framework for UI, modal, keyboard, focus, and accessibility CCR reports.
It complements `docs/responsive-qa-framework.md` and uses Playwright plus Axe.

## Commands

```bash
npm run test:accessibility-responsive-static
npm run qa:synthetic-browser:accessibility
```

The synthetic command owns its isolated temporary build and app process. It
must not run in a static-only phase or against an already running, deployed,
or public server.

`playwright.synthetic.config.ts` accepts only a loopback base URL, retains no
screenshot, trace, video, or raw console artifact, and runs with fabricated
Supabase-compatible data under strict non-loopback network denial.

## Pages Covered

- Homepage: `/`
- Submit page: `/submit`
- Compare page: `/compare`
- Chatbots category: `/category/chatbots`
- Fabricated tool detail: `/tool/synthetic-tool`
- Not found: `/this-route-does-not-exist`
- Search Results Modal
- Tool Details Modal
- Submit Tool Modal and nested status/error popup

## Checks

- Axe violations, including color contrast when Axe detects it
- Hydration warnings
- Keyboard navigation smoke checks
- Focus visibility smoke checks
- Skip link as the first keyboard stop and focus transfer to the shared target
- Initial focus, forward/reverse Tab containment, topmost Escape handling, and
  connected-opener focus restoration
- Nested search-to-tool-details ordering without closing both dialogs
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

Synthetic success is recorded as
`SYNTHETIC_BROWSER_PASSED_PRODUCTION_RUNTIME_UNVERIFIED` and remains
launch-blocking.
