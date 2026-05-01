import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('should show wizard on first visit', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wizard should be visible
    await expect(page.locator('text=Welcome to Nicola Hub')).toBeVisible({ timeout: 10000 });
  });

  test('should have 4 steps in wizard', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Should see step indicators (1 of 4, 2 of 4, etc)
    await expect(page.locator('text=Step 1 of 4')).toBeVisible({ timeout: 5000 });
  });

  test('should complete wizard steps', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Step through wizard 4 times
    for (let i = 0; i < 4; i++) {
      const continueBtn = page.locator('button:has-text("Continue")').first();
      await continueBtn.click();
      await page.waitForTimeout(500);
    }

    // Wizard should close after last step
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Welcome to Nicola Hub')).not.toBeVisible({ timeout: 3000 });
  });

  test('should allow skip via X button', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for wizard
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 5000 });

    // Close button
    const closeBtn = page.locator('[aria-label="Close"], button:has-text("X")').first();
    await closeBtn.click();

    // Wizard should close
    await expect(page.locator('text=Welcome')).not.toBeVisible({ timeout: 3000 });
  });

  test('should show feature highlights in welcome', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('text=Create')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Schedule')).toBeVisible();
    await expect(page.locator('text=Analyze')).toBeVisible();
  });
});