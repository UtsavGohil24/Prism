import { severityRank } from './severityColors.js'

// Maps risk_factor.type → display category name.
// PRism's structural factor types grouped into 4 display categories.
const CATEGORY_MAP = {
  security_sensitive_file: 'Security',
  core_file_modified:      'Architecture',
  large_blast_radius:      'Architecture',
  large_single_file:       'Architecture',
  missing_test_coverage:   'Testing',
  bug_findings:            'Code Quality',
}

// Derives [{name, score, factors}] from risk_factors[].
// Scores are summed factor points per category, capped at 100.
export function deriveCategories(riskFactors = []) {
  const buckets = {
    Security:       { score: 0, factors: [] },
    Architecture:   { score: 0, factors: [] },
    Testing:        { score: 0, factors: [] },
    'Code Quality': { score: 0, factors: [] },
  }
  for (const factor of riskFactors) {
    const cat = CATEGORY_MAP[factor.type]
    if (cat) {
      buckets[cat].score += factor.points || 0
      buckets[cat].factors.push(factor)
    }
  }
  return Object.entries(buckets).map(([name, { score, factors }]) => ({
    name,
    score: Math.min(100, score),
    factors,
    active: score > 0,
  }))
}

// Flattens all bugs from files[] into a unified findings array with file context.
export function flattenFindings(files = []) {
  const findings = []
  for (const file of files) {
    for (const bug of (file.bugs || [])) {
      if (typeof bug === 'string') {
        findings.push({
          description:    bug,
          severity:       'minor',
          line_reference: null,
          file:           file.filename,
          suggestions:    file.suggestions || [],
        })
      } else {
        findings.push({
          description:    bug.description || '',
          severity:       bug.severity || 'minor',
          line_reference: bug.line_reference || null,
          file:           file.filename,
          suggestions:    file.suggestions || [],
        })
      }
    }
  }
  return findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
}

// Count findings by severity key.
export function countBySeverity(findings = []) {
  const counts = { critical: 0, moderate: 0, minor: 0 }
  for (const f of findings) {
    if (counts[f.severity] !== undefined) counts[f.severity]++
    else counts.minor++
  }
  return counts
}

// Sum of all file lines_changed.
export function totalLinesChanged(files = []) {
  return files.reduce((s, f) => s + (f.lines_changed || 0), 0)
}

// Files classified high or critical risk.
export function highRiskFiles(files = []) {
  return files.filter(f => f.risk_level === 'high' || f.risk_level === 'critical')
}

// Extract PR number from GitHub URL.
export function getPrNumber(prUrl) {
  if (!prUrl) return 'N/A'
  const m = prUrl.match(/\/pull\/(\d+)/)
  return m ? `#${m[1]}` : 'N/A'
}

// Generate a client-side report ID from PR number + date.
export function generateReportId(prUrl, createdAt) {
  const num = getPrNumber(prUrl).replace('#', '') || '0'
  const date = createdAt
    ? new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, '')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `PR${num}-${date}`
}

// Top category names sorted by score descending.
export function topCategoryNames(categories = []) {
  return [...categories]
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(c => c.name)
}

// Dynamic total page count computation.
// Base: 5 fixed pages (Cover, ExecSummary, RiskDashboard, Findings, Appendix)
// + 1 file risk page per ≤4 high-risk file cards, minimum 1 file page.
export function computeTotalPages(highRiskFileCount) {
  const filePages = Math.max(1, Math.ceil(highRiskFileCount / 4))
  return 5 + filePages
}

// Partition high-risk files across pages (max 4 per page).
export function partitionHighRiskFiles(files = [], perPage = 4) {
  const pages = []
  for (let i = 0; i < files.length; i += perPage) {
    pages.push(files.slice(i, i + perPage))
  }
  if (pages.length === 0) pages.push([])
  return pages
}
