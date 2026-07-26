import React from 'react'
import PdfPageFrame from '../components/PdfPageFrame'
import { highRiskFiles } from '../utils/reportDataAdapters'
import { fileNarrative } from '../utils/narrativeUtils'
import { riskLevelConfig } from '../utils/severityColors'

export default function FileRiskPage({ data, pageNumber, totalPages, isContinuation, filesSubset }) {
  const allFiles = data.files || []
  
  return (
    <PdfPageFrame pageNumber={pageNumber} totalPages={totalPages} reportData={data}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', borderBottom: '2px solid #6366f1', paddingBottom: '8px', display: 'inline-block' }}>
        File Risk Analysis {isContinuation ? '(Continued)' : ''}
      </h2>

      {!isContinuation && (
        <div style={{ marginBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 4px' }}>File</th>
                <th style={{ padding: '8px 4px' }}>Risk Level</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>Lines Changed</th>
              </tr>
            </thead>
            <tbody>
              {allFiles.map((f, i) => {
                const conf = riskLevelConfig(f.risk_level)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 4px', fontFamily: 'monospace', color: '#334155', wordBreak: 'break-all' }}>{f.filename}</td>
                    <td style={{ padding: '8px 4px' }}>
                      <span style={{ 
                        backgroundColor: conf.bgColor, color: conf.textColor, border: `1px solid ${conf.borderColor}`,
                        padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 
                      }}>
                        {conf.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'right', color: '#64748b' }}>{f.lines_changed}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filesSubset && filesSubset.length > 0 && (
        <div>
          {!isContinuation && <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>High Risk File Details</h3>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filesSubset.map((f, idx) => {
              const conf = riskLevelConfig(f.risk_level)
              const isCritical = f.risk_level === 'critical'
              const cardBorder = isCritical ? `2px solid ${conf.borderColor}` : `1px solid ${conf.borderColor}`
              
              return (
                <div key={idx} style={{ border: cardBorder, borderRadius: '8px', padding: '16px', backgroundColor: conf.bgColor + '15', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ 
                        backgroundColor: conf.bgColor, color: conf.textColor, border: `1px solid ${conf.borderColor}`,
                        padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 
                    }}>
                      {conf.label}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>
                      {f.filename}
                    </span>
                    {isCritical && (
                      <span style={{ 
                        marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#b91c1c', 
                        textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' 
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Requires review before merge
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', margin: 0 }}>
                    {fileNarrative(f)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </PdfPageFrame>
  )
}
