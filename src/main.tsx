import { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './lib/FirebaseProvider.tsx';
import { TranslationProvider } from './lib/TranslationContext.tsx';

// Error boundary to catch render crashes and show error details
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Root render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: 'monospace', color: '#991b1b', background: '#fef2f2' }}>
          <h2>App Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error.stack || this.state.error.message}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 10, padding: '8px 16px', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

const rootEl = document.getElementById('root')!;

createRoot(rootEl).render(
  <RootErrorBoundary>
    <FirebaseProvider>
      <TranslationProvider>
        <App />
      </TranslationProvider>
    </FirebaseProvider>
  </RootErrorBoundary>
);