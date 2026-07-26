import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center text-on-surface">
          <div className="bg-surface-light/40 border border-error/30 rounded-xl p-8 max-w-lg w-full glass-panel">
            <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-on-surface-variant mb-6">
              We encountered an unexpected error while rendering this report. 
              The data might be in an older, incompatible format.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-primary/20 hover:bg-primary/30 text-primary px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
