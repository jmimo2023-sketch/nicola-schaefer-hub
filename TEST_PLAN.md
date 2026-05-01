# NICOLA SCHAEFER HUB - PLAN DE PRUEBAS
## Testing Strategy & Test Cases
### v1.0

---

# 1. ESTRATEGIA DE PRUEBAS

## 1.1 Pyramide de Testing

```
                    ╱╲
                   ╱  ╲
                  ╱    ╲
                 ╱ pytest ╲
                ╱──────────╲
               ╱            ╲
              ╱  Playwright ╲
             ╱    E2E Tests  ╲
            ╱──────────────────╲
           ╱                    ╲
          ╱   Integration Tests ╲
         ╱────────────────────────╲
        ╱                          ╲
       ╱      Unit Tests           ╲
      ╱──────────────────────────────╲
```

**Niveles:**
- **Unit (70%):** Funciones individuales, hooks, utils
- **Integration (20%):** Componentes, servicios, APIs
- **E2E (10%):** Flujos completos de usuario

## 1.2 Frameworks

| Tipo | Framework | Ubicación |
|------|------------|-----------|
| Unit | Vitest | `tests/unit/` |
| Integration | React Testing Library | `tests/integration/` |
| E2E | Playwright | `tests/e2e/` |

---

# 2. TEST CASES - STUDIO PANEL

## TC-STU-001: Upload Imagen Individual

**Precondiciones:**
- Usuario autenticado
- Supabase configurado
- Archivo JPG < 10MB listo

**Pasos:**
1. Ir a Studio
2. Click "Upload Media"
3. Seleccionar archivo JPG
4. Esperar upload
5. Verificar imagen en grid

**Resultado Esperado:** Thumbnail visible en grid

**Estado:** ⚠️ Sin test automatizado

---

## TC-STU-002: Drag & Drop Upload

**Precondiciones:**
- Archivo PNG listo
- Dropzone visible

**Pasos:**
1. Arrastrar archivo PNG al dropzone
2. Soltar archivo
3. Verificar progress
4. Verificar thumbnail

**Resultado Esperado:** Upload automático, thumbnail visible

**Estado:** ⚠️ Sin test automatizado

---

## TC-STU-003: Eliminar Asset

**Precondiciones:**
- Al menos 1 asset existe

**Pasos:**
1. Hover sobre asset
2. Click botón eliminar (trash)
3. Confirmar en dialog
4. Verificar removal

**Resultado Esperado:** Asset eliminado de grid

**Estado:** ⚠️ Sin test automatizado

---

# 3. TEST CASES - CALENDAR PANEL

## TC-CAL-001: Crear Post

**Precondiciones:**
- Usuario autenticado
- Al menos 1 asset existe

**Pasos:**
1. Ir a Calendar
2. Click "Add Post"
3. Llenar formulario:
   - Título: "Test Post"
   - Tipo: Image
   - Fecha: Tomorrow
   - Hora: 18:00
4. Seleccionar asset
5. Click "Save"

**Resultado Esperado:** Post aparece en calendario

**Estado:** ⚠️ Sin test automatizado

---

## TC-CAL-002: Drag & Drop Reposicionar

**Precondiciones:**
- Al menos 1 post existe en cola

**Pasos:**
1. Encontrar post en cola
2. Arrastrar a otro día
3. Soltar
4. Verificar nueva fecha

**Resultado Esperado:** Post mueve a nueva fecha

**Estado:** ⚠️ Sin test automatizado

---

## TC-CAL-003: Cambiar Estado Post

**Precondiciones:**
- Post con estado "draft" existe

**Pasos:**
1. Encontrar post draft
2. Click "Schedule"
3. Verificar cambio a "scheduled"

**Resultado Esperado:** Badge cambia a azul "SCHEDULED"

**Estado:** ⚠️ Sin test automatizado

---

# 4. TEST CASES - AI GENERATOR

## TC-GEN-001: Generar Caption

**Precondiciones:**
- AI service configurado
- Todas opciones seleccionadas

**Pasos:**
1. Ir a Generator
2. Seleccionar tipo: "Caption"
3. Seleccionar pilar: "Emotion as Compass"
4. Seleccionar audiencia: "Primary Audience"
5. Seleccionar tono: "Corporal"
6. Click "Generate"

**Resultado Esperado:** 3 captions generados

**Estado:** ⚠️ Sin test automatizado

---

## TC-GEN-002: Copiar al Clipboard

**Precondiciones:**
- Contenido generado existe

**Pasos:**
1. Generar caption
2. Click "Copy"
3. Verificar toast "¡Copiado!"
4. Pegar en documento externo

**Resultado Esperado:** Contenido en clipboard, toast visible

**Estado:** ⚠️ Sin test automatizado

---

# 5. TEST CASES - DASHBOARD

## TC-ANL-001: Ver KPIs

**Precondiciones:**
- Meta API conectada
- Datos de analytics disponibles

**Pasos:**
1. Ir a Dashboard (Instagram)
2. Esperar carga de datos
3. Verificar 5 KPI cards visibles

**Resultado Esperado:** Cards con valores numéricos

**Estado:** ⚠️ Sin test automatizado

---

# 6. TEST CASES - ONBOARDING

## TC-ONB-001: Wizard Completo

**Precondiciones:**
- Primera visita
- No hay usuario logueado

**Pasos:**
1. Cargar app
2. Verificar wizard aparece
3. Click "Continue" en cada step
4. Completar 4 steps
5. Verificar wizard cierra

**Resultado Esperado:** Home panel visible después

**Estado:** ⚠️ Sin test automatizado

---

## TC-ONB-002: Skip Wizard

**Precondiciones:**
- Wizard visible

**Pasos:**
1. Click "X" en corner
2. Verificar wizard cierra

**Resultado Esperado:** Home visible sin onboarding

**Estado:** ⚠️ Sin test automatizado

---

# 7. TEST CASES - CONNECTIONS

## TC-CON-001: Ver Estado

**Precondiciones:**
- Usuario autenticado

**Pasos:**
1. Ir a Settings > Connections
2. Verificar 6 servicios listados
3. Verificar badges de status

**Resultado Esperado:** Lista completa con status

**Estado:** ⚠️ Sin test automatizado

---

# 8. TEST SUITE - PLAYWRIGHT (E2E)

```typescript
// tests/e2e/studio.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Studio Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Studio');
  });

  test('should upload image successfully', async ({ page }) => {
    // Click upload button
    await page.click('text=Upload Media');
    
    // File dialog should open (can't test file selection in E2E)
    // Verify dropzone is visible
    await expect(page.locator('text=Drag & drop files here')).toBeVisible();
  });

  test('should show empty state when no assets', async ({ page }) => {
    // With no assets, should show empty state with guidance
    await expect(page.locator('text=Your images library is empty')).toBeVisible();
  });

  test('should filter by image type', async ({ page }) => {
    await page.click('text=images');
    // Should show images tab active
    await expect(page.locator('button:has-text("images")')).toHaveClass(/bg-accent/);
  });
});
```

```typescript
// tests/e2e/calendar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Calendar Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Calendar');
  });

  test('should display calendar grid', async ({ page }) => {
    // Should show week days header
    await expect(page.locator('text=Sun')).toBeVisible();
    await expect(page.locator('text=Mon')).toBeVisible();
    
    // Should show month/year
    const monthYear = await page.locator('h3').first().textContent();
    expect(monthYear).toMatch(/\w+ \d{4}/);
  });

  test('should show queue panel', async ({ page }) => {
    // Queue button should be visible
    await expect(page.locator('text=Queue')).toBeVisible();
  });
});
```

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('should show wizard on first visit', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Wizard should be visible
    await expect(page.locator('text=Welcome to Nicola Hub')).toBeVisible();
  });

  test('should complete all steps', async ({ page }) => {
    await page.goto('/');
    
    // Step through wizard
    for (let i = 0; i < 4; i++) {
      await page.click('text=Continue');
    }
    
    // Wizard should close
    await expect(page.locator('text=Welcome')).not.toBeVisible();
  });

  test('should allow skip', async ({ page }) => {
    await page.goto('/');
    
    // Click X or Skip
    await page.click('[aria-label="Close wizard"]');
    
    // Should close immediately
    await expect(page.locator('text=Welcome')).not.toBeVisible();
  });
});
```

---

# 9. COBERTURA ACTUAL vs REQUERIDA

```
COMPONENTE          CURRENT    TARGET    GAP
─────────────────────────────────────────────────
Studio               0%         80%      -80%
Calendar             0%         80%      -80%
Generator            0%         80%      -80%
Dashboard            0%         70%      -70%
Onboarding           0%         90%      -90%
Connections          0%         60%      -60%
─────────────────────────────────────────────────
OVERALL              0%         77%      -77%
```

---

# 10. PRÓXIMOS PASOS

## Week 1
- [ ] Setup Vitest
- [ ] Setup Playwright
- [ ] Escribir primer test unitario
- [ ] Escribir primer test E2E

## Week 2
- [ ] Unit tests para servicios (firebase, supabase)
- [ ] E2E tests para Studio upload flow

## Week 3-4
- [ ] E2E tests para Calendar
- [ ] E2E tests para Generator
- [ ] Integration tests para Onboarding

## Week 5-6
- [ ] E2E tests para Dashboard
- [ ] Coverage report setup
- [ ] CI pipeline integration

---

**Documento creado:** 26 Abril 2026
**Última actualización:** 26 Abril 2026