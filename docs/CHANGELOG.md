# Changelog — Nicola Schaefer Hub

## v4.1.1 (2026-05-01) — Sprint 1: SEC-01 Complete

### Security
- **SEC-01**: Removed all hardcoded tokens from source code
  - `contentAgentService.ts`: NEMO_TOKEN and SUPABASE_ANON_KEY moved to env vars
  - Added `VITE_NEMO_API_URL`, `VITE_NEMO_TOKEN`, `VITE_SUPABASE_BUCKET` to .env.example
  - Verified: `grep -r "nmv_usr\|sb_publishable\|AIzaSy" src/` returns 0 results

### Documentation
- **AUDITORIA_COMPLETA.md**: Full platform audit with module map and sprint plan
- **docs/CHANGELOG.md**: Versioned changelog following v4 convention
- **docs/DEVELOPMENT.md**: Development guide with architecture, commands, env vars
- **docs/markov-baseline.md**: Markov chain validation baseline results

### Skills Created
- **nicola-hub-dev**: Skill for development, testing, and sprint management
- **hub-quality-gate**: Skill for quality gates, Markov validation, and acceptance criteria

### Testing Infrastructure
- **tests/markov/validate_flow.py**: Markov chain flow validator (5 flows, 1000 simulations each)
- Current baseline: All 5 flows FAIL (completion 56-74%, dead-ends 26-44%)
- Target: All flows PASS (completion >70%, dead-ends <10%)

---

## v4.1.0 (2026-05-01) — Sprint 0: Video Module + Audit

### Added
- **Video Editing Module** (NEW)
  - `VideoEditingPanel.tsx` — Panel completo con configuración, upload, progreso y chat IA
  - `videoAgentService.ts` — Servicio de agente IA con Gemini y fallback local
  - `server/videoServer.ts` — Backend Express para procesamiento de video con ffmpeg
  - Tipos de video: Testimonial (45s), Reel (30s), Story (15s), Educativo (60s)
  - Toggle de subtítulos ON/OFF con configuración (tamaño, posición, opacidad)
  - Procesamiento de audio: noise reduction, compression, loudnorm
  - Filtros de video: brightness, contrast, saturation, sharpening, denoise
  - Fade in/out configurable
  - Brand overlay text
  - Chat con agente IA para instrucciones en lenguaje natural
  - Barra de progreso en tiempo real durante el procesamiento
  - Botones de descarga, email y WhatsApp
  - Auto-cleanup: archivos temporales se borran 30 min después de completar
  - Vite proxy `/api/video/*` → backend puerto 3001
  - i18n: claves ES y DE para todo el módulo
  - Nav item "Video Edit" con badge NEW

### Added (Infrastructure)
- `multer` and `cors` dependencies for video upload handling
- `npm run video-server` script in package.json
- Health check endpoint for video server
- Job polling system for progress updates

### Changed
- `App.tsx` — Added Video Edit tab in sidebar, mobile menu
- `videoAgentService.ts` — Rewrote with real API calls to backend server

### Security
- ⚠️ PENDING: NEMO_API_TOKEN and SUPABASE_ANON_KEY still hardcoded in contentAgentService.ts

---

## v4.0.0 (2026-04-26) — Initial Tracked Version

### Existing Features (pre-changelog)
- React 19 + TypeScript + Vite + Tailwind CSS 4
- Firebase Auth + Firestore
- Supabase Storage integration
- Canva SDK integration
- Gemini AI content generation
- Calendar with CRUD, ICS export, Google Calendar sync
- Generator with brand voice (PROMPT_MAESTRO)
- Design Studio with tldraw
- AI Studio panel
- Image Editor
- Background Generator
- Shamanic Template Engine
- 19 panels total
- Bilingual (ES/DE)
- Dark/Light theme
- Onboarding wizard
- Error boundaries
- Responsive design

---

## Versioning Convention (v4.x.y)

- **v4.x.y** where:
  - **4** = Major version (content creator hub)
  - **x** = Sprint number / feature set (incremented per sprint)
  - **y** = Patch / bug fix

### Examples:
- `v4.1.0` = Sprint 0 (video module) — first tracked version
- `v4.1.1` = Bug fix in video module
- `v4.2.0` = Sprint 1 (foundation)
- `v4.3.0` = Sprint 2 (content)

### Commit Convention:
```
feat(module): description v4.x.y
fix(module): description v4.x.y
docs(module): description v4.x.y
test(module): description v4.x.y
refactor(module): description v4.x.y
```

### Release Checklist:
1. Update version in package.json
2. Update this CHANGELOG.md
3. Run `npx tsc --noEmit` — must pass
4. Run `npm run test` — must pass
5. Run `npm run build` — must succeed
6. Commit with tag: `git tag v4.x.y && git push --tags`