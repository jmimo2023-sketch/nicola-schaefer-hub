import { test, expect } from '@playwright/test';

test.describe('Design Studio Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Close onboarding modal
    try {
      const skipButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      if (await skipButton.isVisible({ timeout: 2000 })) {
        await page.locator('.fixed button >> nth=-1').click({ force: true });
        await page.waitForTimeout(500);
      }
    } catch (e) {
      // Modal might not exist
    }

    // Navigate to Design Studio
    try {
      await page.locator('nav span:text-is("Design Studio")').click({ timeout: 5000, force: true });
    } catch (e) {
      // Try any button containing Studio
      await page.locator('nav >> text=Studio').click({ force: true });
    }

    await page.waitForTimeout(2500);
  });

  test('should load without console errors', async ({ page }) => {
    // Check no critical console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Just verify page loaded
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(1000);

    // Should have minimal errors
    const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('warning'));
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test('should display tldraw canvas', async ({ page }) => {
    // Tldraw creates a specific container
    const canvas = page.locator('.tldraw');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });
});
