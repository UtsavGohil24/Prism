import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

export const exportReportPDF = async (reportId) => {
  const el = document.getElementById('report-capture')
  if (!el) {
    console.error('Element with ID report-capture not found')
    return
  }

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    onclone: (clonedDoc) => {
      const clonedRoot = clonedDoc.getElementById('report-capture')
      if (!clonedRoot) return

      // Copy computed styles from the original root
      const rootComputed = window.getComputedStyle(el)
      clonedRoot.style.color = rootComputed.color
      clonedRoot.style.backgroundColor = rootComputed.backgroundColor
      clonedRoot.style.borderColor = rootComputed.borderColor

      // Get all descendants in document order
      const originalEls = el.querySelectorAll('*')
      const clonedEls = clonedRoot.querySelectorAll('*')

      originalEls.forEach((origNode, idx) => {
        const clonedNode = clonedEls[idx]
        if (clonedNode) {
          const computed = window.getComputedStyle(origNode)
          clonedNode.style.color = computed.color
          clonedNode.style.backgroundColor = computed.backgroundColor
          clonedNode.style.borderColor = computed.borderColor
        }
      })
    },
  })

  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const w = pdf.internal.pageSize.getWidth()
  const h = (canvas.height * w) / canvas.width
  pdf.addImage(img, 'PNG', 0, 0, w, h)
  pdf.save(`PRism_Report_${reportId}.pdf`)
}
