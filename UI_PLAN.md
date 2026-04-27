# Plan: UI/UX Improvement - Nicola Hub

## Objetivo
Transformar la app de un panel técnico a una **experiencia intuitiva de creator** donde cualquier persona pueda crear, programar y analizar contenido sin curva de aprendizaje.

---

## Problemas Actuales

1. **Navegación confusa** — Demasiados paneles sin jerarquía clara
2. **Content Studio isolate** — No está conectado con Calendar ni Analytics
3. **Flujo de trabajo disconnected** — Crear → Editar → Programar → Publicar no está enlazado
4. **Falta de onboarding** — Nuevo usuario no sabe por dónde empezar
5. **Estados vacío deficientes** — No hay guidance cuando no hay contenido
6. **Visual overload** — Demasiada información sin prioridades

---

## Arquitectura de Navegación Propuesta

### Nueva Estructura (3 pilares)

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (simplificada)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🏠 Home (Dashboard unificado)                               │
│                                                              │
│  📱 Content                                                  │
│     └─ Studio (crear/editar)                              │
│     └─ Calendar (programar)                                  │
│                                                              │
│  📊 Analytics                                               │
│     └─ Instagram (métricas)                                 │
│                                                              │
│  ⚙️ Settings                                                │
│     └─ Connections (APIs)                                   │
│     └─ Preferences                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Jerarquía de Pantallas

| Nivel | Contenido | Ejemplo |
|-------|-----------|---------|
| **Home** | KPI principales + acciones rápidas + 最近 actividad | Resumen del día |
| **Studio** | Crear + Biblioteca de assets | Donde se crea contenido |
| **Calendar** | Vista semanal + queue de posts | Programación visual |
| **Analytics** | Métricas clave + insights | Solo lo que importa |
| **Settings** | Configuración de APIs | Lo técnico pero organizado |

---

## Mejoras Específicas

### 1. Home / Dashboard Unificado

**Problema:** Dashboard actual muestra métricas pero no da acciones claras.

**Solución:**
```
┌─────────────────────────────────────────────────────────────┐
│  Good morning, Nicola 👋                                    │
│                                                              │
│  📊 This Week                                               │
│     +12% engagement | 3 new posts | 245 followers          │
│                                                              │
│  🎯 Quick Actions (3 botones grandes)                        │
│     [+ Create Post]  [📅 Schedule]  [📊 View Analytics]    │
│                                                              │
│  📅 Upcoming ( próximos 3 posts)                            │
│     • Tomorrow 10:00 AM - "Reflexión sobre..." (Draft)     │
│     • May 2, 6:00 PM - " Método Sistémico..." (Scheduled) │
│     • May 3, 8:00 PM - "Brecha Afectiva..." (Draft)       │
│                                                              │
│  💡 AI Insights                                             │
│     "Your best posting time is 8 PM. 2 posts this week..." │
└─────────────────────────────────────────────────────────────┘
```

### 2. Content Studio Intuitivo

**Problema:** El usuario tiene que entender conceptos técnicos (Supabase, assets, folders).

**Solución - 3 modos claros:**
```
┌─────────────────────────────────────────────────────────────┐
│  CONTENT STUDIO                                              │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   📸        │  │   🎨        │  │   ✨        │        │
│  │  Upload    │  │  Create New  │  │  AI Generate │        │
│  │  from PC   │  │  from Canva  │  │  with AI     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  Recent Assets                                               │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ + Add More                  │
│  │    │ │    │ │    │ │    │                             │
│  └────┘ └────┘ └────┘ └────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Calendar como Centro de Control

**Problema:** El calendario actual es una lista, no una experiencia visual.

**Solución:**
```
┌─────────────────────────────────────────────────────────────┐
│  📅 MAY 2026                                    [< Prev] [Next >] │
│                                                              │
│     Mon    Tue    Wed    Thu    Fri    Sat    Sun           │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │      │      │ 3    │ 4    │ 5    │ 6    │ 7    │       │
│  │      │      │●post │      │●post │      │      │       │
│  │      │      │ 8PM  │      │ 6PM  │      │      │       │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤       │
│  │ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │       │
│  │      │      │      │●post │      │      │      │       │
│  │      │      │      │ 7PM  │      │      │      │       │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘       │
│                                                              │
│  [+ Add Post]                                               │
│                                                              │
│  ──── QUEUE ────                                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 📸 Morning Motivation                          [Edit]     │  │
│  │ Scheduled: May 12, 6:00 PM • Instagram Post • Ready    │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 🎬 Sistematic Method                          [Edit]     │  │
│  │ Scheduled: May 14, 8:00 PM • Reel • Draft             │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4. Onboarding para Nuevos Usuarios

**Problema:** Usuario nuevo no sabe qué hacer primero.

**Solución - 3 pasos iniciales:**
```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Let's get you started!                                  │
│                                                              │
│  Step 1: Connect your accounts                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Instagram│ │  Canva   │ │ Make.com │                   │
│  │  ○ Off   │ │  ● On    │ │  ○ Off   │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                              │
│  Step 2: Create your first post                            │
│  [Start Creating →]                                         │
│                                                              │
│  Step 3: Schedule content                                    │
│  [View Calendar →]                                           │
└─────────────────────────────────────────────────────────────┘
```

### 5. Estados Vacíos con Guidance

**Antes (técnico):**
```
"No assets imported yet"
```

**Después (intuitivo):**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  📸 Your media library is empty                             │
│                                                              │
│  Start by uploading photos or videos you want to use.       │
│  Supported: JPG, PNG, MP4, MOV                              │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  📁 Upload from PC  │  │  🎨 Create in Canva│           │
│  └────────────────────┘  └────────────────────┘           │
│                                                              │
│  💡 Pro tip: Keep your brand visuals consistent for          │
│     better engagement!                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6. Feedback Visual Constante

**Toast messages mejorado:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Post scheduled!                                          │
│     Will be published May 12 at 6:00 PM                     │
│     [View in Calendar]  [Edit]                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Plan de Implementación

### Fase 1: Navegación Simplificada
- [ ] Reorganizar sidebar en 3 categorías
- [ ] Agregar indicador de sección activa
- [ ] Añadir breadcrumb navigation

### Fase 2: Home Dashboard
- [ ] Rediseñar dashboard principal
- [ ] Agregar Quick Actions
- [ ] Mostrar upcoming posts
- [ ] AI Insights widget

### Fase 3: Content Studio Flow
- [ ] 3 grandes botones de entrada
- [ ] Recent assets grid
- [ ] Drag & drop mejorado
- [ ] Preview inline

### Fase 4: Calendar Visual
- [ ] Grid semanal/mensual switch
- [ ] Drag posts between days
- [ ] Queue panel debajo
- [ ] Best times indicator

### Fase 5: Onboarding
- [ ] First-run wizard
- [ ] Tooltips deintroducción
- [ ] Sample content option

### Fase 6: Estados y Feedback
- [ ] Empty states con guidance
- [ ] Toast improvements
- [ ] Loading skeletons
- [ ] Progress indicators

---

## Componentes a Crear/Modificar

### Nuevos Componentes
```
src/components/
├── QuickActions.tsx      // 3 botones grandes del home
├── UpcomingPosts.tsx    // Lista de próximos posts
├── InsightCard.tsx       // AI insights widget
├── EmptyState.tsx        // Estados vacíos reutilizables
├── OnboardingWizard.tsx  // Wizard de configuración inicial
├── CalendarGrid.tsx     // Grid visual del calendario
└── Toast.tsx            // Toast mejorado
```

### Paneles a Refactorizar
```
src/panels/
├── HomePanel.tsx         // (nuevo) Dashboard principal intuitivo
├── StudioPanel.tsx        // Rediseñar con 3 flujos claros
├── CalendarPanel.tsx      // Grid visual + queue
└── ConnectionsPanel.tsx  // Simplificar inputs
```

---

## Métricas de Éxito

- [ ] Usuario nuevo completa onboarding en < 2 minutos
- [ ] Primera acción (crear/post) en < 3 clicks
- [ ] 0 documentación necesaria para uso básico
- [ ] NPS > 8 (net promoter score)

---

## Timeline Estimado

| Fase | Dificultad | Tiempo |
|------|-------------|--------|
| Navegación | Media | 2h |
| Home | Alta | 4h |
| Studio | Media | 3h |
| Calendar | Alta | 4h |
| Onboarding | Media | 3h |
| Estados/Feedback | Baja | 2h |

**Total estimado: 18 horas**

---

## Siguiente Paso Inmediato

Comenzar con **Fase 1: Navegación Simplificada** + **Home Dashboard**

¿Empezamos?
