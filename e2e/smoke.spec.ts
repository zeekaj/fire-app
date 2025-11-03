import { test, expect } from '@playwright/test';

// This test assumes a dev server is already running at baseURL. If not, it quietly skips.

test('app renders title without managing server', async ({ page }) => {
  // Pre-check server reachability using the request context (respects baseURL)
  try {
    const res = await page.request.get('/');
    if (!res.ok()) {
      test.skip(true, `Dev server not reachable: HTTP ${res.status()}`);
    }
  } catch (err) {
    test.skip(true, 'Dev server not running; skipping e2e smoke test');
  }

  await page.goto('/');

  // Expect the main app header to be visible
  await expect(page.getByRole('heading', { name: 'FIRE Finance' })).toBeVisible();
});
