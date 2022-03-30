const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  await page.goto('https://hydro.gen.in');
  const title = page.locator('main');
  await expect(title).toContainText(/float/i);
  await page.screenshot({ path: 'screenshots/screenshot-' + Date.now() + '.png' });
});