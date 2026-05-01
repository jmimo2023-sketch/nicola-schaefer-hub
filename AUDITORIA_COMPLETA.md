# AUDITORÍA COMPLETA — Nicola Schaefer Hub
## Hacia una plataforma de producción nivel profesional

**Fecha:** 2026-05-01  
**Auditor:** Flip ⚡  
**Contexto:** Hub para creadores de contenido — gestión integral de publicaciones, métricas, estrategia y creación automatizada

---

## 1. DIAGNÓSTICO GENERAL

### Estado actual: Prototipo funcional, NO listo para producción

El hub tiene **19 paneles** y **14+ servicios**, pero la mayoría son demos parcialmente conectadas. Falta cohesión entre módulos, datos desconectados, y varios paneles son solo UI sin lógica real.

### Fortalezas ✅
- **Identidad visual sólida** — Diseño consistente, dark/light, responsive
- **Firebase + Firestore** — Base de datos real con auth
- **Supabase Storage** — Para assets multimedia
- **Canva SDK** — Integración con herramienta profesional
- **Gemini AI** — Generación de contenido con contexto de marca
- **Brand voice bien definida** — PROMPT_MAESTRO.md es oro
- **Video editing pipeline** — Módulo nuevo con ffmpeg real
- **Panel de métricas** — Datos reales de Instagram

### Debilidades Críticas ❌
- **19 paneles, 0 workflow real** — No hay flujo conectado de principio a fin
- **Datos desconectados** — Calendar no habla con Generator, Generator no habla con Video
- **Sin persistencia real** — Video editing usa archivos temporales, no Supabase
- **Sin programación real** — Calendar tiene CRUD pero no publica en Instagram
- **Sin aprobación de contenido** — Make.com flujo existe en docs pero no en el hub
- **Sin métricas en tiempo real** — Dashboard usa datos estáticos (constants.ts)
- **Paneles huérfanos** — Client, Methodology, DACH, Scripts, Stories = placeholders
- **Sin onboarding funcional** — Wizard existe pero no configura nada real
- **Tokens de API hardcodeados** — NEMO_API_TOKEN en contentAgentService.ts
- **Sin testing** — Playwright configurado pero sin tests reales

---

## 2. AUDITORÍA POR MÓDULO

### 🏠 HomePanel — Estado: ⚠️ PARCIAL
- **Tiene:** Dashboard con KPIs, upcoming posts, quick actions
- **Falta:** KPIs reales desde API (usa constants.ts), upcoming posts vacío sin Firestore poblado
- **Prioridad:** ALTA — Es lo primero que ve el usuario

### 📅 CalendarPanel — Estado: ⚠️ PARCIAL
- **Tiene:** CRUD completo, ICS export, Google Calendar sync, tooltips, colores por status
- **Falta:** Publicación automática a Instagram, scheduling real, conexión con Generator/Video
- **Prioridad:** CRÍTICA — El calendario es el centro operativo

### ✍️ GeneratorPanel — Estado: ✅ FUNCIONAL
- **Tiene:** Generación con Gemini, 4 formatos, 5 pilares, 3 audiencias, 4 tonos
- **Falta:** Guardar en Calendar directamente, vista previa, A/B testing
- **Prioridad:** ALTA — Funciona pero está aislado

### 🎨 DesignStudioPanel — Estado: ⚠️ PARCIAL
- **Tiene:** Canvas tldraw, brand kit, AI tools (bg removal), export SVG
- **Falta:** Export PNG/JPG real, templates, auto-save a Supabase, formato enforcement
- **Prioridad:** ALTA — Necesita ser utilizable sin Canva

### 🎬 VideoEditingPanel — Estado: 🆕 NUEVO (hoy)
- **Tiene:** Upload, ffmpeg processing, progress bar, download, chat agent
- **Falta:** Integración con transcript/Whisper, subtítulos reales quemados, segment editor visual, integración con Calendar
- **Prioridad:** CRÍTICA — Es el módulo que más necesita Nicola

### 📊 DashboardPanel — Estado: ❌ DEMO
- **Tiene:** UI con gráficas
- **Falta:** Datos reales de Instagram API (usa constants.ts), comparativas, tendencias
- **Prioridad:** ALTA — Decisiones sin datos no son decisiones

### 🔗 ConnectionsPanel — Estado: ⚠️ PARCIAL
- **Tiene:** UI para conectar APIs
- **Falta:** Conexiones reales funcionando (Google, Instagram, Make.com)
- **Prioridad:** CRÍTICA — Sin conexiones, nada funciona

### 🤖 AIStudioPanel — Estado: ⚠️ PARCIAL
- **Tiene:** Interface de chat con Gemini
- **Falta:** Contexto RAG del brand, memoria entre sesiones, acciones ejecutables
- **Prioridad:** MEDIA — Mejora incremental

### 🖼️ BackgroundGenerator — Estado: ⚠️ PARCIAL
- **Tiene:** Generación de backgrounds con AI
- **Falta:** Integración con Design Studio, exportación real
- **Prioridad:** BAJA

### 📝 ScriptsPanel — Estado: ❌ PLACEHOLDER
- **Prioridad:** MEDIA — Debería ser el banco de scripts con templates

### 📱 StoriesPanel — Estado: ❌ PLACEHOLDER
- **Prioridad:** MEDIA — Stories son 60% del contenido de Nicola

### 👤 ClientPanel — Estado: ❌ PLACEHOLDER
- **Prioridad:** MEDIA — Datos de clientes de coaching/retiros

### 📚 MethodologyPanel — Estado: ❌ PLACEHOLDER
- **Prioridad:** BAJA — Contenido estático

### 🌍 DACHPanel — Estado: ❌ PLACEHOLDER
- **Prioridad:** MEDIA — Mercado DACH es clave para Nicola

### 🏔️ MaterializationPanel — Estado: ❌ PLACEHOLDER
- **Prioridad:** BAJA

### 🔮 ShamanicTemplateEngine — Estado: ⚠️ ESPECIAL
- **Tiene:** Generación con templates chamánicos
- **Falta:** Conexión real con brand voice
- **Prioridad:** BAJA — Nicho específico

---

## 3. ARQUITECTURA PROPUESTA — Hub de Producción

### Principios:
1. **Workflow-first** — Todo fluye a través de un pipeline: Idea → Contenido → Aprobación → Publicación → Métricas
2. **Data-connected** — Un cambio en Generator actualiza Calendar, no hay duplicación
3. **Agent-driven** — La IA no genera texto suelto, genera contenido listo para publicar
4. **Mobile-first** — Nicola opera desde el celular, el hub debe ser usable en móvil

### Módulos consolidados (de 19 → 10):

```
┌─────────────────────────────────────────────────────┐
│                    HOME / DASHBOARD                   │
│         KPIs reales · Feed · Acciones rápidas        │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│          │          │          │          │         │
│  CREAR   │ PLANIFICAR│ GESTIONAR│ ANALIZAR │ CONFIG │
│          │          │          │          │         │
│ Content  │ Calendar │  Assets  │ Metrics  │ Connect│
│ Studio   │ Schedule │  Library │ Insights │ ions    │
│          │          │          │          │         │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌─────┐│
│ │Gener.│ │ │Calend│ │ │Photos│ │ │IG API│ │ │APIs ││
│ │AI    │ │ │ar    │ │ │Videos│ │ │Meta  │ │ │Keys ││
│ │Video │ │ │Sync  │ │ │Docs  │ │ │Trends│ │ │Auth ││
│ │Design│ │ │ICS   │ │ │Brand │ │ │Comp  │ │ │Webh.││
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └─────┘│
│          │          │          │          │         │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│                    AGENT LAYER                        │
│    Content Agent · Video Agent · Analytics Agent      │
└─────────────────────────────────────────────────────┘
```

### 10 Módulos Propuestos:

| # | Módulo | Panels que absorbe | Funcionalidad core |
|---|--------|--------------------|--------------------|
| 1 | **Home** | HomePanel | Dashboard con KPIs reales, feed de actividad, acciones rápidas |
| 2 | **Content Studio** | Generator + AI Studio + Design Studio | Crear contenido de principio a fin: texto, imagen, video |
| 3 | **Video Edit** | VideoEditing (nuevo) | Edición de video con IA, subtítulos, processing real |
| 4 | **Calendar** | CalendarPanel | Planificación editorial, scheduling, aprobación, publicación |
| 5 | **Asset Library** | Studio + Image Editor + Background Gen | Biblioteca de fotos, videos, templates, brand kit |
| 6 | **Analytics** | Dashboard + Simulator | Métricas reales de IG, comparativas, tendencias, predicciones |
| 7 | **Clients** | Client + Methodology + DACH | CRM de clientes, embudos, retiros |
| 8 | **Stories** | Stories + Scripts | Creación rápida de stories y scripts |
| 9 | **Connections** | ConnectionsPanel | APIs, webhooks, automatizaciones |
| 10 | **Settings** | (nuevo) | Perfil, preferencias, onboarding, billing |

---

## 4. FUNCIONALIDADES CRÍTICAS PARA PRODUCCIÓN

### 🔴 Prioridad 1 — Sin esto no se puede salir a producción

#### 4.1 Flujo de Aprobación de Contenido
**Problema actual:** No hay forma de aprobar contenido antes de publicar.  
**Solución:** 
- Workflow: Borrador → Pendiente aprobación → Aprobado → Programado → Publicado
- Notificación por email/WhatsApp a Nicola cuando hay contenido pendiente
- Botón "APROBAR" / "RECHAZAR" en el hub y por link mágico
- Integración con Make.com para publicación automática vía Buffer

#### 4.2 Publicación Real a Instagram
**Problema actual:** Calendar tiene CRUD pero no publica.  
**Solución:**
- Conexión real con Meta Graph API (ya existe metaService.ts)
- OAuth flow para conectar cuenta de Instagram
- Publicación directa de imágenes/video
- Scheduling con Meta API o Buffer
- Fallback: exportar a Buffer si Meta API no permite el formato

#### 4.3 Métricas en Tiempo Real
**Problema actual:** Dashboard usa datos estáticos.  
**Solución:**
- Meta Graph API → reach, impressions, engagement, saves, follows
- Cron job que actualiza cada 6 horas
- Analytics cache con stale-while-revalidate (ya existe analyticsCache.ts)
- Comparativa semana a semana, pilar a pilar

#### 4.4 Asset Library Real
**Problema actual:** Upload suelto, sin organización, sin búsqueda.  
**Solución:**
- Supabase Storage con carpetas por tipo (fotos_valle, videos_brutos, templates)
- Metadata en Firestore (tags, pilar, fecha, uso)
- Búsqueda por tags y pilares
- Vista previa en grid con filtros
- Conexión directa desde Content Studio

#### 4.5 Seguridad — Eliminar tokens hardcodeados
**Problema actual:** NEMO_API_TOKEN y SUPABASE_ANON_KEY en el código fuente.  
**Solución:**
- Mover TODOS los secrets a .env
- Variables de entorno con VITE_ prefix
- Firebase config por environment
- .env.example para documentación

---

### 🟡 Prioridad 2 — Importante para adopción

#### 4.6 Content Pipeline Conectado
- Generator → Calendar (1 click para planificar)
- Video Edit → Asset Library (output se guarda automáticamente)
- Asset Library → Calendar (seleccionar asset para post)
- Calendar → Analytics (medir rendimiento por pilar)

#### 4.7 Templates de Contenido
- Templates por pilar (5 templates por pilar = 25 total)
- Templates de carrusel (7 slides con estructura del PROMPT_MAESTRO)
- Templates de Reel (hook-body-CTA)
- Templates de email (seguimiento, nurturing, venta de retiro)

#### 4.8 Video Editing Mejorado
- Transcript real con Whisper (ya usado en scripts Python)
- Segment editor visual (timeline para seleccionar segmentos)
- Preview del video antes de procesar
- Subtítulos quemados con sincronización real
- Integración con Asset Library

#### 4.9 Chat Agent Contextual
- RAG con PROMPT_MAESTRO.md, VOZ_DE_MARCA.md, posts históricos
- Memoria entre sesiones (Firestore)
- Acciones ejecutables: "genera un reel sobre X" → genera contenido + programa
- Aprobación por WhatsApp (Make.com webhook)

#### 4.10 CRM Básico
- Lista de clientes con estado (lead → interesado → comprador → VIP)
- Embudo: Instagram DM → Clarity Session → Retiro
- Seguimiento de interacciones
- Etiquetas por tipo (coaching, retiro, online)

---

### 🟢 Prioridad 3 — Nice to have

#### 4.11 Automatización Make.com
- Conexión bidireccional con el hub
- Webhooks para eventos (nuevo contenido, métricas, leads)
- Escenarios del CAPA1_INSTAGRAM_FLUJO.md implementados

#### 4.12 DACH Market Intelligence
- Datos demográficos del mercado DACH
- Horarios óptimos de publicación por zona
- Tendencias de contenido por temporada
- Análisis de competencia

#### 4.13 Multi-idioma inteligente
- Generación automática DE + EN basada en el mismo contenido
- Adaptación cultural (no solo traducción)
- Detección de idioma del público

---

## 5. MODELO DE NEGOCIO DE NICOLA — ALINEACIÓN

### Productos (del PROMPT_MAESTRO):

| Categoría | Productos | Hub Module | Funcionalidad |
|-----------|-----------|------------|---------------|
| Lead Gen | Meditationsführer (gratis) | Content Studio | Lead magnet, landing, download |
| Low-ticket | Mini Workshop (27-47€), Yoga Pass (15-79€/mes) | Calendar + Stories | Promoción en stories, link en bio |
| Mid-ticket | Clarity Session (150€), Emotional Mastery (197-997€) | Clients CRM | Seguimiento, nurturing, booking |
| High-ticket | Mentorado (3.5K-5.9K), Retiros (1.8K-3.5K) | Clients + Calendar | Embudo completo, CRM, scheduling |
| Recurring | Inner Circle (97-147€/mes) | Clients | Renovación, contenido exclusivo |

### Funcionalidades alineadas con revenue:

1. **Content Studio** → Genera contenido que alimenta TODOS los pilares → TODOS los productos
2. **Calendar** → Programa posts que generan leads → Lead Gen + Low-ticket
3. **Video Edit** → Reels de testimonios y valle → High-ticket (retiros)
4. **Analytics** → Mide qué contenido vende → Optimización de todo
5. **Clients CRM** → Gestiona leads hasta conversión → High-ticket
6. **Connections** → Make.com + Instagram → Automatización completa

### KPIs del hub que deben verse en el Dashboard:
- **Posts publicados / semana** (meta: 5)
- **Engagement rate por pilar** (meta: >5%)
- **Leads generados / mes** (meta: 20)
- **Conversiones a Clarity Session** (meta: 5/mes)
- **Retiros vendidos / trimestre** (meta: 3)
- **Revenue mensual por canal**

---

## 6. PLAN DE IMPLEMENTACIÓN

### Sprint 1 (Semana 1-2): Fundación
- [ ] Eliminar tokens hardcodeados → .env
- [ ] Conectar Dashboard con Meta API real (analyticsCache ya existe)
- [ ] Implementar flujo de aprobación en Calendar
- [ ] Conectar Generator → Calendar (1 click)
- [ ] Asset Library básica (Supabase + Firestore metadata)

### Sprint 2 (Semana 3-4): Contenido
- [ ] Video Edit: transcript con Whisper, segment editor, subtítulos reales
- [ ] Content Studio unificado (Generator + Design + Video en tabs)
- [ ] Templates por pilar (25 templates)
- [ ] Preview de contenido antes de publicar

### Sprint 3 (Semana 5-6): Publicación
- [ ] OAuth con Instagram/Meta
- [ ] Publicación directa desde Calendar
- [ ] Scheduling con Buffer como fallback
- [ ] Notificaciones WhatsApp/email (Make.com webhooks)

### Sprint 4 (Semana 7-8): Inteligencia
- [ ] RAG Agent con contexto de marca
- [ ] CRM básico (Clientes + embudo)
- [ ] DACH Market data
- [ ] Make.com bidireccional

### Sprint 5 (Semana 9-10): Producción
- [ ] Testing E2E
- [ ] Optimización móvil
- [ ] Deploy a producción (Vercel)
- [ ] Monitoreo y errores (Sentry ya está integrado)
- [ ] Onboarding real para nuevos usuarios

---

## 7. RESUMEN EJECUTIVO

### Veredicto: **El hub tiene los bloques, pero necesita cemento.**

Hay **19 paneles** que deberían ser **10 módulos** conectados. El código funciona como demo pero no como herramienta de producción. La brecha principal es:

1. **Datos desconectados** → Workflow conectado
2. **UI sin backend** → APIs reales conectadas  
3. **Contenido aislado** → Pipeline de aprobación → publicación
4. **Métricas falsas** → Datos reales de Instagram

### Lo que funciona BIEN:
- Identidad visual y UX
- Generator con Gemini
- Calendar CRUD
- Video Edit pipeline (nuevo, ffmpeg real)
- Brand voice (PROMPT_MAESTRO.md)
- Estructura del proyecto (React + Firebase + Supabase)

### Lo que NECESITA urgentemente:
- **Flujo de aprobación** — Sin esto, Nicola no puede confiar en la publicación automática
- **Métricas reales** — Sin datos, no hay decisiones
- **Publicación real** — Sin esto, el hub es solo un editor glorificado
- **Asset Library** — Sin esto, Nicola trabaja doble buscando fotos

### Estimación: 8-10 semanas para producción

Con el plan de sprints arriba, el hub puede estar en producción en **8-10 semanas**, con las funcionalidades críticas listas en 4 semanas.

---

*Auditoría realizada por Flip ⚡ — 2026-05-01*
*Basada en: código fuente, PROMPT_MAESTRO.md, CAPA1_INSTAGRAM_FLUJO.md, SKILLS.md, y documentación del proyecto*