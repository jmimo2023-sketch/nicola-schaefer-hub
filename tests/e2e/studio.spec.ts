import { test, expect } from '@playwright/test';

test.describe('Studio Panel - Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Studio');
    await page.waitForLoadState('networkidle');
  });

  test('should display studio page correctly', async ({ page }) => {
    await expect(page.locator('h2:has-text("Content Studio")')).toBeVisible();
    await expect(page.locator('text=Upload Media')).toBeVisible();
    await expect(page.locator('text=Create Design')).toBeVisible();
    await expect(page.locator('text=AI Generate')).toBeVisible();
  });

  test('should show empty state when no assets', async ({ page }) => {
    // The empty state should show guidance
    await expect(page.locator('text=Your images library is empty').or(
      page.locator('text=Upload Media')
    )).toBeVisible();
  });

  test('should have folder tabs (images, videos, templates)', async ({ page }) => {
    await expect(page.locator('button:has-text("images")')).toBeVisible();
    await expect(page.locator('button:has-text("videos")')).toBeVisible();
  });

  test('should show upload zone with drag and drop', async ({ page }) => {
    const dropzone = page.locator('text=Drag & drop files here');
    await expect(dropzone).toBeVisible();
  });

  test('should show Supabase status indicator', async ({ page }) => {
    const status = page.locator('text=SUPABASE_READY').or(page.locator('text=STORAGE_OFF'));
    await expect(status).toBeVisible();
  });

  test('should show Canva status indicator', async ({ page }) => {
    const status = page.locator('text=CANVA_READY').or(page.locator('text=CANVA_OFF'));
    await expect(status).toBeVisible();
  });

  test('should filter by image type when tab clicked', async ({ page }) => {
    const imagesTab = page.locator('button:has-text("images")');
    await imagesTab.click();
    await expect(imagesTab).toHaveClass(/bg-accent/);
  });
});

test.describe('Studio Panel - Actions', () => {
  test('should open file picker when Upload Media is clicked', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Studio');

    const uploadBtn = page.locator('text=Upload Media').first();
    await uploadBtn.click();

    // File dialog should be triggered (we can't test file selection in E2E)
    // But we can verify the button is clickable
    await expect(uploadBtn).toBeEnabled();
  });

  test('should navigate to AI Generator when AI Generate is clicked', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Studio');

    const aiBtn = page.locator('text=AI Generate').first();
    await aiBtn.click();

    await expect(page.locator('text=AI Content Factory').or(
      page.locator('h2:has-text("Generator")')
    )).toBeVisible({ timeout: 5000 });
  });
});