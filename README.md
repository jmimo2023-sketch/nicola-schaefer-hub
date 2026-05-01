# Nicola Schaefer Hub

**Content Intelligence Hub for Instagram Creators**

![Version](https://img.shields.io/badge/version-2.0.0--alpha)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![License](https://img.shields.io/badge/license-Apache--2.0-green)

---

## Tabla de Contenidos

- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Components](#components)
- [Services](#services)
- [Testing](#testing)
- [Deployment](#deployment)
- [Changelog](#changelog)

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+ or pnpm 8+
- Firebase project (Auth + Firestore)
- Supabase project (Storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/jmimo2023-sketch/nicola-schaefer-hub.git
cd nicola-schaefer-hub

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# See Environment Variables section below
```

### Environment Variables

```bash
# .env file
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_CANVA_API_KEY=your_canva_api_key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Meta/Instagram
VITE_META_APP_ID=your_meta_app_id
VITE_META_APP_SECRET=your_meta_secret

# Optional
VITE_MAKE_WEBHOOK_URL=your_make_webhook_url
VITE_CAPCUT_API_KEY=your_capcut_key
```

### Running

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

**URL:** http://localhost:3000

---

## Features

### ✅ Implemented

| Feature | Description | Status |
|---------|-------------|--------|
| **Content Studio** | Upload, manage, and edit media assets | Stable |
| **AI Generator** | Generate captions, scripts, and content with AI | Stable |
| **Calendar** | Visual scheduling with drag-and-drop, hover tooltips, manual task creation, full CRUD, ICS export, Google Calendar sync, 2024-2030 support | Stable |
| **Responsive Design** | Mobile-first layout, bottom navigation, touch-friendly, safe area support | Stable |
| **Analytics Dashboard** | Instagram metrics and KPI tracking | Stable |
| **Bilingual (ES/DE)** | Full i18n support for Spanish and German | Stable |
| **Onboarding Wizard** | First-run setup flow for new users | Stable |
| **Dark/Light Theme** | Theme toggle with persistence | Stable |
| **Error Boundaries** | Graceful error handling across all panels | Stable |
| **Loading Skeletons** | Professional loading states | Stable |
| **Toast Notifications** | Action feedback system | Stable |

### 🚧 In Development

| Feature | Description | ETA |
|---------|-------------|-----|
| Instagram Publishing | Post directly from Calendar | Week 4 |
| Multi-account Support | Manage multiple Instagram accounts | Week 8 |
| Team Collaboration | Share assets and scheduling with team | Week 12 |

---

## Architecture

### Tech Stack

```
Frontend
├── React 19.0.0 (UI Framework)
├── TypeScript 5.8 (Type Safety)
├── Tailwind CSS 4.1 (Styling)
├── Vite 6.2 (Build Tool)
├── Framer Motion 12 (Animations)
├── Recharts 3.8 (Charts)
├── Sonner 2.0 (Toasts)
└── React Router 6 (Navigation - if needed)

Backend Services
├── Firebase Auth (Authentication)
├── Firebase Firestore (Database)
├── Supabase Storage (Media)
├── Canva SDK (Design Automation)
├── Gemini AI (Content Generation)
└── Meta Graph API (Instagram Analytics)
```

### Project Structure

```
src/
├── App.tsx                 # Main app with routing
├── main.tsx               # Entry point
├── index.css              # Global styles
│
├── panels/                # Page-level components
│   ├── HomePanel.tsx         # Dashboard home
│   ├── StudioPanel.tsx       # Media management
│   ├── CalendarPanel.tsx     # Content scheduling
│   ├── GeneratorPanel.tsx    # AI content creation
│   ├── DashboardPanel.tsx    # Analytics
│   ├── ConnectionsPanel.tsx  # API configuration
│   ├── ScriptsPanel.tsx      # Script management
│   ├── StoriesPanel.tsx     # Stories management
│   └── OnboardingPanel.tsx   # First-run wizard
│
├── components/            # Reusable UI components
│   ├── ErrorBoundary.tsx     # Error handling wrapper
│   ├── EmptyState.tsx       # Empty state with guidance
│   ├── OnboardingWizard.tsx  # First-run setup
│   ├── SkeletonComponents.tsx # Loading states
│   └── Toast.tsx            # Toast notifications
│
├── services/              # API and external services
│   ├── firebase.ts           # Firebase init & auth
│   ├── supabaseService.ts    # Supabase storage
│   ├── canvaService.ts       # Canva SDK integration
│   ├── geminiService.ts      # AI content generation
│   ├── metaService.ts        # Instagram API
│   ├── googleAssetsService.ts # Google Photos integration
│   └── analyticsCache.ts     # Analytics caching layer
│
├── lib/                   # Utilities and contexts
│   ├── utils.ts              # Helper functions (cn)
│   ├── TranslationContext.tsx # i18n context
│   └── FirebaseProvider.tsx  # Firebase context
│
├── constants.ts           # Static data and constants
└── types/                 # TypeScript type definitions
```

---

## API Reference

### Services

#### `firebase.ts`

```typescript
// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Auth
signIn() // Google OAuth sign-in
signOut() // Sign out current user
currentUser // Current authenticated user

// Firestore
db // Firestore instance
collection(db, 'posts') // Collection reference
addDoc() // Add document
updateDoc() // Update document
deleteDoc() // Delete document
onSnapshot() // Real-time listener
```

#### `supabaseService.ts`

```typescript
// Storage operations
uploadAsset(file: File, folder: 'images' | 'videos' | 'templates'): Promise<string>
listAssets(folder: AssetType): Promise<Asset[]>
deleteAsset(folder: string, fileName: string): Promise<void>
isSupabaseConfigured(): boolean

// Types
interface Asset {
  id: string;
  name: string;
  mimeType: string;
  publicUrl: string;
  folder: string;
  createdAt: string;
}
```

#### `canvaService.ts`

```typescript
// Initialize Canva SDK
initCanva(): Promise<void>
isCanvaAvailable(): boolean

// Design operations
createDesignWithMedia(assetUrl: string, designType: DesignType, options: DesignOptions): Promise<void>
createDesignWithCanvaAssets(designType: DesignType, options: DesignOptions): Promise<void>
createBrandedDesign(templateId: string, data: object, options: DesignOptions): Promise<void>

// Types
type DesignType = 'instagram_post' | 'instagram_story' | 'instagram_reel' | 'youtube_thumbnail' | etc.
```

#### `geminiService.ts`

```typescript
// Content generation
generateContent(prompt: string, options?: GenerationOptions): Promise<string>

// Specific generators
generateCaption(topic: string, audience: Audience, tone: Tone): Promise<string[]>
generateScript(type: ContentType, pillar: Pillar, options?: ScriptOptions): Promise<Script>
```

---

## Components

### `<ErrorBoundary>`

Wraps components to catch and handle errors gracefully.

```tsx
<ErrorBoundary>
  <StudioPanel />
</ErrorBoundary>
```

### `<EmptyState>`

Displays guidance when no content is available.

```tsx
<EmptyState
  icon="media"
  title="Your images library is empty"
  description="Upload photos to get started"
  action={{
    label: "Upload Media",
    onClick: () => handleUpload()
  }}
  tip="Keep your brand visuals consistent!"
/>
```

### `<SkeletonGrid>`

Loading placeholder for asset grids.

```tsx
<SkeletonGrid items={10} />
```

---

## Testing

### Unit Tests (Vitest)

```bash
npm run test
```

### E2E Tests (Playwright)

```bash
# Install browsers
npx playwright install chromium

# Run tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run headed
npm run test:e2e:headed
```

### Test Structure

```
tests/
├── e2e/
│   ├── studio.spec.ts      # Studio panel tests
│   ├── calendar.spec.ts    # Calendar panel tests
│   ├── generator.spec.ts   # AI Generator tests
│   ├── dashboard.spec.ts   # Dashboard tests
│   └── onboarding.spec.ts  # Onboarding tests
└── unit/                   # Unit tests (future)
```

---

## Deployment

### Build

```bash
npm run build
# Output: dist/
```

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## Troubleshooting

### "Supabase not configured"

1. Check `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify Supabase project is running
3. Check CORS settings in Supabase dashboard

### "Canva SDK not loading"

1. Verify `VITE_CANVA_API_KEY` is set
2. Check Canva Developer Portal whitelist for your domain
3. Ensure Canva API key is active

### "Meta API 401 errors"

1. Go to Connections panel
2. Re-authenticate Instagram account
3. Check token expiration

### "Firebase permission denied"

1. Check Firestore security rules
2. Verify authentication is working
3. Check browser console for specific errors

---

## Changelog

### v2.3.0 (2026-04-27)

**Responsive Design Overhaul:**
- Mobile-first responsive layout across all panels
- Bottom navigation bar for mobile devices
- Collapsible mobile menu with slide animation
- Touch-friendly tap targets (44px minimum)
- Responsive typography (fluid scaling with sm/md/lg breakpoints)
- Safe area support for notched devices
- Sidebar collapses to icons on smaller screens
- Grid layouts adapt from 1 to 4 columns based on viewport
- Charts and tables scroll horizontally on mobile
- Modal dialogs full-width on mobile

---

### v2.2.0 (2026-04-27)

**Calendar V5 - Ultimate Experience:**
- Manual task creation with full modal form
- Hover tooltips showing task details (title, description, date, time, duration, location, priority, tags, recurrence, reminder)
- Day hover tooltips with quick-add button
- Full CRUD operations (Create, Read, Update, Delete)
- Status management (Draft, Scheduled, Published, Completed, Failed)
- Priority levels (Low, Medium, High)
- Color coding for tasks
- Recurring tasks (Daily, Weekly, Monthly)
- Duration tracking (15min to 3 hours)
- Reminder settings (5min to 1 day before)
- Tags support with hashtag display
- Location field
- Filters by status and type
- Export options (All, Month, Week)
- Click on day cell to add task

---

### v2.1.0 (2026-04-26)

**Calendar Enhancements:**
- ICS/iCal export for all posts, month, or specific day
- Google Calendar connection, sync and import
- Video thumbnail preview in calendar cells
- Extended date range support (2024-2030)
- Year selector for quick navigation

---

### v2.0.0 (2026-04-26)

**New Features:**
- Error Boundaries for all panels
- Loading Skeleton components
- Toast Notifications enhancement
- Analytics Cache with stale-while-revalidate
- Playwright E2E testing setup
- Bundle optimization (vendor chunks)

**Bug Fixes:**
- Fixed duplicate translation keys
- Fixed Studio empty state
- Fixed Calendar loading state

**Documentation:**
- Complete API documentation
- Testing guide
- Troubleshooting section

---

## License

Apache 2.0 - See [LICENSE](LICENSE)

---

**Built with ❤️ by Claude Code for Nicola Schaefer