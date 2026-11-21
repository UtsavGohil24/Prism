import React from 'react'
import { MODELS, getModel } from '../utils/models'

/**
 * Compact model picker (three segmented buttons + a one-line description of
 * the selected model). Controlled component:
 *   <ModelSelector value={model} onChange={setModel} />
 */
export default function ModelSelector({ value, onChange, disabled = false }) {
  const selected = getModel(value)

  return (
    <div className="space-y-2 text-left">
      <span className="block text-xs font-bold tracking-wider tech-mono text-primary">
        ANALYSIS MODEL
      </span>

      <div role="radiogroup" aria-label="Analysis model" className="grid grid-cols-3 gap-2">
        {MODELS.map((m) => {
          const isSelected = value === m.key
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(m.key)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'border-primary-container bg-primary-container/10 text-on-surface'
                  : 'border-outline-variant/60 text-on-surface-variant hover:border-primary-container/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`material-symbols-outlined text-base ${isSelected ? 'text-primary' : ''}`}>
                {m.icon}
              </span>
              {m.label}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        <span className="font-semibold text-on-surface">{selected.full}</span>
        {' \u00b7 '}{selected.tagline}
        {' \u00b7 '}{selected.note}
      </p>
    </div>
  )
}
