import React from 'react'

export default function RiskPercentileChart({ comparison }) {
  if (!comparison || comparison.insufficient_data) return null

  const { percentile, median, current_score } = comparison

  // The median always sits at the 50th percentile of the historical
  // distribution — that's what "median" means — so it's a fixed reference
  // point, not something we need to compute a position for.
  const MEDIAN_PCT = 50
  const prPct = Math.min(100, Math.max(0, percentile))

  const isRiskierThanMedian = prPct >= MEDIAN_PCT
  const fillColor = isRiskierThanMedian ? 'var(--color-error)' : '#10B981'

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between min-h-[180px] h-full relative overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Percentile Distribution</span>
          <h3 className="text-lg font-bold text-on-surface">Repo Percentile Placement</h3>
        </div>
        <span className="text-[11px] font-semibold text-on-surface-variant tech-mono whitespace-nowrap shrink-0">
          Historical Median: <span className="text-on-surface font-bold">{median}</span>
        </span>
      </div>

      <div className="w-full mt-9 relative" style={{ height: '16px' }}>
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-outline-variant" />

        {/* Fill from 0 up to this PR's percentile, colored by whether it's
            riskier (red) or safer (green) than the median — the comparison
            is expressed as one color, not a second marker. */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${prPct}%`, backgroundColor: fillColor }}
        />

        {/* Median reference line — fixed at 50%, always */}
        <div
          className="absolute top-[-6px] bottom-[-6px] border-l-2 border-dashed"
          style={{ left: `${MEDIAN_PCT}%`, borderColor: 'var(--color-primary)' }}
        />

        {/* This PR's marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-surface shadow z-10"
          style={{ left: `${prPct}%`, backgroundColor: fillColor }}
          title={`This PR: ${current_score}`}
        />
      </div>

      {/* Percent scale */}
      <div className="w-full flex justify-between mt-2 text-[9px] text-on-surface-variant/70 tech-mono">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      <div className="text-[10px] text-on-surface-variant flex justify-between mt-3 tech-mono">
        <span>Safer (0%)</span>
        <span>Riskier (100%)</span>
      </div>
    </div>
  )
}