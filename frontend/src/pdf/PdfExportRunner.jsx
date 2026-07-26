import React, { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

import CoverPage from './pages/CoverPage'
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage'
import RiskDashboardPage from './pages/RiskDashboardPage'
import FileRiskPage from './pages/FileRiskPage'
import FindingsPage from './pages/FindingsPage'
import AppendixPage from './pages/AppendixPage'
import { highRiskFiles, partitionHighRiskFiles } from './utils/reportDataAdapters'

export async function exportAuditPDF(reportData) {
  // 1. Setup container
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  document.body.appendChild(container)

  // 2. Compute dynamic pages
  const hrFiles = highRiskFiles(reportData.files)
  const hrFilePages = partitionHighRiskFiles(hrFiles, 4)
  const totalPages = 5 + hrFilePages.length // Cover, Exec, Risk, File(s), Findings, Appendix
  
  // 3. Render React tree off-screen
  const root = createRoot(container)
  
  await new Promise((resolve) => {
    root.render(
      <PdfReportRenderer 
        reportData={reportData} 
        totalPages={totalPages} 
        hrFilePages={hrFilePages} 
        onRendered={resolve} 
      />
    )
  })

  // 4. Capture & PDF Generation
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  
  const pageNodes = Array.from(container.querySelectorAll('.pdf-page-container'))
  
  for (let i = 0; i < pageNodes.length; i++) {
    const node = pageNodes[i]
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      onclone: (clonedDoc) => {
        // Reuse the exact onclone pattern from pdfExport.js to fix Tailwind v4 okclh issues
        const clonedNode = clonedDoc.querySelector(`[data-pdf-page-idx="${i}"]`)
        if (!clonedNode) return

        const originalEls = node.querySelectorAll('*')
        const clonedEls = clonedNode.querySelectorAll('*')

        originalEls.forEach((origEl, idx) => {
          const cEl = clonedEls[idx]
          if (cEl) {
            const computed = window.getComputedStyle(origEl)
            cEl.style.color = computed.color
            cEl.style.backgroundColor = computed.backgroundColor
            cEl.style.borderColor = computed.borderColor
          }
        })
      }
    })

    const imgData = canvas.toDataURL('image/png')
    const imgHeight = (canvas.height * pdfWidth) / canvas.width
    
    if (i > 0) {
      pdf.addPage()
    }
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight)
  }

  // 5. Save & Cleanup
  pdf.save(`PRism_Audit_${reportData.report_id || 'Report'}.pdf`)
  
  setTimeout(() => {
    root.unmount()
    document.body.removeChild(container)
  }, 1000)
}

function PdfReportRenderer({ reportData, totalPages, hrFilePages, onRendered }) {
  useEffect(() => {
    // Give browser a moment to lay out fonts etc. before resolving
    const timer = setTimeout(onRendered, 500)
    return () => clearTimeout(timer)
  }, [onRendered])

  let currentPage = 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageWrapper idx={0}><CoverPage data={reportData} pageNumber={currentPage++} totalPages={totalPages} /></PageWrapper>
      <PageWrapper idx={1}><ExecutiveSummaryPage data={reportData} pageNumber={currentPage++} totalPages={totalPages} /></PageWrapper>
      <PageWrapper idx={2}><RiskDashboardPage data={reportData} pageNumber={currentPage++} totalPages={totalPages} /></PageWrapper>
      
      {hrFilePages.map((filesSubset, i) => (
        <PageWrapper key={`file-page-${i}`} idx={3 + i}>
          <FileRiskPage 
            data={reportData} 
            pageNumber={currentPage++} 
            totalPages={totalPages} 
            isContinuation={i > 0} 
            filesSubset={filesSubset} 
          />
        </PageWrapper>
      ))}

      <PageWrapper idx={3 + hrFilePages.length}><FindingsPage data={reportData} pageNumber={currentPage++} totalPages={totalPages} /></PageWrapper>
      <PageWrapper idx={4 + hrFilePages.length}><AppendixPage data={reportData} pageNumber={currentPage++} totalPages={totalPages} /></PageWrapper>
    </div>
  )
}

function PageWrapper({ children, idx }) {
  return (
    <div className="pdf-page-container" data-pdf-page-idx={idx} style={{ width: '794px', height: '1123px', backgroundColor: '#fff' }}>
      {children}
    </div>
  )
}
