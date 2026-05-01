import { test, expect } from '@playwright/test';

test.describe('AI Generator Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=AI Generator');
    await page.waitForLoadState('networkidle');
  });

  test('should display generator page', async ({ page }) => {
    await expect(page.locator('text=AI Content Factory').or(
      page.locator('h2:has-text("Generator")')
    )).toBeVisible({ timeout: 5000 });
  });

  test('should show content format options', async ({ page }) => {
    await expect(page.locator('text=Content Format').or(
      page.locator('text=Format')
    )).toBeVisible({ timeout: 5000 });
  });

  test('should show pillar options', async ({ page }) => {
    await expect(page.locator('text=Pillar').or(
      page.locator('text=Content Pillar')
    )).toBeVisible();
  });

  test('should show audience options', async ({ page }) => {
    await expect(page.locator('text=Audience').or(
      page.locator('text=Zielgruppe')
    )).toBeVisible();
  });

  test('should show tone options', async ({ page }) => {
    await expect(page.locator('text=Tone').or(
      page.locator('text=tones')
    )).toBeVisible();
  });

  test('should have Generate button', async ({ page }) => {
    await expect(page.locator('button:has-text("Generate"), button:has-text("Generieren")')).toBeVisible();
  });

  test('should have language toggle', async ({ page }) => {
    await expect(page.locator('text=ES').or(page.locator('text=DE'))).toBeVisible();
  });
});

test.describe('AI Generator - Interactions', () => {
  test('should select content format', async ({ page }) => {
    await page.goto('/');
    await page.click('text=AI Generator');

    // Look for a dropdown or select
    const formatSelect = page.locator('text=Content Format').or(page.locator('text=Format')).first();
    await formatSelect.click();

    // Should show options
    await page.waitForTimeout(300);
  });

  test('should navigate to generator from home', async ({ page }) => {
    await page.goto('/');
    await page.click('text=AI Generator');

    // Should see generator page
    await expect(page.locator('text=AI Content Factory').or(
      page.locator('text=Generator')
    )).toBeVisible({ timeout: 5000 });
  });
});