import { Component, type ReactNode } from 'react';

export default class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-background-dark p-6">
          <div role="alert" className="w-full max-w-md rounded-xl border border-surface-border bg-surface-dark p-6 space-y-4">
            <h1 className="text-xl font-bold text-white">We couldn't open this page.</h1>
            <p className="text-text-secondary">Reload to try again.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-5 py-3 font-bold text-background-dark hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Reload
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
