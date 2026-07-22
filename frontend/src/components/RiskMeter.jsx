import React, { useEffect, useState } from 'react'

export default function RiskMeter({ score = 0 }) {
  const [offset, setOffset] = useState(157.08)

  useEffect(() => {
    const t = setTimeout(() => {
      const calculatedOffset = 157.08 * (1 - score / 100)
      setOffset(calculatedOffset)
    }, 100)
    return () => clearTimeout(t)
  }, [score])

  let strokeColor = 'text-success'
  if (score >= 70) {
    strokeColor = 'text-danger'
  } else if (score >= 35) {
    strokeColor = 'text-warn'
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-32 w-56">
        <svg 
          className="h-full w-full" 
          viewBox="0 0 120 70"
        >
          {/* Background Arc */}
          <path
            d="M 10,60 A 50,50 0 0,1 110,60"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="157.08"
            className="text-border"
          />
          {/* Animated Gauge Arc */}
          <path
            d="M 10,60 A 50,50 0 0,1 110,60"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="157.08"
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${strokeColor}`}
          />
        </svg>
        {/* Score display inside/below the arc */}
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-end">
          <span className={`text-4xl font-extrabold tracking-tight ${strokeColor}`}>
            {score}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-textmuted">
            Risk Score
          </span>
        </div>
      </div>
    </div>
  )
}
