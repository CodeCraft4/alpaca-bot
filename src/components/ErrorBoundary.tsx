import React from 'react';

interface State {
  error: Error | null;
}

/** Stops one broken component from blanking the whole app: shows what happened and a reload button. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('UI error:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6">
        <div className="max-w-md w-full bg-white border border-brand-border rounded-2xl shadow-card p-6 text-center">
          <h1 className="text-lg font-bold text-brand-text">Something went wrong</h1>
          <p className="text-sm text-brand-muted mt-2 break-words">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-primary text-white hover:bg-brand-sidebar"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
