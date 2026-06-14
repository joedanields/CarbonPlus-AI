# CarbonPulse

CarbonPulse is a local-first personal carbon tracker built for the challenge:

> Help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

## What works

- Log daily transport, food pattern, and home electricity use.
- Estimate carbon emissions with a native TypeScript calculation engine.
- See a category breakdown and seven-entry trend using native SVG.
- Compare each day with a personal baseline and weekly carbon budget.
- Receive behavioral nudges based on recent activity.
- Earn eco points and keep recent history in browser storage.
- Reset all local data at any time.

No account or API key is required. Personal activity data remains in the browser.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root route redirects to the dashboard.

## Validation

```bash
npm run build
npx tsc --noEmit
```

## Architecture

- Next.js App Router and React
- Tailwind CSS
- Native SVG charts
- `localStorage` persistence
- No component library, charting package, local image, font, or dataset assets

Emission results are estimates for personal guidance, not audited carbon accounting.
