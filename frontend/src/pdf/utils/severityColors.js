// Shared severity + risk level color config for the PDF audit report.
// PRism data uses: minor | moderate | critical (no "high" or "informational").
// Spec mapping: critical → Critical, moderate → Medium, minor → Low
// All values are hex — no oklch, safe for html2canvas capture.

export const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    textColor: '#ffffff',
    bgColor:   '#991b1b', // solid dark red
    borderColor:'#7f1d1d',
    dotColor:  '#dc2626',
    rank: 3,
  },
  moderate: {
    label: 'Medium',
    textColor: '#78350f',
    bgColor:   '#fef3c7',
    borderColor:'#fcd34d',
    dotColor:  '#f59e0b',
    rank: 2,
  },
  minor: {
    label: 'Low',
    textColor: '#14532d',
    bgColor:   '#dcfce7',
    borderColor:'#86efac',
    dotColor:  '#22c55e',
    rank: 1,
  },
}

export const RISK_LEVEL_CONFIG = {
  critical: {
    label: 'Critical Risk',
    textColor:  '#ffffff',
    bgColor:    '#991b1b',
    borderColor:'#7f1d1d',
    dotColor:   '#dc2626',
  },
  high: {
    label: 'High Risk',
    textColor:  '#7f1d1d',
    bgColor:    '#fee2e2',
    borderColor:'#fca5a5',
    dotColor:   '#ef4444',
  },
  medium: {
    label: 'Medium Risk',
    textColor:  '#78350f',
    bgColor:    '#fef3c7',
    borderColor:'#fcd34d',
    dotColor:   '#f59e0b',
  },
  low: {
    label: 'Low Risk',
    textColor:  '#14532d',
    bgColor:    '#dcfce7',
    borderColor:'#86efac',
    dotColor:   '#22c55e',
  },
}

export function severityConfig(severity) {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.minor
}

export function riskLevelConfig(level) {
  return RISK_LEVEL_CONFIG[(level || '').toLowerCase()] || RISK_LEVEL_CONFIG.low
}

export function severityRank(severity) {
  return (SEVERITY_CONFIG[severity] || { rank: 0 }).rank
}

// Overall numeric score → risk label
export function overallRiskLevel(score) {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

// Overall score → hex accent color
export function overallRiskColor(score) {
  if (score >= 75) return '#ef4444'
  if (score >= 50) return '#f59e0b'
  if (score >= 25) return '#3b82f6'
  return '#22c55e'
}
