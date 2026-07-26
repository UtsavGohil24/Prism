import { severityRank } from './severityColors.js'

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Templated narrative sentence for one risk category.
// findings: flattened bug objects belonging to this category
// score: the derived numeric score for this category
export function categoryNarrative(categoryName, score, findings) {
  if (!findings || findings.length === 0) {
    return `No ${categoryName.toLowerCase()} concerns were identified in this pull request.`
  }
  const sorted = [...findings].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
  const top = sorted[0]
  const count = findings.length
  const plural = count > 1 ? 's were' : ' was'
  const topFile = top.file || top.source || 'an affected file'
  const sevLabel = top.severity === 'critical' ? 'critical' : top.severity === 'moderate' ? 'medium' : 'low'
  return `${capitalize(categoryName)} scored ${score} — ${count} finding${plural} flagged in this category, including a ${sevLabel}-severity issue in ${topFile}.`
}

// 2–3 sentence paragraph for a high-risk file card on Page 4.
export function fileNarrative(file) {
  const bugs = file.bugs || []
  const topBug = bugs.length > 0
    ? [...bugs].sort((a, b) => severityRank(b.severity || 'minor') - severityRank(a.severity || 'minor'))[0]
    : null
  const bugDesc = topBug
    ? (typeof topBug === 'string' ? topBug : (topBug.description || ''))
    : null

  const suggestions = file.suggestions || []
  const suggestion = suggestions.length > 0
    ? (typeof suggestions[0] === 'string' ? suggestions[0] : (suggestions[0].description || ''))
    : null

  const parts = []

  // Sentence 1 — what the risk is
  if (bugDesc) {
    parts.push(`${file.filename} was classified as ${file.risk_level} risk: ${bugDesc.charAt(0).toLowerCase() + bugDesc.slice(1).replace(/\.?$/, '')}.`)
  } else {
    parts.push(`${file.filename} was flagged as ${file.risk_level} risk based on the extent and nature of its modifications.`)
  }

  // Sentence 2 — why the file matters
  const lc = file.lines_changed || 0
  parts.push(
    lc > 50
      ? `This file contains ${lc} changed lines, representing a substantial modification that warrants thorough peer review before merging.`
      : `With ${lc} line${lc !== 1 ? 's' : ''} changed, this file introduces targeted modifications that could have downstream effects on dependent code.`
  )

  // Sentence 3 — recommendation
  if (suggestion) {
    parts.push(`Recommended action: ${suggestion.charAt(0).toUpperCase() + suggestion.slice(1).replace(/\.?$/, '')}.`)
  } else {
    parts.push('Review this file carefully and verify that all edge cases are handled before approving the merge.')
  }

  return parts.join(' ')
}

// One-sentence overall recommendation for the bottom of Page 5.
export function overallRecommendationSentence(score, topCategoryNames) {
  const level = score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low'
  const concerns = topCategoryNames.slice(0, 2).join(' and ')
  if (level === 'Low') {
    return `This pull request carries a low overall risk score of ${score}/100 and is suitable for merge after standard review.`
  }
  if (level === 'Medium') {
    return `With a score of ${score}/100, a targeted review focusing on ${concerns || 'flagged areas'} is recommended before merging.`
  }
  return `Request an additional thorough review before merging — the ${level.toLowerCase()} risk score of ${score}/100 is driven primarily by concerns in ${concerns || 'multiple areas'}.`
}

// Estimated review time — client-side stub.
// FLAG: Not in the API contract. Approximated as totalLinesChanged / 200 minutes.
export function estimatedReviewTime(totalLinesChanged) {
  return Math.max(5, Math.ceil(totalLinesChanged / 200))
}
