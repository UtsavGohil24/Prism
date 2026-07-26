import React from 'react'
import PdfPageFrame from '../components/PdfPageFrame'
import { generateReportId } from '../utils/reportDataAdapters'

export default function AppendixPage({ data, pageNumber, totalPages }) {
  const meta = [
    { label: 'Repository', value: data.repo || 'N/A' },
    { label: 'Pull Request URL', value: data.pr_url || 'N/A' },
    { label: 'Base / Target Branch', value: 'main' }, // Stub
    { label: 'Commit SHA', value: 'N/A' }, // Stub
    { label: 'Files Analyzed', value: (data.files || []).length },
    { label: 'Analysis Duration', value: 'N/A' }, // Stub
    { label: 'PRism Version', value: '1.0.0' },
    { label: 'Risk Model Version', value: 'v2.1' },
    { label: 'AI Model Used', value: 'Gemini 2.5 Flash' }, // Stub, derived from backend knowledge
    { label: 'Contract Version', value: '1.0' },
    { label: 'Generated Timestamp', value: new Date(data.created_at || Date.now()).toISOString() },
    { label: 'Report ID', value: generateReportId(data.pr_url, data.created_at) },
  ]

  return (
    <PdfPageFrame pageNumber={pageNumber} totalPages={totalPages} reportData={data}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', borderBottom: '2px solid #6366f1', paddingBottom: '8px', display: 'inline-block' }}>
        Appendix: Analysis Metadata
      </h2>

      <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <tbody>
            {meta.map((row, i) => (
              <tr key={i} style={{ borderBottom: i === meta.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9', width: '30%' }}>
                  {row.label}
                  {['Base / Target Branch', 'Commit SHA', 'Analysis Duration', 'AI Model Used'].includes(row.label) && (
                    <span style={{ color: '#94a3b8', fontSize: '10px', marginLeft: '6px', fontWeight: 400 }}>(Stub)</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: '#0f172a', fontFamily: row.label.includes('URL') || row.label.includes('SHA') ? 'monospace' : 'inherit' }}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '32px', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
        <p><strong>Methodology Note:</strong> This report was generated automatically by PRism. Risk scores and categorizations are derived from structural analysis of the git diff combined with LLM-assisted vulnerability detection.</p>
        <p>Values marked with (Stub) are placeholders for fields not currently provided by the backend API contract.</p>
      </div>
    </PdfPageFrame>
  )
}
