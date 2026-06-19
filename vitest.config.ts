import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Exclude Playwright e2e specs — they are run via `npm run test:e2e`
    exclude: ["e2e/**", "**/node_modules/**"],
  },
});
