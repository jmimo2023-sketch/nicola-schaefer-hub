/**
 * Sentry Error Tracking Integration
 * Production-ready error monitoring and performance tracking
 */

import * as Sentry from '@sentry/react';

// Initialize Sentry if DSN is available
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Environment
    environment: import.meta.env.MODE,
    // Release tracking
    release: 'nicola-hub@2.0.0',
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
    ],
    // Set tags
    initialScope: {
      tags: {
        version: '2.0.0',
        platform: 'web',
      },
    },
  });
}

/**
 * Capture error with additional context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error (Sentry not configured):', error, context);
  }
}

/**
 * Capture message with level
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}]`, message);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, username?: string): void {
  if (SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now(),
    });
  }
}

/**
 * Performance transaction wrapper
 */
export async function traceTransaction<T>(
  name: string,
  callback: () => Promise<T>
): Promise<T> {
  if (SENTRY_DSN) {
    return Sentry.startSpan({ name }, callback);
  }
  return callback();
}

/**
 * React error boundary with Sentry integration
 */
export function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-card border border-brd rounded-3xl p-10 max-w-lg text-center">
            <h2 className="font-display text-2xl font-bold mb-3">Something went wrong</h2>
            <p className="text-sm text-ink-muted mb-6">
              We've been notified and will look into it.
            </p>
            <button
              onClick={resetError}
              className="bg-accent text-white px-6 py-3 rounded-xl font-bold"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

// Re-export everything from @sentry/react for convenience
export { Sentry };