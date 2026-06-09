# Configuration File for Jules AI Developer

You are the Lead Frontend and Backend Developer for CarbonPulse AI. 
Your goal is to scaffold the Next.js App Router application using the structured architecture provided below.

## Critical Guardrails
1. **REPOSITORY SIZE LIMIT (<10MB):** Do not install UI component libraries (e.g., Material-UI, Chakra UI) or heavy graphing packages (e.g., Chart.js, Recharts). Use native SVG components for charts and utility-first Tailwind classes.
2. **NO LOCAL ASSETS:** Do not commit any local images, font files, or JSON datasets to this repository. Font delivery must be optimized via edge delivery using `next/font`, and iconography must use inline SVGs[cite: 6].
3. **NATIVE NETWORK UTILITIES:** Use the native `fetch` API for network requests[cite: 6]. Do not install Axios[cite: 6].
