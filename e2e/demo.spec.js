const { test, expect } = require('@playwright/test');

test('demo.html shows the raw template next to the real filled output', async ({ page }) => {
  await page.goto('demo.html');

  const before = page.locator('.col', { hasText: 'Before' });
  const after = page.locator('.col', { hasText: 'After' });

  await expect(before).toContainText('{{ProjectName}}');
  await expect(before).toContainText('{{Author}}');

  await expect(after).toContainText('claude-doc-sync');
  await expect(after).toContainText('src/run.js');
  await expect(after).toContainText('MIT');
  await expect(after.locator('.notfound').first()).toHaveText('Not Found');

  await expect(page.locator('#summary')).toContainText('7 / 10 placeholders found');
});
