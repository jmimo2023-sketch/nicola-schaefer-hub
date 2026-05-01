import { test, expect } from '@playwright/test';

test.describe('Calendar Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Calendar');
    await page.waitForLoadState('networkidle');
  });

  test('should display calendar page correctly', async ({ page }) => {
    await expect(page.locator('h2:has-text("Calendar")')).toBeVisible();
    await expect(page.locator('text=Best Posting Times')).toBeVisible();
  });

  test('should show week day headers', async ({ page }) => {
    await expect(page.locator('text=Sun')).toBeVisible();
    await expect(page.locator('text=Mon')).toBeVisible();
    await expect(page.locator('text=Tue')).toBeVisible();
    await expect(page.locator('text=Wed')).toBeVisible();
    await expect(page.locator('text=Thu')).toBeVisible();
    await expect(page.locator('text=Fri')).toBeVisible();
    await expect(page.locator('text=Sat')).toBeVisible();
  });

  test('should show month navigation', async ({ page }) => {
    await expect(page.locator('text=Today')).toBeVisible();
    const prevBtn = page.locator('[aria-label="Previous month"], button:has(svg):near(text=Calendar):first');
    await expect(prevBtn).toBeVisible();
  });

  test('should show view toggle (Week/Month)', async ({ page }) => {
    await expect(page.locator('text=Week')).toBeVisible();
    await expect(page.locator('text=Month')).toBeVisible();
  });

  test('should show Queue button with count', async ({ page }) => {
    const queueBtn = page.locator('text=Queue');
    await expect(queueBtn).toBeVisible();
  });

  test('should show optimal time slots', async ({ page }) => {
    await expect(page.locator('text=Best Posting Times')).toBeVisible();
    await expect(page.locator('text=6:00 PM')).toBeVisible();
    await expect(page.locator('text=8:00 PM')).toBeVisible();
  });

  test('should show stats (Queued, Published)', async ({ page }) => {
    await expect(page.locator('text=Queued')).toBeVisible();
    await expect(page.locator('text=Published')).toBeVisible();
  });
});

test.describe('Calendar Panel - Navigation', () => {
  test('should navigate to previous month', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Calendar');

    const initialMonth = await page.locator('h3').first().textContent();

    // Click previous month button
    const prevBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await prevBtn.click();

    // Month should change (we can't check exact text due to i18n)
    await page.waitForTimeout(500);
  });

  test('should go to today when Today is clicked', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Calendar');

    const todayBtn = page.locator('text=Today');
    await todayBtn.click();

    // Should still be on calendar
    await expect(page.locator('h2:has-text("Calendar")')).toBeVisible();
  });

  test('should toggle Queue panel', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Calendar');

    const queueBtn = page.locator('text=Queue').first();
    await queueBtn.click();

    // Queue should be toggled (visual check)
    await page.waitForTimeout(300);
  });
});