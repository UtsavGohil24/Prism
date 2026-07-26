import React from 'react'
import PdfPageFrame from '../components/PdfPageFrame'
import { getPrNumber, totalLinesChanged, flattenFindings, deriveCategories } from '../utils/reportDataAdapters'
import { overallRiskLevel, overallRiskColor } from '../utils/severityColors'
import { estimatedReviewTime, categoryNarrative } from '../utils/narrativeUtils'

export default function ExecutiveSummaryPage({ data, pageNumber, totalPages }) {
  const filesChanged = data.files ? data.files.length : 0
  const linesChanged = totalLinesChanged(data.files)
  const findings = flattenFindings(data.files)
  const categories = deriveCategories(data.risk_factors)
  
  const score = data.overall_risk_score || 0
  const riskLevel = overallRiskLevel(score)
  
  // AI Summary generation
  const activeCategories = categories.filter(c => c.active)
  const narrativeParagraphs = activeCategories.map(c => 
    categoryNarrative(c.name, c.score, findings.filter(f => f.category === c.name || true)) // Category mapping to findings is loose, fallback to true if no category field in finding
  )

  return (
    <PdfPageFrame pageNumber={pageNumber} totalPages={totalPages} reportData={data}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', borderBottom: '2px solid #6366f1', paddingBottom: '8px', display: 'inline-block' }}>
        Executive Summary
      </h2>

      {/* Metrics Row (8 cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <MetricCard label="Repository" value={data.repo || 'N/A'} />
        <MetricCard label="Branch" value="main" note="(Stub)" />
        <MetricCard label="PR Number" value={getPrNumber(data.pr_url)} />
        <MetricCard label="Files Changed" value={filesChanged} />
        <MetricCard label="Lines Changed" value={linesChanged} />
        <MetricCard label="Findings" value={findings.length} />
        <MetricCard label="Overall Risk" value={riskLevel} color={overallRiskColor(score)} />
        <MetricCard label="Est. Review Time*" value={`${estimatedReviewTime(linesChanged)} min`} />
      </div>

      {/* AI Summary */}
      <div style={{ marginBottom: '32px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '12px' }}>AI Summary</h3>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#334155', margin: '0 0 16px 0' }}>
          {data.merge_recommendation || 'Review carefully before merging.'}
        </p>
        {narrativeParagraphs.map((para, i) => (
          <p key={i} style={{ fontSize: '14px', lineHeight: 1.6, color: '#334155', margin: '0 0 8px 0' }}>
            {para}
          </p>
        ))}
      </div>

      {/* Category Scores (Horizontal Bars) */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Category Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map(cat => (
            <div key={cat.name} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>{cat.name}</div>
              <div style={{ height: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${cat.score}%`, backgroundColor: '#6366f1', borderRadius: '6px' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{cat.score}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '32px' }}>
        *Estimated from lines changed; not a measured value.
      </div>
    </PdfPageFrame>
  )
}

function MetricCard({ label, value, note, color }) {
  return (
    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: color || '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
      {note && <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>{note}</div>}
    </div>
  )
}
