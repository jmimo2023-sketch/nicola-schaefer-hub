# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: calendar.spec.ts >> Calendar Panel - Navigation >> should navigate to previous month
- Location: tests\e2e\calendar.spec.ts:54:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Calendar')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: "N"
        - generic [ref=e7]:
          - heading "Nicola Hub" [level=1] [ref=e8]
          - paragraph [ref=e9]: Creator Hub
      - navigation [ref=e10]:
        - button "Start" [ref=e11]:
          - img [ref=e12]
          - generic [ref=e15]: Start
        - button "Erstellen AI" [ref=e16]:
          - img [ref=e17]
          - generic [ref=e20]: Erstellen
          - generic [ref=e21]: AI
        - button "Design NEW" [ref=e22]:
          - img [ref=e23]
          - generic [ref=e29]: Design
          - generic [ref=e30]: NEW
        - button "Video NEW" [ref=e31]:
          - img [ref=e32]
          - generic [ref=e34]: Video
          - generic [ref=e35]: NEW
        - button "Kalender" [ref=e36]:
          - img [ref=e37]
          - generic [ref=e39]: Kalender
        - button "Analytik" [ref=e40]:
          - img [ref=e41]
          - generic [ref=e43]: Analytik
        - button "Bibliothek" [ref=e44]:
          - img [ref=e45]
          - generic [ref=e47]: Bibliothek
        - button "Einstellungen" [ref=e48]:
          - img [ref=e49]
          - generic [ref=e52]: Einstellungen
      - generic [ref=e53]:
        - generic [ref=e54]:
          - generic [ref=e55]: NS
          - generic [ref=e56]:
            - paragraph [ref=e57]: Nicola Schaefer
            - button "LOGOUT" [ref=e60]
        - generic [ref=e61]:
          - generic [ref=e64]: Google
          - generic [ref=e65]: OFFLINE
    - main [ref=e66]:
      - generic [ref=e67]:
        - heading "START" [level=2] [ref=e69]
        - generic [ref=e71]:
          - button "ES" [ref=e72]
          - button "DE" [ref=e73]
      - generic [ref=e76]:
        - generic [ref=e77]:
          - heading "Guten Tag, Nicola" [level=1] [ref=e78]
          - paragraph [ref=e79]: Diese Woche
        - generic [ref=e80]:
          - generic [ref=e81]:
            - generic [ref=e82]:
              - generic [ref=e83]: Posts diese Woche
              - img [ref=e85]
            - generic [ref=e88]:
              - generic [ref=e89]: "3"
              - generic [ref=e90]: Auf Kurs
          - generic [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]: Engagement
              - img [ref=e95]
            - generic [ref=e98]:
              - generic [ref=e99]: +12%
              - generic [ref=e100]: vs letzte Woche
          - generic [ref=e101]:
            - generic [ref=e102]:
              - generic [ref=e103]: Neue Follower
              - img [ref=e105]
            - generic [ref=e108]:
              - generic [ref=e109]: "+245"
              - generic [ref=e110]: Diesen Monat
        - generic [ref=e111]:
          - heading "Schnellaktionen" [level=2] [ref=e112]
          - generic [ref=e113]:
            - button "Post erstellen Alle ansehen" [ref=e114]:
              - img [ref=e117]
              - heading "Post erstellen" [level=3] [ref=e118]
              - generic [ref=e119]:
                - generic [ref=e120]: Alle ansehen
                - img [ref=e121]
            - button "Planen Alle ansehen" [ref=e123]:
              - img [ref=e126]
              - heading "Planen" [level=3] [ref=e128]
              - generic [ref=e129]:
                - generic [ref=e130]: Alle ansehen
                - img [ref=e131]
            - button "Analytik ansehen Alle ansehen" [ref=e133]:
              - img [ref=e136]
              - heading "Analytik ansehen" [level=3] [ref=e139]
              - generic [ref=e140]:
                - generic [ref=e141]: Alle ansehen
                - img [ref=e142]
        - generic [ref=e144]:
          - generic [ref=e145]:
            - heading "Anstehende Posts" [level=2] [ref=e146]
            - button "View all" [ref=e147]:
              - text: View all
              - img [ref=e148]
          - generic [ref=e150]:
            - img [ref=e152]
            - heading "No upcoming posts" [level=3] [ref=e154]
            - paragraph [ref=e155]: Start scheduling content
            - button "Create post" [ref=e156]:
              - img [ref=e157]
              - text: Create post
        - generic [ref=e159]:
          - img [ref=e161]
          - generic [ref=e164]:
            - heading "AI Insight" [level=3] [ref=e165]
            - paragraph [ref=e166]:
              - text: "Best performing:"
              - strong [ref=e167]: personal reflection posts
              - text: with 8.5% ER.
              - strong [ref=e168]: Thursdays 6PM
              - text: get 2x more saves.
            - generic [ref=e169]:
              - button "Generate" [ref=e170]:
                - img [ref=e171]
                - text: Generate
              - button "Analytics" [ref=e174]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Calendar Panel', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.click('text=Calendar');
  7  |     await page.waitForLoadState('networkidle');
  8  |   });
  9  | 
  10 |   test('should display calendar page correctly', async ({ page }) => {
  11 |     await expect(page.locator('h2:has-text("Calendar")')).toBeVisible();
  12 |     await expect(page.locator('text=Best Posting Times')).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should show week day headers', async ({ page }) => {
  16 |     await expect(page.locator('text=Sun')).toBeVisible();
  17 |     await expect(page.locator('text=Mon')).toBeVisible();
  18 |     await expect(page.locator('text=Tue')).toBeVisible();
  19 |     await expect(page.locator('text=Wed')).toBeVisible();
  20 |     await expect(page.locator('text=Thu')).toBeVisible();
  21 |     await expect(page.locator('text=Fri')).toBeVisible();
  22 |     await expect(page.locator('text=Sat')).toBeVisible();
  23 |   });
  24 | 
  25 |   test('should show month navigation', async ({ page }) => {
  26 |     await expect(page.locator('text=Today')).toBeVisible();
  27 |     const prevBtn = page.locator('[aria-label="Previous month"], button:has(svg):near(text=Calendar):first');
  28 |     await expect(prevBtn).toBeVisible();
  29 |   });
  30 | 
  31 |   test('should show view toggle (Week/Month)', async ({ page }) => {
  32 |     await expect(page.locator('text=Week')).toBeVisible();
  33 |     await expect(page.locator('text=Month')).toBeVisible();
  34 |   });
  35 | 
  36 |   test('should show Queue button with count', async ({ page }) => {
  37 |     const queueBtn = page.locator('text=Queue');
  38 |     await expect(queueBtn).toBeVisible();
  39 |   });
  40 | 
  41 |   test('should show optimal time slots', async ({ page }) => {
  42 |     await expect(page.locator('text=Best Posting Times')).toBeVisible();
  43 |     await expect(page.locator('text=6:00 PM')).toBeVisible();
  44 |     await expect(page.locator('text=8:00 PM')).toBeVisible();
  45 |   });
  46 | 
  47 |   test('should show stats (Queued, Published)', async ({ page }) => {
  48 |     await expect(page.locator('text=Queued')).toBeVisible();
  49 |     await expect(page.locator('text=Published')).toBeVisible();
  50 |   });
  51 | });
  52 | 
  53 | test.describe('Calendar Panel - Navigation', () => {
  54 |   test('should navigate to previous month', async ({ page }) => {
  55 |     await page.goto('/');
> 56 |     await page.click('text=Calendar');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  57 | 
  58 |     const initialMonth = await page.locator('h3').first().textContent();
  59 | 
  60 |     // Click previous month button
  61 |     const prevBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
  62 |     await prevBtn.click();
  63 | 
  64 |     // Month should change (we can't check exact text due to i18n)
  65 |     await page.waitForTimeout(500);
  66 |   });
  67 | 
  68 |   test('should go to today when Today is clicked', async ({ page }) => {
  69 |     await page.goto('/');
  70 |     await page.click('text=Calendar');
  71 | 
  72 |     const todayBtn = page.locator('text=Today');
  73 |     await todayBtn.click();
  74 | 
  75 |     // Should still be on calendar
  76 |     await expect(page.locator('h2:has-text("Calendar")')).toBeVisible();
  77 |   });
  78 | 
  79 |   test('should toggle Queue panel', async ({ page }) => {
  80 |     await page.goto('/');
  81 |     await page.click('text=Calendar');
  82 | 
  83 |     const queueBtn = page.locator('text=Queue').first();
  84 |     await queueBtn.click();
  85 | 
  86 |     // Queue should be toggled (visual check)
  87 |     await page.waitForTimeout(300);
  88 |   });
  89 | });
```