import React from 'react'
import { getModel, modelKeyOf, isFallback } from '../utils/models'

/**
 * Shows which model produced a report, and flags Groq fallbacks.
 * Uses the field the backend already returns:
 *   <ModelBadge modelUsed={report.model_used} className="justify-end" />
 */
export default function ModelBadge({ modelUsed, className = '' }) {
  const model = getModel(modelKeyOf(modelUsed))
  const fallback = isFallback(modelUsed)

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-outline-variant/50 text-[10px] font-bold tech-mono text-on-surface-variant"
        title={modelUsed || 'Gemini 2.5 Flash'}
      >
        <span className="material-symbols-outlined text-sm text-primary">{model.icon}</span>
        {model.full}
      </span>

      {fallback && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-outline-variant/50 text-[10px] font-bold tech-mono text-on-surface-variant"
          title={`${model.full} was unavailable, so this analysis was answered by Groq. Details: ${modelUsed}`}
        >
          <span className="material-symbols-outlined text-sm">swap_horiz</span>
          Answered by Groq fallback
        </span>
      )}
    </div>
  )
}
