# AiFinder QA Standards

## Required Commands

Use the available scripts in `package.json`.

For production confidence:

```bash
npm run build
```

For responsive QA:

```bash
npm run qa:responsive
```

For accessibility QA:

```bash
npm run qa:accessibility
```

For TypeScript-impacting code changes:

```bash
./node_modules/.bin/tsc --noEmit
```

When a local server is already running, use the documented `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_SKIP_WEB_SERVER=1` forms from:

- `docs/responsive-qa-framework.md`
- `docs/accessibility-qa-framework.md`

## Responsive QA Rules

Responsive fixes require checks across:

- Desktop
- Tablet
- Large tablet
- Mobile
- Foldable

Use `docs/responsive-qa-framework.md` and `testing/qa-device-matrix.ts` as the source of truth.

Responsive reports should cover:

- No horizontal scrolling
- No clipped text
- No overlapping elements
- No hidden controls
- No footer overlap
- No sticky bar overlap
- Hydration status
- Animation and reduced-motion behavior when relevant

## Modal QA Rules

Modal fixes require a full modal audit when the changed area can affect modal behavior.

Cover relevant modal surfaces:

- Tool Details Modal
- Search Results Modal
- Submit Tool Modal
- Admin Modals

Check:

- Open behavior
- Close behavior
- Internal scroll
- Keyboard interaction
- Touch interaction
- Portrait layouts
- Landscape layouts
- Desktop/tablet/mobile/foldable behavior
- Focus behavior
- Escape key behavior

## Accessibility QA Rules

Accessibility checks are required for:

- Modals
- Forms
- Navigation
- Menus

Use `docs/accessibility-qa-framework.md` as the source of truth.

Accessibility reports should cover:

- Axe setup result
- Pages tested
- Modal accessibility result
- Keyboard/focus result
- Desktop result
- Tablet result
- Mobile result
- Known accessibility gaps

Expected modal/dialog accessibility:

- Accessible dialog name
- Visible close control with useful label
- Keyboard-reachable controls
- Escape key dismissal when the dialog is dismissible
- No unlabeled buttons or links
- No horizontal overflow
- Internal scrolling for long content

