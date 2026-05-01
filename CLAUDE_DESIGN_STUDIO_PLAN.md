# Design Studio - Plan de Mejora Integral

## Diagnóstico Comparativo vs Canva

### Lo que tiene ✓
- Canvas tldraw con herramientas básicas (shapes, texto, imágenes)
- Brand Kit con colores y tipografía
- AI Tools (background removal, análisis, captions)
- Capas con visibilidad/bloqueo
- Export SVG
- Formatos predefinidos para redes sociales

### Lo que falta ❌
1. **Export multi-formato**: Solo SVG, no PNG/JPG/PDF/WEBP
2. **Artboard enforcement**: tldraw es infinite canvas - el formato es cosmético
3. **Keyboard shortcuts**: Definidos pero NO cableados
4. **Auto-save/persistencia**: No guarda a backend, solo localStorage
5. **Templates**: Sin biblioteca de plantillas
6. **Duplicado tab routing**: 'visuals' y 'design' van al mismo panel
7. **Missing states UI**: Poca retroalimentación al usuario
8. **Stock images**: Búsqueda no implementada
9. **Blend modes / Filtros**: No disponibles
10. **Smart cropping / AI resize**: No disponible
11. **Video support**: No disponible
12. **Collaboration**: No disponible

---

## PLAN DE MEJORAS - FASE 1 (Crítico)

### 1.1 Bug: Duplicate Tab Routing
**Archivo**: `src/App.tsx`
**Problema**: Líneas 296-297 - 'visuals' y 'design' van a DesignStudioPanel idéntico
**Solución**: Consolidar a una sola ruta 'design'

### 1.2 Bug: Format Modal en mount
**Archivo**: `src/panels/DesignStudioPanel.tsx` línea 1058
**Problema**: `showFormatModal` default `true` - muestra modal al cargar
**Solución**: Cambiar a `false`, agregar botón "Cambiar formato" en toolbar

### 1.3 Feature: Export PNG/JPG
**Archivo**: `src/panels/DesignStudioPanel.tsx`
**Solución**: Usar `html-to-image` (ya en deps) para exportar a PNG/JPG
**UI**: Dropdown de exportación con opciones de formato y calidad

### 1.4 Feature: Keyboard Shortcuts
**Archivo**: `src/panels/DesignStudioPanel.tsx`
**Solución**: Usar `useKeyboardShortcuts` de tldraw o implementar custom
**Shortcuts**: V=Select, H=Hand, T=Text, R=Rect, O=Ellipse, L=Line, A=Arrow, I=Image

---

## PLAN DE MEJORAS - FASE 2 (Alta Prioridad)

### 2.1 Artboard Enforcement
**Problema**: tldraw es infinite canvas, formatos son solo display
**Solución**: Crear un "viewport constraints" - usar `TLFOTO` shape de tldraw
       o crear un componente wrapper que simule el artboard con guías

### 2.2 Auto-save con Supabase
**Archivo**: `src/services/storageService.ts`
**Solución**: Implementar guardar/cargar proyectos a Supabase
**UI**: Indicador de sync, botón guardar manual

### 2.3 Brand Kit Expansion
- Agregar logos
- Guardar/Cargar brand kits
- Import from Canva (si API lo permite)

### 2.4 AI Tools Expansion
- Generar imágenes con AI (DALL-E/Gemini)
- AI text to image
- Smart resize/recrop

---

## PLAN DE MEJORAS - FASE 3 (Media Prioridad)

### 3.1 Templates Library
- Crear biblioteca de templates pre-diseñados
- Templates por categoría (Coaching, Ventas, etc.)
- Templates por formato (Post, Story, etc.)

### 3.2 Stock Images Integration
- Unsplash API
- Pixabay API
- Búsqueda inline en el editor

### 3.3 Improved Properties Panel
- Blend modes
- Shadow/elevation
- Border controls
- Corner radius para rectángulos

### 3.4 Undo/Redo Visual Feedback
- Toast confirmations
- Keyboard shortcut hints

---

## PLAN DE MEJORAS - FASE 4 (Futuro)

- Video support
- Real-time collaboration
- Canva import/export
- More AI features
- Plugin system

---

## Métricas de Éxito

1. **Funcionalidad Core**: Todas las herramientas funcionan sin errores
2. **Export**: PNG, JPG, SVG funcionando al 100%
3. **UX**: No hay estados donde el usuario quede "atrapado"
4. **Performance**: Canvas carga < 2s, export < 3s
5. **Mobile**: Responsive y usable en tablet
