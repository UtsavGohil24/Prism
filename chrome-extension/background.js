
const API_URL = 'http://127.0.0.1:8000/analyze'
const FRONTEND_URL = 'http://localhost:5173'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Open the completed report in the Prism frontend.
  if (message.action === 'OPEN_REPORT') {
    if (!message.reportId) {
      sendResponse({ success: false })
      return
    }

    chrome.tabs.create({
      url: `${FRONTEND_URL}/report/${encodeURIComponent(message.reportId)}`
    })

    sendResponse({ success: true })
    return
  }

  if (message.action !== 'ANALYZE_PR') return

  async function analyze() {
    try {
      if (!message.prUrl) {
        throw new Error('Pull Request URL is missing.')
      }

      const settings = await chrome.storage.local.get('selectedModel')
      const model = settings.selectedModel || 'gemini'

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pr_url: message.prUrl,
          model
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || `Backend error: ${response.status}`
        )
      }

      const reportId =
        data.report_id ||
        data.report?.report_id ||
        data.report?.id ||
        data.id ||
        null

      return {
        success: true,
        reportId
      }

    } catch (error) {
      console.error('PRism background error:', error)

      return {
        success: false,
        error: error.message
      }
    }
  }

  analyze().then(sendResponse)

  return true
})