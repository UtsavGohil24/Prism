import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-card border border-border rounded-xl backdrop-blur-sm shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {/* Warning Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warn/10 border border-warn/20">
          <svg className="h-8 w-8 text-warn" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">404 - Page Not Found</h2>
          <p className="text-sm text-textmuted leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        {/* Go Home button */}
        <button
          onClick={() => navigate('/')}
          className="w-full rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-violet focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}
