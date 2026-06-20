# CarbonPulse AI — Individual Carbon Tracking, Understanding & Reduction

CarbonPulse AI is an **individual carbon footprint tracker** that empowers users to **understand**, **track**, and **actively reduce** their personal carbon emissions through **actionable, gamified insights**. Built for the PromptWars Virtual Challenge 3, CarbonPulse turns complex emission data into clear, motivating daily actions.

## 🌍 Problem Statement

Climate change demands individual action, but most people lack the tools to **understand their personal carbon footprint** or know **what actionable steps to take**. CarbonPulse AI solves this by:

1. **Tracking** individual carbon emissions across transport, diet, and home energy — the three categories that account for over 70% of a household's footprint.
2. **Understanding** emissions through relatable real-world equivalencies (e.g., "equivalent to 15 smartphone charges"), interactive SVG visualizations, and comparative benchmarks against global and national averages.
3. **Reducing** carbon output through AI-coached actionable insights, behavioral nudges grounded in Fogg's B=MAP model, and personalized weekly reduction targets.
4. **Gamifying** the reduction journey with eco-points, achievement badges, daily streaks, missions, and a competitive leaderboard — making sustainable habits engaging, not overwhelming.

## 🚀 Features — Actionable, Gamified Insights

### Carbon Tracking
- **Daily Activity Logging**: Log transport mode & distance, food pattern, and home electricity usage.
- **Emission Estimation Engine**: Native TypeScript calculation engine using DEFRA 2024/2025 and Scarborough et al. emission factors.
- **Data Portability**: Export activity logs as CSV for personal carbon analysis and understanding.

### Carbon Understanding
- **Visual Breakdown**: Interactive SVG donut chart showing per-category emission breakdown.
- **7-Day Trend Chart**: Track your emission trend over the past week with a baseline comparison line.
- **Relatable Equivalencies**: Translates abstract kg CO2e values into everyday metaphors (smartphone charges, km driven, paper sheets, forest absorption).
- **Comparative Benchmarks**: See how your daily footprint compares to global and India national averages.

### Carbon Reduction via Actionable Insights
- **AI Coach (PULSE)**: Gemini-powered coaching that analyzes your weekly data and delivers exactly 3 punchy, data-grounded sentences — one insight, one behavioral framing, one 24-hour action directive.
- **Behavioral Nudge Engine**: Automated nudges using psychological frameworks (Gamification, Loss Aversion, Salience, Commitment Consistency, Social Proof, Default Bias) triggered by your real activity patterns.
- **Pattern Analyzer**: Detects carbon leakage (e.g., reducing transport but increasing diet emissions) and alerts you.
- **Personalized Targets**: Set custom daily and weekly carbon budgets with progress tracking.

### Gamification & Engagement
- **Eco Points**: Earn points for green transport, plant-based meals, below-baseline days, and streaks.
- **Missions**: Accept behavioral challenges (Meatless Week, Transit Master, Zero Hero) with progress tracking.
- **Achievement Badges**: Unlock badges for completing missions — visible proof of your carbon reduction journey.
- **Leaderboard**: Compare your eco-points with community benchmarks to drive friendly competition.
- **Streak System**: Consecutive daily logging rewards — up to 30-day multiplier.

## 🛠️ Technical Architecture

### Core Stack
- **Framework**: Next.js 15 (App Router) with Edge Runtime for API routes
- **Styling**: Tailwind CSS 4.0
- **AI Integration**: Google Gemini 2.0 Flash via Edge API route
- **State & Persistence**: React hooks + Type-safe `localStorage` wrapper with schema validation
- **Visualizations**: Zero-dependency native SVG components (no charting libraries)

### Security & Quality
- **Runtime Validation**: Strict input clamping and schema validation for all stored data.
- **Security Headers**: CSP, X-Frame-Options, HSTS, Permissions-Policy via Next.js Middleware.
- **API Rate Limiting**: IP-based sliding-window rate limiter on the AI Coach Edge endpoint.
- **TypeScript**: Strict mode with zero `any` types and no implicit returns.
- **Accessibility (WCAG 2.1 AA)**: Skip-navigation, ARIA labels, live regions, focus management, high-contrast palette, keyboard-navigable.

## 🧪 Testing

### Unit Tests (Vitest)
Comprehensive test coverage for all core calculation utilities, AI prompt builders, mission evaluation, pattern analysis, equivalency mapping, data export, and input validation.

```bash
npm run test
```

### E2E Tests (Playwright)
Verifies critical user flows: onboarding, activity logging, data reset, CSV export, and responsive layout.

```bash
npm run test:e2e
```

## 🏃 Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root route redirects to onboarding (first visit) or dashboard (returning user).

## 📐 Validation

```bash
npm run build
npx tsc --noEmit
npm run lint
```

## ♿ Accessibility Statement

CarbonPulse AI is committed to digital inclusivity. It implements:
- Semantic HTML5 elements and comprehensive ARIA roles/labels.
- High-contrast color palette (WCAG AA compliant).
- Full keyboard navigability with visible focus indicators.
- Skip-to-content navigation link.
- `aria-live` regions for dynamic content updates.
- Reduced-motion support.

---

*Emission estimates use published average emission factors (DEFRA 2024/2025, Scarborough et al., EPA) and are intended for personal guidance and individual carbon understanding — not audited carbon accounting.*
