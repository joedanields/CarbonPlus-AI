# CarbonPulse
 
CarbonPulse is a local-first personal carbon tracker designed to help individuals understand, track, and reduce their carbon footprint through simple daily actions and personalized insights.
 
## 🚀 Features
 
- **Daily Tracking**: Log transport, food pattern, and home electricity use.
- **Carbon Estimation**: Native TypeScript calculation engine based on DEFRA 2024/2025 and EPA data.
- **Visual Insights**: Interactive category breakdown and 7-day footprint trend using optimized SVGs.
- **Behavioral Nudges**: AI-driven nudges using Fogg's B=MAP model to encourage sustainable habits.
- **Gamification**: Earn eco points for green choices and maintain streaks.
- **Personalized Goals**: Set custom daily and weekly carbon budgets.
- **Local-First**: All data is persisted in `localStorage`. No accounts, no API keys, no tracking.
- **Data Portability**: Export activity logs as CSV for personal analysis.
 
## 🛠️ Technical Architecture
 
### Core Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4.0
- **State & Persistence**: React hooks + Type-safe `localStorage` wrapper.
- **Zero External Deps**: No heavy charting libraries or UI frameworks; all visualizations are native SVGs.
 
### Security & Quality
- **Runtime Validation**: Strict input clamping and schema validation for all stored data.
- **Security Headers**: Implemented via Next.js Middleware (CSP, X-Frame-Options, HSTS).
- **TypeScript**: Configured in `strict` mode with path aliases.
- **Accessibility**: WCAG 2.1 AA compliant, featuring skip-navigation, focus management, and ARIA live regions.
 
## 🧪 Testing
 
### Unit Tests
We use **Vitest** for fast, lightweight unit testing of the emission engine and validation logic.
```bash
npm run test
```
 
### E2E Tests
We use **Playwright** to verify critical user flows (logging, resetting, responsive layouts).
```bash
npm run test:e2e
```
 
## 🏃 Run Locally
 
```bash
npm install
npm run dev
```
Open `http://localhost:3000`. The root route redirects to the dashboard.
 
## 📐 Validation
 
```bash
npm run build
npx tsc --noEmit
npm run lint
```
 
## ♿ Accessibility Statement
CarbonPulse is committed to inclusivity. It implements:
- Semantic HTML and ARIA roles.
- High-contrast color palette (AA compliant).
- Full keyboard navigability.
- Reduced-motion support.
 
---
*Estimates use published average emission factors and are intended for personal guidance, not audited carbon accounting.*
