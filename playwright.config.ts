import { defineConfig } from '@playwright/test';

// Playwright is scoped to e2e tests only and will NOT manage the dev server.
// It connects to an already running server via baseURL and uses a quiet reporter.
export default defineConfig({
  testDir: './e2e',
  reporter: 'dot',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
    video: 'off',
    screenshot: 'off',
    trace: 'off',
  },
});
