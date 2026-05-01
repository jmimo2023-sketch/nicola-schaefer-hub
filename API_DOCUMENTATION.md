# API Documentation - Nicola Schaefer Hub

## Services Overview

This document describes the internal APIs and service interfaces for the Nicola Schaefer Hub application.

---

## 1. Firebase Service (`services/firebase.ts`)

### Initialization

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, getFirestore } from 'firebase/firestore';

// Initialize with config from environment
initializeApp(firebaseConfig);
```

### Authentication

```typescript
// Sign in with Google
signIn(): Promise<User>

// Sign out
signOut(): Promise<void>

// Get current user
currentUser: User | null

// Auth state listener
onAuthStateChanged(callback: (user: User | null) => void)
```

### Firestore Operations

```typescript
// Database instance
db: Firestore

// Collections
posts, assets, methodology, calendar_posts, analytics, cache

// Operations
addDoc(collection(db, 'posts'), data) // Create
getDoc(doc(db, 'posts', id)) // Read single
updateDoc(doc(db, 'posts', id), data) // Update
deleteDoc(doc(db, 'posts', id)) // Delete
onSnapshot(query, callback) // Real-time listener
```

---

## 2. Supabase Service (`services/supabaseService.ts`)

### Configuration

```typescript
// Check if configured
isSupabaseConfigured(): boolean

// Environment variables
VITE_SUPABASE_URL  // e.g., https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY
```

### Storage Operations

```typescript
// Upload asset
uploadAsset(
  file: File,
  folder: 'images' | 'videos' | 'templates'
): Promise<string> // Returns public URL

// List assets
listAssets(folder: AssetType): Promise<Asset[]>

// Delete asset
deleteAsset(folder: string, fileName: string): Promise<void>
```

### Types

```typescript
interface Asset {
  id: string;
  name: string;
  publicUrl: string;
  mimeType: string;
  folder: string;
  createdAt: string;
}

type AssetType = 'images' | 'videos' | 'templates';
```

---

## 3. Canva Service (`services/canvaService.ts`)

### Initialization

```typescript
// Initialize Canva SDK
initCanva(): Promise<void>

// Check availability
isCanvaAvailable(): boolean

// Environment
VITE_CANVA_API_KEY
```

### Design Creation

```typescript
// Create design with uploaded media
createDesignWithMedia(
  assetUrl: string,
  designType: DesignType,
  options: DesignOptions
): Promise<void>

// Create from Canva library assets
createDesignWithCanvaAssets(
  designType: DesignType,
  options: DesignOptions
): Promise<void>

// Create from brand template
createBrandedDesign(
  templateId: string,
  data: Record<string, string>,
  options: DesignOptions
): Promise<void>
```

### Design Types

```typescript
type DesignType =
  | 'instagram_post'
  | 'instagram_story'
  | 'instagram_reel'
  | 'youtube_thumbnail'
  | 'youtube_shorts'
  | 'facebook_post'
  | 'linkedin_post'
  | 'presentation'
  | 'custom'
```

### Options

```typescript
interface DesignOptions {
  title?: string;
  onPublish?: (design: PublishedDesign) => void;
  onError?: (error: Error) => void;
}

interface PublishedDesign {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
}
```

---

## 4. Gemini Service (`services/geminiService.ts`)

### Content Generation

```typescript
// Generate content with AI
generateContent(
  prompt: string,
  options?: GenerationOptions
): Promise<string>

// Generate caption
generateCaption(
  topic: string,
  audience: Audience,
  tone: Tone
): Promise<string[]>

// Generate script
generateScript(
  contentType: ContentType,
  pillar: Pillar,
  options?: ScriptOptions
): Promise<Script>
```

### Content Types

```typescript
type ContentType =
  | 'reel_script'
  | 'caption'
  | 'story_sequence'
  | 'email'
  | 'video_script_with_hook'
  | 'engaging_post_caption'
  | 'multi_slide_story'
  | 'email_sequence_content'
```

### Pillars

```typescript
type Pillar =
  | 'emotion_as_compass'
  | 'boundaries_without_guilt'
  | 'closing_the_gap'
  | 'relationship_patterns'
  | 'vilcabamba_lifestyle'
```

### Audiences

```typescript
type Audience =
  | 'primary_audience'    // Women 35-50 DACH
  | 'therapy_experienced'  // With therapy experience
  | 'aspirational'          // On the path
```

### Tones

```typescript
type Tone =
  | 'body_near'       // Direct, warm, from body
  | 'atmospheric'      // Mystical, not esoteric
  | 'invitation'       // Question instead of statement
  | 'mirror'           // She feels addressed
```

---

## 5. Meta Service (`services/metaService.ts`)

### Instagram Analytics

```typescript
// Get account info
getAccountInfo(accessToken: string): Promise<InstagramAccount>

// Get media insights
getMediaInsights(mediaId: string, accessToken: string): Promise<MediaInsights>

// Get audience insights
getAudienceInsights(accessToken: string): Promise<AudienceInsights>

// Get optimal posting times
getOptimalPostingTimes(): TimeSlot[]
```

### Publishing (Planned)

```typescript
// Create media object
createMedia(
  imageUrl: string,
  caption: string,
  accessToken: string
): Promise<string> // Returns media ID

// Publish media
publishMedia(
  mediaId: string,
  instagramAccountId: string,
  accessToken: string
): Promise<string> // Returns post ID
```

### Types

```typescript
interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

interface MediaInsights {
  id: string;
  caption: string;
  media_type: string;
  timestamp: string;
  insights: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    engagement: number;
  };
}

interface TimeSlot {
  hour: number;
  label: string;
  isOptimal: boolean;
}
```

---

## 6. Analytics Cache Service (`services/analyticsCache.ts`)

### Caching Operations

```typescript
// Get cached analytics
getCachedAnalytics(): Promise<CacheEntry<AnalyticsData> | null>

// Set analytics cache
setCachedAnalytics(data: AnalyticsData): Promise<void>

// Check if cache is stale
isCacheStale(entry: CacheEntry<AnalyticsData> | null): boolean

// Get with fallback (stale-while-revalidate)
getAnalyticsWithFallback(
  fetcher: () => Promise<AnalyticsData>
): Promise<{ data: AnalyticsData | null; isStale: boolean; source: 'api' | 'cache' }>

// Clear cache
clearAnalyticsCache(): Promise<void>
```

### Configuration

```typescript
CACHE_DURATION = 15 * 60 * 1000  // 15 minutes
STALE_DURATION = 60 * 60 * 1000    // 1 hour
```

---

## 6. Calendar Service (`panels/CalendarPanel.tsx`)

### Task Types

```typescript
type ContentType = 'image' | 'video' | 'reel' | 'story' | 'task';
type TaskStatus = 'draft' | 'scheduled' | 'published' | 'completed' | 'failed';
type Priority = 'low' | 'medium' | 'high';
type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';
type Reminder = 'none' | '5min' | '15min' | '30min' | '1hour' | '1day';
```

### Task Interface

```typescript
interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  date: string;           // YYYY-MM-DD
  time: string;          // HH:MM
  status: TaskStatus;
  description?: string;  // Extended description
  location?: string;     // Optional location
  recurrence?: Recurrence;
  reminder?: Reminder;
  priority?: Priority;
  color?: string;         // Custom color
  tags?: string[];       // Array of tags
  duration?: number;      // Duration in minutes
  assetUrl?: string;
  caption?: string;
  hashtags?: string[];
  platform: 'instagram' | 'facebook' | 'both';
  createdAt: any;
  publishedAt?: any;
}
```

### Features

- **Manual Task Creation**: Full modal form with all task fields
- **Hover Tooltips**: Show task details on mouse hover
- **Day Tooltips**: Quick-add button when hovering empty day
- **Drag & Drop**: Move tasks between days
- **Filters**: Filter by status and content type
- **Export**: ICS format for All/Month/Week

### Date Range

```typescript
MIN_YEAR = 2024
MAX_YEAR = 2030
```

---

### ICS Export

```typescript
// Export all posts to ICS format
exportToICS(): void

// Export posts for current month
exportMonthToICS(): void

// Export posts for a specific day
exportDayToICS(date: Date): void
```

### Google Calendar Integration

```typescript
// Connect to Google Calendar
connectGoogleCalendar(): Promise<void>

// Disconnect from Google Calendar
disconnectGoogleCalendar(): void

// Sync scheduled posts to Google Calendar
syncToGoogleCalendar(): Promise<void>

// Import events from Google Calendar
importFromGoogleCalendar(): Promise<void>
```

### Date Range

```typescript
// Calendar supports years 2024-2030
MIN_YEAR = 2024
MAX_YEAR = 2030
```

---

## 8. Google Assets Service (`services/googleAssetsService.ts`)

### Initialization

```typescript
// Initialize Google APIs
initGoogleLibraries(): Promise<void>

// Check if connected
currentAccessToken: string | null
```

### Asset Picker

```typescript
// Open Google Photos picker
openAssetPicker(
  callback: (assets: GoogleAsset[]) => void
): void

interface GoogleAsset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  createdDate: string;
}
```

---

## 9. Translation Context (`lib/TranslationContext.tsx`)

### Usage

```tsx
import { useTranslation } from './lib/TranslationContext';

function MyComponent() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div>
      <p>{t('hello')}</p> {/* Returns translated string */}
      <button onClick={() => setLang('es')}>ES</button>
      <button onClick={() => setLang('de')}>DE</button>
    </div>
  );
}
```

### Available Translations

| Key | Spanish | German |
|-----|---------|--------|
| navHome | Inicio | Start |
| navStudio | Studio | Studio |
| navCalendar | Calendario | Kalender |
| navGenerator | Generador IA | KI-Generator |
| navInstagram | Instagram | Instagram |
| quickActions | Acciones rápidas | Schnellaktionen |
| createPost | Crear Post | Post erstellen |
| schedule | Programar | Planen |

Full list in `lib/TranslationContext.tsx`

---

## Error Handling

All services implement consistent error handling:

```typescript
try {
  await someService.operation();
} catch (error) {
  // Services log to console
  console.error('Operation failed:', error);
  // UI shows toast notification
  toast.error('Operation failed', { description: error.message });
}
```

### Error Boundary

Wrap any component with ErrorBoundary for graceful error handling:

```tsx
<ErrorBoundary onError={(error) => logError(error)}>
  <ComponentThatMightFail />
</ErrorBoundary>
```

---

## Data Flow

### Content Creation Flow

```
User Action → Service → Firestore → UI Update
                ↓
            Toast Notification
```

### AI Generation Flow

```
User Input → Gemini API → Parse Response → Display
              ↓
          Toast (success/error)
```

### Analytics Flow

```
Meta API → Cache Layer → Firestore → Dashboard
              ↓
          Fallback (stale data)
```

---

## Rate Limits

| Service | Limit | Window |
|---------|-------|--------|
| Gemini | 60 requests | per minute |
| Supabase | 100 requests | per second |
| Meta API | Varies | By permission |

---

**Last updated:** 2026-04-27
**Version:** 1.3