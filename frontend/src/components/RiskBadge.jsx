import React from 'react'

export default function RiskBadge({ level, type = 'risk' }) {
  const normalizedLevel = (level || '').toLowerCase()

  if (type === 'confidence') {
    let styles = 'bg-primary/10 text-primary border-primary/20'
    if (normalizedLevel === 'high') {
      styles = 'bg-primary/20 text-primary border-primary/40 font-bold'
    } else if (normalizedLevel === 'medium') {
      styles = 'bg-tertiary/20 text-tertiary border-tertiary/40'
    } else if (normalizedLevel === 'low') {
      styles = 'bg-error/10 text-error border-error/20'
    }
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${styles}`}>
        {level} Confidence
      </span>
    )
  }

  // Otherwise, default to risk level mapping
  let styles = 'bg-primary/10 text-primary border-primary/20'
  let label = 'Clean'

  if (normalizedLevel === 'high') {
    styles = 'bg-error/10 text-error border-error/20'
    label = 'High Risk'
  } else if (normalizedLevel === 'medium') {
    styles = 'bg-tertiary/10 text-tertiary border-tertiary/20'
    label = 'Med Risk'
  } else if (normalizedLevel === 'low' || normalizedLevel === 'clean') {
    styles = 'bg-primary/10 text-primary border-primary/20'
    label = 'Clean'
  } else {
    label = level || 'Unknown'
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${styles}`}>
      {label}
    </span>
  )
}
