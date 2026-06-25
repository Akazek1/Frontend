import { defineConfig, devices } from "@playwright/test";

/**
 * PWA runtime smoke tests.
 *
 * IMPORTANT: the service worker is disabled in `next dev` (see next.config.ts
 * `disable: NODE_ENV === "development"`), so these tests MUST run against a
 * production build:
 *
 *   npm run build && npm run start    # in one terminal, or let webServer do it
 *   npm run test:e2e
 *
 * Service workers only register over https or http://localhost — localhost is
 * treated as a secure context, so the default baseURL below works.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    // Dedicated port: a `next dev` server on :3000 has no service worker, so
    // running the e2e there silently fails. :3100 keeps the PWA suite isolated
    // from any dev server and makes CI deterministic.
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Builds + serves the production app unless a server is already running.
  webServer: {
    command: "npm run build && npm run start -- --port 3100",
    url: process.env.E2E_BASE_URL || "http://localhost:3100",
    // Cold CI runners build Next from scratch — give it room.
    timeout: 360_000,
    reuseExistingServer: !process.env.CI,
  },
});
