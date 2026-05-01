/**
 * Error Boundary Component
 * Catches errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-card border border-brd rounded-3xl p-10 max-w-lg text-center shadow-custom">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-rose-500" />
            </div>

            <h2 className="font-display text-2xl font-bold mb-3 text-ink">
              Something went wrong
            </h2>

            <p className="text-sm text-ink-muted mb-8 leading-relaxed">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {this.state.error && (
              <div className="bg-paper border border-brd rounded-2xl p-4 mb-6 text-left">
                <p className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest mb-2">
                  Error Details
                </p>
                <p className="text-xs text-ink-muted font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 bg-paper border border-brd px-6 py-3 rounded-xl font-bold text-sm hover:bg-brd transition-colors"
              >
                <Home size={16} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Panel-specific Error Boundary with retry
 */
interface PanelErrorBoundaryProps {
  children: ReactNode;
  panelName: string;
}

export function PanelErrorBoundary({ children, panelName }: PanelErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error) => {
        console.error(`Error in ${panelName}:`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Async operation wrapper with error handling
 */
interface AsyncWrapperProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

export class AsyncWrapper extends Component<AsyncWrapperProps, State> {
  constructor(props: AsyncWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AsyncWrapper error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.errorComponent || (
        <div className="p-8 text-center">
          <p className="text-rose-500 text-sm font-medium">Failed to load content</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-xs text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}