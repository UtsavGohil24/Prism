import React from 'react'

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="bg-card border border-border rounded-xl backdrop-blur-sm shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 border border-danger/20">
          <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Error text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Analysis Failed</h2>
          <p className="text-sm text-textmuted leading-relaxed">
            {message || 'An error occurred while analyzing the PR. Please check the URL and try again.'}
          </p>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-violet focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
