import React from 'react'
import PdfPageFrame from '../components/PdfPageFrame'
import { overallRiskLevel, overallRiskColor } from '../utils/severityColors'
import { generateReportId, getPrNumber } from '../utils/reportDataAdapters'

export default function CoverPage({ data, pageNumber, totalPages }) {
  const score = data.overall_risk_score || 0
  const riskLevel = overallRiskLevel(score)
  const color = overallRiskColor(score)

  return (
    <PdfPageFrame pageNumber={pageNumber} totalPages={totalPages} reportData={data}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', padding: '0 40px' }}>
        {/* Logo Area */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
               <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
               <line x1="12" y1="22.08" x2="12" y2="12"></line>
             </svg>
             <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.05em', color: '#1e293b' }}>PRISM</span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1.1 }}>
          Pull Request Risk Assessment
        </h1>
        <div style={{ width: '64px', height: '6px', backgroundColor: '#6366f1', marginBottom: '40px' }} />

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', fontSize: '14px', marginBottom: '60px' }}>
          <div style={{ color: '#64748b', fontWeight: 600 }}>Repository</div>
          <div style={{ color: '#0f172a', fontWeight: 500 }}>{data.repo || 'N/A'}</div>

          <div style={{ color: '#64748b', fontWeight: 600 }}>Pull Request</div>
          <div style={{ color: '#0f172a', fontWeight: 500 }}>{getPrNumber(data.pr_url)}: {data.pr_title || 'N/A'}</div>

          <div style={{ color: '#64748b', fontWeight: 600 }}>Author</div>
          <div style={{ color: '#0f172a', fontWeight: 500 }}>{data.author || 'N/A'}</div>

          <div style={{ color: '#64748b', fontWeight: 600 }}>Date</div>
          <div style={{ color: '#0f172a', fontWeight: 500 }}>{new Date(data.created_at || Date.now()).toLocaleString()}</div>

          <div style={{ color: '#64748b', fontWeight: 600 }}>Report ID</div>
          <div style={{ color: '#0f172a', fontWeight: 500 }}>{generateReportId(data.pr_url, data.created_at)}</div>
        </div>

        {/* Risk Score */}
        <div style={{ 
          marginTop: 'auto', 
          marginBottom: '80px',
          padding: '40px',
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Overall Risk Score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <span style={{ fontSize: '72px', fontWeight: 800, color: color, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '24px', fontWeight: 600, color: '#94a3b8' }}>/ 100</span>
          </div>
          <div style={{ 
            marginTop: '16px',
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: `${color}15`,
            color: color,
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            {riskLevel.toUpperCase()} RISK
          </div>
        </div>

      </div>
    </PdfPageFrame>
  )
}
