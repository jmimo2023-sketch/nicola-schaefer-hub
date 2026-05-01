# Development Guide — Nicola Schaefer Hub v4

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND (React 19)              │
│  Vite + TypeScript + Tailwind CSS 4 + Framer    │
├──────────┬──────────┬──────────┬────────────────┤
│  Panels  │ Services │ Contexts │ Components     │
│ (19→10)  │ (14)     │ (i18n,   │ (ErrorBoundary,│
│          │          │  Firebase)│  Nav, Toast)   │
├──────────┴──────────┴──────────┴────────────────┤
│                    APIs                           │
├─────────┬──────────┬──────────┬─────────────────┤
│ Firebase│ Supabase │ Gemini   │ Video Server    │
│ Auth+DB │ Storage  │ AI       │ (Express+ffmpeg)│
├─────────┴──────────┴──────────┴─────────────────┤
│              EXTERNAL SERVICES                    │
├──────────┬──────────┬──────────┬────────────────┤
│ Meta API │ Canva SDK│ Make.com │ Buffer          │
└──────────┴──────────┴──────────┴────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app, navigation, panel routing |
| `src/constants.ts` | Static data (KPIs, client profiles) |
| `src/lib/TranslationContext.tsx` | i18n (ES/DE) |
| `src/lib/FirebaseProvider.tsx` | Firebase auth context |
| `src/services/firebase.ts` | Firebase init, auth, Firestore helpers |
| `src/services/videoAgentService.ts` | Video editing AI agent + API client |
| `server/videoServer.ts` | Express backend for ffmpeg processing |
| `AUDITORIA_COMPLETA.md` | Full audit (2026-05-01) |
| `SKILLS.md` | Original skills inventory |

## Adding a New Panel

1. Create `src/panels/MyPanel.tsx`
2. Import in `src/App.tsx`
3. Add nav item in `SidebarContent` and mobile menu
4. Add i18n keys in `src/lib/TranslationContext.tsx`
5. Wrap in `<ErrorBoundary>` in render

## Adding a New Service

1. Create `src/services/myService.ts`
2. Export singleton or class instance
3. Use in panels via import
4. Add env vars to `.env` and `.env.example`

## Testing

```bash
# Unit tests
npx vitest run

# E2E tests
npx playwright test

# Type check
npx tsc --noEmit

# Build
npm run build
```

## Deployment

```bash
# Video server (must run alongside frontend)
npm run video-server  # port 3001

# Frontend
npm run dev            # port 3000

# Production
npm run build          # output: dist/
vercel deploy          # or: npm run preview
```

## Environment Variables

```env
# .env.example
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_CANVA_API_KEY=
VITE_META_APP_ID=
VITE_META_APP_SECRET=
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_API_KEY=
VITE_MAKE_WEBHOOK_URL=
```

## Brand Guidelines (from PROMPT_MAESTRO.md)

- **Voice**: Warm, visionary, grounded. Not theory — lived experience.
- **NO**: NILAYA, high-performance, productivity, false scarcity, guaranteed results
- **YES**: Valle Sagrado, Vilcabamba, longevidad, sanación, Pachamama, ancestral
- **Languages**: German (primary DACH), English (international), Spanish (internal)
- **Hashtags core**: #nicolaschaefer #vilcabamba #vallesagrado #lifecoach