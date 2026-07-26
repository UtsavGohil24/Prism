import React from 'react'
import PdfPageFrame from '../components/PdfPageFrame'
import { flattenFindings, countBySeverity, topCategoryNames, deriveCategories } from '../utils/reportDataAdapters'
import { severityConfig } from '../utils/severityColors'
import { overallRecommendationSentence } from '../utils/narrativeUtils'

export default function FindingsPage({ data, pageNumber, totalPages }) {
  const findings = flattenFindings(data.files)
  const counts = countBySeverity(findings)
  const categories = deriveCategories(data.risk_factors)
  const topCats = topCategoryNames(categories)
  const overallRec = overallRecommendationSentence(data.overall_risk_score, topCats)

  return (
    <PdfPageFrame pageNumber={pageNumber} totalPages={totalPages} reportData={data}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', borderBottom: '2px solid #6366f1', paddingBottom: '8px', display: 'inline-block' }}>
        Findings & Recommendations
      </h2>

      {/* Severity Chart (Inline SVG) */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ width: '200px', height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden' }}>
          {['critical', 'moderate', 'minor'].map(sev => {
            const count = counts[sev]
            if (count === 0) return null
            const width = `${(count / Math.max(1, findings.length)) * 100}%`
            return <div key={sev} style={{ width, height: '100%', backgroundColor: severityConfig(sev).dotColor }} />
          })}
          {findings.length === 0 && <div style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1' }} />}
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          {['critical', 'moderate', 'minor'].map(sev => {
            const conf = severityConfig(sev)
            return (
              <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: conf.dotColor }} />
                <span style={{ color: '#475569' }}>{conf.label}:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{counts[sev]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Columns: Findings | Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
        
        {/* Left Column: Findings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Detailed Findings</h3>
          {findings.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No findings detected.</div>
          ) : (
            findings.slice(0, 10).map((f, i) => { // limit to 10 for fit
              const conf = severityConfig(f.severity)
              return (
                <div key={i} style={{ borderLeft: `4px solid ${conf.dotColor}`, backgroundColor: '#f8fafc', padding: '12px', borderRadius: '0 6px 6px 0', border: '1px solid #e2e8f0', borderLeftWidth: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ 
                        backgroundColor: conf.bgColor, color: conf.textColor, border: `1px solid ${conf.borderColor}`,
                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase'
                    }}>
                      {conf.label}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>{f.file}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5 }}>{f.description}</p>
                </div>
              )
            })
          )}
          {findings.length > 10 && (
             <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>+ {findings.length - 10} more findings not shown...</div>
          )}
        </div>

        {/* Right Column: Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Suggested Actions</h3>
          {findings.filter(f => f.suggestions && f.suggestions.length > 0).length === 0 ? (
             <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>No specific recommendations.</div>
          ) : (
            findings.filter(f => f.suggestions && f.suggestions.length > 0).slice(0, 10).map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                 <div style={{ color: '#22c55e', paddingTop: '2px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
                 <div>
                    <p style={{ fontSize: '13px', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                       {typeof f.suggestions[0] === 'string' ? f.suggestions[0] : (f.suggestions[0].description || 'Fix issue')}
                    </p>
                    <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px', fontFamily: 'monospace' }}>For: {f.file}</div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Overall Recommendation */}
      <div style={{ marginTop: '32px', backgroundColor: '#e0e7ff', padding: '20px', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#3730a3', marginBottom: '8px', textTransform: 'uppercase' }}>Overall Recommendation</h4>
        <p style={{ fontSize: '14px', color: '#312e81', margin: 0, lineHeight: 1.6 }}>{overallRec}</p>
      </div>

    </PdfPageFrame>
  )
}
