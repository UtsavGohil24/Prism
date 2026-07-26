import React from 'react'
import PdfPageFrame from '../components/PdfPageFrame'
import { deriveCategories } from '../utils/reportDataAdapters'
import { overallRiskLevel, overallRiskColor } from '../utils/severityColors'

export default function RiskDashboardPage({ data, pageNumber, totalPages }) {
  const score = data.overall_risk_score || 0
  const riskLevel = overallRiskLevel(score)
  const color = overallRiskColor(score)
  const categories = deriveCategories(data.risk_factors || [])

  return (
    <PdfPageFrame pageNumber={pageNumber} totalPages={totalPages} reportData={data}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', borderBottom: '2px solid #6366f1', paddingBottom: '8px', display: 'inline-block' }}>
        Risk Dashboard
      </h2>

      {/* Top row: Score + Closing Sentence */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        <div style={{ 
          padding: '24px',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '200px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Overall Risk
          </div>
          <div style={{ fontSize: '48px', fontWeight: 800, color: color, lineHeight: 1 }}>{score}</div>
          <div style={{ 
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: `${color}15`,
            color: color,
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '12px'
          }}>
            {riskLevel.toUpperCase()}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#334155', margin: 0 }}>
            The overall score of {score} reflects the combined weight of the findings below. Categories are scored based on triggered risk factors, capped at 100 per category.
          </p>
        </div>
      </div>

      {/* Decomposable Branch: Risk Factors List */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Detailed Risk Factors</h3>
        {categories.map(cat => (
          <div key={cat.name} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{cat.name}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>{cat.score} pts</span>
            </div>
            {cat.factors.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>No triggered factors in this category.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cat.factors.map((factor, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px' }}>
                    <div style={{ 
                      backgroundColor: '#e0e7ff', color: '#4f46e5', fontWeight: 700, fontSize: '12px', padding: '2px 6px', borderRadius: '4px', height: 'fit-content'
                    }}>
                      +{factor.points}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>{factor.type}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{factor.reason}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>Source: {factor.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PdfPageFrame>
  )
}
