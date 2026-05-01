# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: design-studio.spec.ts >> Design Studio Panel >> should display tldraw canvas
- Location: tests\e2e\design-studio.spec.ts:49:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.tldraw')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('.tldraw')

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
        - generic [ref=e11]: START
        - button "Start" [ref=e12]:
          - img [ref=e14]
          - generic [ref=e19]: Start
        - generic [ref=e20]: Inhalt
        - button "Design Studio NEW" [ref=e21]:
          - img [ref=e23]
          - generic [ref=e29]: Design Studio
          - generic [ref=e30]: NEW
        - button "Image Editor" [ref=e31]:
          - img [ref=e33]
          - generic [ref=e35]: Image Editor
        - button "Kalender" [ref=e36]:
          - img [ref=e38]
          - generic [ref=e40]: Kalender
        - button "KI-Generator AI" [ref=e41]:
          - img [ref=e43]
          - generic [ref=e48]: KI-Generator
          - generic [ref=e49]: AI
        - generic [ref=e50]: Analytik
        - button "Instagram" [ref=e51]:
          - img [ref=e53]
          - generic [ref=e56]: Instagram
        - generic [ref=e57]: Strategie
        - button "Simulator" [ref=e58]:
          - img [ref=e60]
          - generic [ref=e63]: Simulator
        - button "Methodik" [ref=e64]:
          - img [ref=e66]
          - generic [ref=e71]: Methodik
        - button "DACH-Markt" [ref=e72]:
          - img [ref=e74]
          - generic [ref=e77]: DACH-Markt
        - generic [ref=e78]: Einstellungen
        - button "Verbindungen" [ref=e79]:
          - img [ref=e81]
          - generic [ref=e84]: Verbindungen
      - generic [ref=e85]:
        - generic [ref=e86]:
          - generic [ref=e87]: NS
          - generic [ref=e88]:
            - paragraph [ref=e89]: Nicola Schaefer
            - button "LOGOUT" [ref=e92]
        - generic [ref=e93]:
          - generic [ref=e96]: Google
          - generic [ref=e97]: OFFLINE
    - main [ref=e98]:
      - generic [ref=e99]:
        - heading "HOME" [level=2] [ref=e101]
        - generic [ref=e103]:
          - button "ES" [ref=e104]
          - button "DE" [ref=e105]
      - generic [ref=e108]:
        - generic [ref=e109]:
          - heading "Guten Abend, Nicola" [level=1] [ref=e110]
          - paragraph [ref=e111]: Diese Woche
        - generic [ref=e112]:
          - generic [ref=e113]:
            - generic [ref=e114]:
              - generic [ref=e115]: Posts diese Woche
              - img [ref=e117]
            - generic [ref=e120]:
              - generic [ref=e121]: "3"
              - generic [ref=e122]: Auf Kurs
          - generic [ref=e123]:
            - generic [ref=e124]:
              - generic [ref=e125]: Engagement
              - img [ref=e127]
            - generic [ref=e130]:
              - generic [ref=e131]: +12%
              - generic [ref=e132]: vs letzte Woche
          - generic [ref=e133]:
            - generic [ref=e134]:
              - generic [ref=e135]: Neue Follower
              - img [ref=e137]
            - generic [ref=e140]:
              - generic [ref=e141]: "+245"
              - generic [ref=e142]: Diesen Monat
        - generic [ref=e143]:
          - heading "Schnellaktionen" [level=2] [ref=e144]
          - generic [ref=e145]:
            - button "Post erstellen Alle ansehen" [ref=e146]:
              - img [ref=e149]
              - heading "Post erstellen" [level=3] [ref=e150]
              - generic [ref=e151]:
                - generic [ref=e152]: Alle ansehen
                - img [ref=e153]
            - button "Planen Alle ansehen" [ref=e155]:
              - img [ref=e158]
              - heading "Planen" [level=3] [ref=e160]
              - generic [ref=e161]:
                - generic [ref=e162]: Alle ansehen
                - img [ref=e163]
            - button "Analytik ansehen Alle ansehen" [ref=e165]:
              - img [ref=e168]
              - heading "Analytik ansehen" [level=3] [ref=e171]
              - generic [ref=e172]:
                - generic [ref=e173]: Alle ansehen
                - img [ref=e174]
        - generic [ref=e176]:
          - generic [ref=e177]:
            - heading "Anstehende Posts" [level=2] [ref=e178]
            - button "View all" [ref=e179]:
              - text: View all
              - img [ref=e180]
          - generic [ref=e182]:
            - img [ref=e184]
            - heading "No upcoming posts" [level=3] [ref=e186]
            - paragraph [ref=e187]: Start scheduling content
            - button "Create post" [ref=e188]:
              - img [ref=e189]
              - text: Create post
        - generic [ref=e191]:
          - img [ref=e193]
          - generic [ref=e196]:
            - heading "AI Insight" [level=3] [ref=e197]
            - paragraph [ref=e198]:
              - text: "Best performing:"
              - strong [ref=e199]: personal reflection posts
              - text: with 8.5% ER.
              - strong [ref=e200]: Thursdays 6PM
              - text: get 2x more saves.
            - generic [ref=e201]:
              - button "Generate" [ref=e202]:
                - img [ref=e203]
                - text: Generate
              - button "Analytics" [ref=e206]
  - generic [ref=e208]:
    - generic [ref=e209]:
      - generic [ref=e210]:
        - img [ref=e212]
        - generic [ref=e218]:
          - paragraph [ref=e219]: Step 3 of 4
          - heading "Create your first post" [level=2] [ref=e220]
      - button [ref=e221]:
        - img [ref=e222]
    - generic [ref=e228]:
      - img [ref=e230]
      - heading "Generate content with AI" [level=3] [ref=e236]
      - paragraph [ref=e237]: Use our AI generator to create engaging captions and scripts tailored to your audience.
    - generic [ref=e244]:
      - button "Back" [ref=e245]:
        - img [ref=e246]
        - text: Back
      - button "Continue" [active] [ref=e248]:
        - text: Continue
        - img [ref=e249]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Design Studio Panel', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.waitForLoadState('networkidle');
  7  |     await page.waitForTimeout(1500);
  8  | 
  9  |     // Close onboarding modal
  10 |     try {
  11 |       const skipButton = page.locator('button').filter({ has: page.locator('svg') }).first();
  12 |       if (await skipButton.isVisible({ timeout: 2000 })) {
  13 |         await page.locator('.fixed button >> nth=-1').click({ force: true });
  14 |         await page.waitForTimeout(500);
  15 |       }
  16 |     } catch (e) {
  17 |       // Modal might not exist
  18 |     }
  19 | 
  20 |     // Navigate to Design Studio
  21 |     try {
  22 |       await page.locator('nav span:text-is("Design Studio")').click({ timeout: 5000, force: true });
  23 |     } catch (e) {
  24 |       // Try any button containing Studio
  25 |       await page.locator('nav >> text=Studio').click({ force: true });
  26 |     }
  27 | 
  28 |     await page.waitForTimeout(2500);
  29 |   });
  30 | 
  31 |   test('should load without console errors', async ({ page }) => {
  32 |     // Check no critical console errors
  33 |     const errors: string[] = [];
  34 |     page.on('console', msg => {
  35 |       if (msg.type() === 'error') {
  36 |         errors.push(msg.text());
  37 |       }
  38 |     });
  39 | 
  40 |     // Just verify page loaded
  41 |     await expect(page.locator('body')).toBeVisible();
  42 |     await page.waitForTimeout(1000);
  43 | 
  44 |     // Should have minimal errors
  45 |     const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('warning'));
  46 |     expect(criticalErrors.length).toBeLessThan(3);
  47 |   });
  48 | 
  49 |   test('should display tldraw canvas', async ({ page }) => {
  50 |     // Tldraw creates a specific container
  51 |     const canvas = page.locator('.tldraw');
> 52 |     await expect(canvas).toBeVisible({ timeout: 10000 });
     |                          ^ Error: expect(locator).toBeVisible() failed
  53 |   });
  54 | });
  55 | 
```