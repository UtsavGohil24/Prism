import React, { useEffect, useState } from 'react'

export default function LoadingScreen({ onFinished }) {
  const [step, setStep] = useState(1)

  useEffect(() => {
    // Advance steps sequentially with fast timing for quick response
    const t1 = setTimeout(() => setStep(2), 400)
    const t2 = setTimeout(() => setStep(3), 800)
    const t3 = setTimeout(() => {
      if (onFinished) onFinished()
    }, 1200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onFinished])

  const steps = [
    { id: 1, label: 'Fetching PR diff from GitHub...' },
    { id: 2, label: 'Running AI risk analysis...' },
    { id: 3, label: 'Building your report...' }
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Animated Orb Loader */}
      <div className="relative mb-12 flex h-24 w-24 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/20 opacity-75"></span>
        <span className="absolute inline-flex h-16 w-16 animate-pulse rounded-full bg-violet/40"></span>
        <div className="relative h-10 w-10 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/50">
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="w-full max-w-md bg-card border border-border rounded-xl backdrop-blur-sm p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-textmuted text-center mb-2">
          Analyzing PR Diff
        </h3>
        <div className="space-y-3">
          {steps.map((s) => {
            const isCompleted = step > s.id
            const isActive = step === s.id
            const isPending = step < s.id

            return (
              <div 
                key={s.id}
                className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all duration-300 ${isActive ? 'bg-accent/5 border-accent text-textpri scale-[1.02]' : 'bg-bg/25 border-border/50 text-textmuted'}`}
              >
                {/* Icon indicator */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <svg className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : isActive ? (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
                    </div>
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-border mx-1.5"></div>
                  )}
                </div>
                {/* Step label */}
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-textmuted'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
