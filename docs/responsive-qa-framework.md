# AiFinder Responsive QA Framework

Use this framework for future UI, modal, layout, hydration, accessibility, and animation CCR reports. The reusable device source lives in `testing/qa-device-matrix.ts`; Playwright consumes that matrix through `playwright.config.ts`.

## Commands

```bash
npm run qa:responsive
npm run build
npm run lint
```

Use `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 PLAYWRIGHT_SKIP_WEB_SERVER=1 npm run qa:responsive` when a server is already running.

## Device Matrix

### Desktop

- 1280x720
- 1366x768
- 1440x900
- 1920x1080

### Tablet

- iPad Mini portrait: 768x1024
- iPad Mini landscape: 1024x768
- iPad Air / Pro 11 portrait: 834x1194
- iPad Air / Pro 11 landscape: 1194x834

### Large Tablet

- iPad Pro 12.9 portrait: 1024x1366
- iPad Pro 12.9 landscape: 1366x1024
- Android Tablet portrait: 800x1280
- Android Tablet landscape: 1280x800

### Mobile

- iPhone SE: 375x667
- iPhone 15: 393x852
- iPhone 15 Pro Max: 430x932
- Pixel 8: 412x915

### Foldable

- Galaxy Fold Closed: 344x882
- Galaxy Fold Open portrait: 673x841
- Galaxy Fold Open landscape: 841x673
- Pixel Fold portrait: 485x998
- Pixel Fold landscape: 998x485

## Layout Checks

- No horizontal scrolling
- No clipped text
- No overlapping elements
- No hidden controls
- No footer overlap
- No sticky bar overlap

## Modal Checks

Cover Tool Details Modal, Search Results Modal, Submit Tool Modal, and Admin Modals when the changed area affects them.

- Open
- Close
- Internal scroll
- Keyboard interaction
- Touch interaction
- Portrait
- Landscape

## Hydration Checks

Report hydration status separately for:

- Desktop Chrome
- iPad Chrome
- iPad Safari
- Mobile Chrome
- Mobile Safari

## Accessibility Checks

- Axe scan
- Focus trap
- Escape key
- Keyboard navigation
- Screen reader labels

## Animation Checks

- Modal open animation
- Modal close animation
- Scroll behavior
- Reduced motion mode

## CCR Responsive Sections

Every future UI CCR should include:

- Desktop Result
- Tablet Result
- Large Tablet Result
- Mobile Result
- Foldable Result
- Hydration Result
- Accessibility Result
- Animation Result
- Responsive Issues Found
