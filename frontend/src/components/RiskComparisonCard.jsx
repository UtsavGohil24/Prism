import React from 'react'

export default function RiskComparisonCard({ comparison }) {
  if (!comparison) return null

  const { insufficient_data, percentile, median, sample_size, current_score, repo } = comparison

  if (insufficient_data) {
    return (
      <div className="glass-panel p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between min-h-[160px] h-full relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Historical Analytics</span>
          <h3 className="text-lg font-bold text-on-surface">Repo Risk Comparison</h3>
        </div>
        <div className="my-auto py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-outline text-2xl">analytics</span>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Not enough historical data yet ({sample_size}/3 PRs analyzed for this repo).
          </p>
        </div>
        <div className="text-[10px] text-on-surface-variant/60 tech-mono">
          Historical comparisons activate after 3 PR analyses.
        </div>
      </div>
    )
  }

  // Determine colors based on risk thresholds
  const getRiskColorClass = (score) => {
    if (score >= 70) return 'text-danger'
    if (score >= 35) return 'text-warn'
    return 'text-success'
  }

  const currentScoreColor = getRiskColorClass(current_score)
  const medianColor = getRiskColorClass(median)

  // Double-sided framing for percentile to make it natural and readable
  const percentileText = percentile >= 50
    ? `Riskier than ${percentile}% of PRs in this repo`
    : `Safer than ${100 - percentile}% of PRs in this repo`

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between min-h-[160px] h-full relative overflow-hidden">
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Historical Analytics</span>
        <h3 className="text-lg font-bold text-on-surface truncate" title={repo}>
          Repo: {repo.split('/').pop() || repo}
        </h3>
      </div>

      <div className="my-auto py-4 space-y-4">
        {/* Comparison Stat Row */}
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant tech-mono">This PR</span>
            <span className={`text-3xl font-extrabold ${currentScoreColor}`}>
              {current_score}
            </span>
          </div>
          <div className="text-on-surface-variant/40 text-xl font-light">vs</div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant tech-mono">Repo Median</span>
            <span className={`text-3xl font-extrabold ${medianColor}`}>
              {median}
            </span>
          </div>
        </div>

        {/* Percentile Text Banner */}
        <div className="p-3 bg-surface-bright/20 border border-outline-variant/30 rounded-xl flex items-center gap-2">
          <span className={`material-symbols-outlined text-lg ${currentScoreColor}`}>
            {percentile >= 50 ? 'trending_up' : 'trending_down'}
          </span>
          <span className={`text-xs font-semibold ${currentScoreColor}`}>
            {percentileText}
          </span>
        </div>
      </div>

      <div className="text-[10px] text-on-surface-variant tech-mono">
        Based on {sample_size} historical PR analyses
      </div>
    </div>
  )
}
