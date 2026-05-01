/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_CANVA_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_META_APP_ID: string;
  readonly VITE_META_APP_SECRET: string;
  readonly VITE_MAKE_WEBHOOK_URL: string;
  readonly VITE_CAPCUT_API_KEY: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google API types
interface Window {
  gapi: {
    load: (api: string, callback: () => void) => void;
    client: {
      init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
      calendar: {
        events: {
          insert: (config: { calendarId: string; resource: object }) => Promise<{ result: object }>;
          list: (config: { calendarId: string; timeMin: string; timeMax: string; singleEvents: boolean; orderBy: string }) => Promise<{ result: { items: object[] } }>;
        };
      };
    };
  };
}
