# CarbonPulse AI — PromptWars #1 Push

Current Rank: **#22,291 / 31,538** — bottom third. The codebase has a solid foundation but is missing critical elements across every evaluation axis. This plan targets each criterion with high-impact, concrete changes.

---

## Diagnosis: Why You're Ranked Low

| Criterion | Current State | Gap |
|---|---|---|
| **Code Quality** | `strict: false` in tsconfig, no ESLint config, no path aliases, no JSDoc on components, inconsistent module structure (3 files at root instead of `lib/`) | Judges see sloppy TS config and poor project organization |
| **Security** | No input sanitization, no CSP headers, raw `JSON.parse` with no schema validation, `window.confirm()` for destructive actions, no rate limiting on form | Zero security hardening signals |
| **Efficiency** | No `React.memo`, no `useCallback`, SVG re-renders on every state change, no dynamic imports, entire log array re-serialized on every change | Measurable perf issues |
| **Testing** | Playwright is installed but **zero test files exist**, `test-results/` is empty, no unit tests for business logic | This criterion scores near **0** |
| **Accessibility** | Missing skip-nav, no focus management, no ARIA live regions for dynamic content, poor color contrast on some labels, no keyboard trap prevention, table missing `scope` attributes | Partial a11y at best |
| **Problem Statement Alignment** | "Help individuals understand, track, and reduce their carbon footprint" — no data export, no goal-setting, no comparative insights, no onboarding, Leaderboard component exists but **isn't rendered** | Features exist but key problem-statement requirements are incomplete |

---

## Proposed Changes

### 1. Code Quality — Project Structure & TypeScript Hardening

#### [MODIFY] [tsconfig.json](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/tsconfig.json)
- Set `"strict": true` — this is the single biggest quality signal
- Add `"forceConsistentCasingInFileNames": true`
- Add `"noUncheckedIndexedAccess": true`
- Add path alias `"@/*": ["./*"]` for clean imports

#### [NEW] [lib/activityProcessing.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/activityProcessing.ts)
#### [NEW] [lib/aiCoach.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/aiCoach.ts)
#### [NEW] [lib/insightEngine.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/insightEngine.ts)
#### [NEW] [lib/constants.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/constants.ts)
#### [NEW] [lib/types.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/types.ts)
#### [NEW] [lib/storage.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/storage.ts)
- Move root-level `.ts` files into `lib/` — standard Next.js convention
- Extract shared types into `lib/types.ts`
- Extract constants (`DAILY_BASELINE_KG`, `WEEKLY_TARGET_KG`, storage keys) into `lib/constants.ts`
- Create `lib/storage.ts` for type-safe localStorage with schema validation
- Add JSDoc to all exported functions and interfaces
#### [DELETE] [activityProcessing.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/activityProcessing.ts) (moved to lib/)
#### [DELETE] [aiCoach.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/aiCoach.ts) (moved to lib/)
#### [DELETE] [insightEngine.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/insightEngine.ts) (moved to lib/)

#### [NEW] [eslint.config.mjs](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/eslint.config.mjs)
- Add ESLint flat config with `@next/eslint-plugin-next` and `typescript-eslint`
- This shows the AI judge there's a linting pipeline

---

### 2. Security — Input Validation, CSP, Safe Storage

#### [NEW] [lib/validation.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/validation.ts)
- Runtime input validation with type guards for `ActivityInput`
- Clamp numeric inputs: `distanceKm` to `[0, 1000]`, `homeEnergyKwh` to `[0, 500]`
- Sanitize string enum inputs against allowed lists
- Validate stored data shape before hydrating from `localStorage`

#### [NEW] [middleware.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/middleware.ts)
- Next.js middleware to set security headers:
  - `Content-Security-Policy` (strict, self-only)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` to disable camera/mic/geolocation

#### [MODIFY] [components/ActivityForm.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/components/ActivityForm.tsx)
- Add client-side validation with error messages per field
- Replace `window.confirm` with an accessible confirmation dialog component
- Add rate limiting (debounce rapid submits)

#### [MODIFY] [lib/storage.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/storage.ts)
- Wrap `JSON.parse` in a try-catch with schema validation
- Add `MAX_STORAGE_ENTRIES` cap (30) enforced at read time too
- Add data migration support for storage version changes

---

### 3. Efficiency — Memoization, Lazy Loading, Computation

#### [MODIFY] [app/dashboard/page.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/app/dashboard/page.tsx)
- Wrap `FootprintRing` and `TrendChart` with `React.memo`
- Memoize computed values (`weeklyTotal`, `weeklySaved`, `totalPoints`, `score`) with `useMemo`
- Wrap `handleLog` and `clearData` with `useCallback`
- Move `FootprintRing` and `TrendChart` to their own component files under `components/`
- Use `React.lazy` + `Suspense` for the `Leaderboard` component (once it's wired in)

#### [NEW] [components/FootprintRing.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/components/FootprintRing.tsx)
#### [NEW] [components/TrendChart.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/components/TrendChart.tsx)
- Extract and memoize chart components
- Add `aria-label` improvements for SVGs

#### [MODIFY] [app/layout.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/app/layout.tsx)
- Add `viewport` export for proper mobile meta tags
- Use `display: "swap"` on font for better LCP

---

### 4. Testing — Unit Tests + E2E Tests

> [!IMPORTANT]
> This is likely your **#1 scoring gap**. Playwright is installed but there are zero test files. Even basic coverage will dramatically improve rank.

#### [NEW] [lib/__tests__/activityProcessing.test.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/__tests__/activityProcessing.test.ts)
- Unit tests for `processActivity()`:
  - Walking 0 km → transport emissions = 0
  - Car 10 km → 2.1 kg CO2e
  - Vegan diet → 2.89 kg/day
  - High meat diet → 7.19 kg/day
  - Points calculation with streak
  - Below-baseline bonus
  - Edge cases: NaN inputs, negative values, missing fields

#### [NEW] [lib/__tests__/insightEngine.test.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/__tests__/insightEngine.test.ts)
- Unit tests for `generateDailyNudge()`:
  - Returns `null` for empty logs
  - Fires meatless nudge after 2+ high-meat days
  - Fires subway nudge for repeated short car trips
  - Fires bus default nudge for exclusive car use
  - Does NOT fire bus nudge when green modes present

#### [NEW] [lib/__tests__/validation.test.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/__tests__/validation.test.ts)
- Tests for input validation guards
- Tests for storage schema validation

#### [NEW] [e2e/dashboard.spec.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/e2e/dashboard.spec.ts)
- Playwright E2E tests:
  - Page loads and redirects to `/dashboard`
  - Form submission creates a log entry
  - Footprint breakdown updates with correct values
  - Reset clears all data
  - Accessibility: keyboard navigation through form
  - Responsive: viewport tests at 375px and 1440px

#### [NEW] [playwright.config.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/playwright.config.ts)
- Proper Playwright config targeting the Next.js dev server

#### [MODIFY] [package.json](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/package.json)
- Add `"test"` and `"test:e2e"` scripts
- Add `vitest` as devDependency for unit tests (lightweight, no heavy deps)

---

### 5. Accessibility — WCAG 2.1 AA Compliance

#### [NEW] [components/SkipNav.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/components/SkipNav.tsx)
- "Skip to main content" link that becomes visible on focus

#### [NEW] [components/ConfirmDialog.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/components/ConfirmDialog.tsx)
- Accessible modal dialog (focus trap, Escape to close, `role="alertdialog"`) to replace `window.confirm`

#### [MODIFY] [app/dashboard/page.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/app/dashboard/page.tsx)
- Add `id="main-content"` for skip-nav target
- Add `aria-live="polite"` region for dynamic status updates (score changes, new logs)
- Add `scope="col"` to all `<th>` elements in the history table
- Ensure all interactive elements have visible focus indicators
- Add `aria-label` to the Reset button

#### [MODIFY] [app/globals.css](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/app/globals.css)
- Add focus-visible styles for all interactive elements
- Fix low-contrast text: `#64748b` on `#07100e` fails AA — bump to `#8b9cad`
- Add `prefers-reduced-motion` media query to disable transitions
- Add `prefers-color-scheme` support in meta

#### [MODIFY] [app/layout.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/app/layout.tsx)
- Render `<SkipNav />` as first child of `<body>`

---

### 6. Problem Statement Alignment — Feature Completeness

The problem statement says: *"Help individuals **understand, track, and reduce** their carbon footprint through simple actions and personalized insights."*

#### [MODIFY] [app/dashboard/page.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/app/dashboard/page.tsx)
- **Wire in the Leaderboard component** — it exists in `components/` but is never rendered
- Add a **goal-setting section**: let users set a personal daily target (stored in localStorage) instead of the hardcoded `DAILY_BASELINE_KG = 12`
- Add a **data export button** (download logs as CSV) — shows "understand" alignment
- Add **comparative context**: show how the user's footprint compares to national/global averages

#### [NEW] [lib/exportData.ts](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/lib/exportData.ts)
- CSV export utility for activity logs
- Formats dates, transport modes, and emissions in a standard format

#### [MODIFY] [components/Leaderboard.tsx](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/components/Leaderboard.tsx)
- Fix styling to match the app's design system (currently uses unrelated `cyber-card`, `cyber-purple`, `neon-text` classes that don't exist in globals.css)
- Add accessibility: table semantics, screen reader labels

---

## Updated README

#### [MODIFY] [README.md](file:///d:/prompt%20wars/challenge%203/CarbonPlus-AI/README.md)
- Document architecture decisions
- Add testing instructions
- Add security headers documentation
- Add accessibility statement
- Add contributing guidelines section

---

## Verification Plan

### Automated Tests
```bash
# Unit tests (once vitest is installed)
npx vitest run

# Type checking with strict mode
npx tsc --noEmit

# Linting
npx next lint

# E2E tests
npx playwright test

# Production build (catches runtime issues)
npm run build
```

### Manual Verification
- Verify all pages render at 375px, 768px, and 1440px viewports
- Tab through entire UI to verify focus management
- Screen reader test with the accessible name checks
- Lighthouse audit targeting 90+ across all categories

---

## Open Questions

> [!IMPORTANT]
> **Priority**: Should I implement ALL six areas in one go, or do you want me to focus on the **highest-impact subset first** (Testing + Security + Accessibility tend to be the most differentiating in code competitions)?

> [!IMPORTANT]
> **Vitest dependency**: Adding `vitest` for unit testing adds ~2-3MB to `node_modules` but nothing to the repo since `node_modules` is gitignored. Is that acceptable given the <10MB repo constraint, or should I write tests using Node's built-in `node:test` runner instead (zero deps)?

> [!IMPORTANT]
> **Leaderboard**: The current Leaderboard uses hardcoded mock data with a completely different design language (cyber/neon vs your pulse/green theme). Should I restyle it to match your design system, or remove it entirely since it's mock data?
