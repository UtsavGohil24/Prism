import React from 'react'

export default function RiskBreakdownList({ riskFactors = [], overallRiskScore = 0 }) {
  // Sort factors by points descending
  const sortedFactors = [...riskFactors].sort((a, b) => (b.points || 0) - (a.points || 0))

  // Material Symbols Outlined Icon mapping helper
  const getIcon = (type) => {
    switch (type) {
      case 'security_sensitive_file':
        return 'shield'
      case 'bug_findings':
        return 'bug_report'
      case 'large_blast_radius':
        return 'account_tree'
      case 'core_file_modified':
        return 'settings'
      case 'missing_test_coverage':
        return 'rule'
      case 'large_single_file':
        return 'description'
      default:
        return 'info'
    }
  }

  // Points badge styling helper
  const getPointsBadgeStyle = (points) => {
    if (points >= 12) {
      return 'bg-error/10 text-error border-error/20'
    }
    if (points >= 8) {
      return 'bg-tertiary/15 text-tertiary border-tertiary/30'
    }
    if (points >= 4) {
      return 'bg-primary/10 text-primary border-primary/20'
    }
    return 'bg-surface-bright/20 text-on-surface-variant border-outline-variant/30'
  }

  // Human readable title helper for types
  const getFactorLabel = (type) => {
    switch (type) {
      case 'security_sensitive_file':
        return 'Security Sensitive File'
      case 'bug_findings':
        return 'Bug Findings'
      case 'large_blast_radius':
        return 'Large Blast Radius'
      case 'core_file_modified':
        return 'Core File Modified'
      case 'missing_test_coverage':
        return 'Missing Test Coverage'
      case 'large_single_file':
        return 'Large Single File'
      default:
        return 'General Factor'
    }
  }

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/20 pb-4 mb-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Explainable AI</span>
          <h3 className="text-lg font-bold text-on-surface">Risk Score Breakdown</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-extrabold uppercase tracking-wider tech-mono">
          <span>Overall Score:</span>
          <span className="text-sm font-black">{overallRiskScore}/100</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {sortedFactors.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl opacity-50">verified</span>
            <p className="text-sm font-semibold text-on-surface">No specific risk factors identified</p>
            <p className="text-xs max-w-sm leading-relaxed">
              This pull request does not trigger any of our pattern-based risk rules or contain major bug findings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedFactors.map((factor, index) => {
              const icon = getIcon(factor.type)
              const badgeStyle = getPointsBadgeStyle(factor.points || 0)
              const label = getFactorLabel(factor.type)

              return (
                <div 
                  key={index}
                  className="p-4 bg-surface-bright/10 border border-outline-variant/20 rounded-xl flex items-start gap-4 hover:border-primary/30 transition-all"
                >
                  {/* Icon Badge */}
                  <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 text-primary">
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider tech-mono">
                        {label}
                      </h4>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider tech-mono shrink-0 ${badgeStyle}`}>
                        +{factor.points || 0} pts
                      </span>
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed">
                      {factor.reason}
                    </p>
                    {factor.source && factor.source !== 'diff_size' && factor.source !== 'bugs' && factor.source !== 'test_coverage' && (
                      <div className="pt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-on-surface-variant/80">
                        <span className="material-symbols-outlined text-xs">folder_open</span>
                        <span className="truncate" title={factor.source}>{factor.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
