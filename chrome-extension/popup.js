
const API_URL = 'http://127.0.0.1:8000/analyze'

const prUrlInput = document.getElementById('prUrl')
const modelSelect = document.getElementById('model')
const analyzeBtn = document.getElementById('analyzeBtn')
const buttonText = document.getElementById('buttonText')
const message = document.getElementById('message')
const viewReportBtn = document.getElementById('viewReportBtn')

let currentReportId = null

// Normalize GitHub PR URL.
function normalizePRUrl(url) {
  return url.trim().replace(/\/+$/, '')
}

// Create a unique key for each PR and model.
function getReportKey(prUrl, model) {
  return `${normalizePRUrl(prUrl)}::${model}`
}

// Display messages.
function showMessage(text, type = '') {
  message.textContent = text
  message.className = `message ${type}`
}

// Restore previously selected model.
async function restoreSelectedModel() {
  try {
    const result = await chrome.storage.local.get('selectedModel')

    if (result.selectedModel) {
      modelSelect.value = result.selectedModel
    }
  } catch (error) {
    console.error('Could not restore selected model:', error)
  }

  await detectCurrentPR()
}

// Save selected model and restore its report.
modelSelect.addEventListener('change', async () => {
  await chrome.storage.local.set({
    selectedModel: modelSelect.value
  })

  await restoreReportButton()
})

// Restore report button for the current PR and model.
async function restoreReportButton() {
  currentReportId = null
  viewReportBtn.classList.add('hidden')

  const prUrl = normalizePRUrl(prUrlInput.value)
  const model = modelSelect.value

  if (!prUrl) return

  try {
    const result = await chrome.storage.local.get('reports')
    const reports = result.reports || {}

    const reportKey = getReportKey(prUrl, model)
    const savedReport = reports[reportKey]

    if (savedReport?.reportId) {
      currentReportId = savedReport.reportId
      viewReportBtn.classList.remove('hidden')
    }
  } catch (error) {
    console.error('Could not restore report:', error)
  }
}

// Automatically detect current GitHub PR.
async function detectCurrentPR() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })

    if (tab?.url) {
      const match = tab.url.match(
        /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/
      )

      if (match) {
        prUrlInput.value = match[0]
        await restoreReportButton()
      }
    }
  } catch (error) {
    console.error('Could not detect current PR:', error)
  }
}

// Check saved report when PR URL changes.
prUrlInput.addEventListener('input', restoreReportButton)

// Analyze PR.
async function analyzePR() {
  const prUrl = normalizePRUrl(prUrlInput.value)
  const model = modelSelect.value

  const validPR =
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/

  if (!validPR.test(prUrl)) {
    showMessage(
      'Please enter a valid GitHub Pull Request URL.',
      'error'
    )
    return
  }

  analyzeBtn.disabled = true
  buttonText.textContent = 'Analyzing PR...'

  viewReportBtn.classList.add('hidden')
  currentReportId = null

  showMessage(
    'PRism is reviewing your Pull Request. This may take a few minutes.'
  )

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pr_url: prUrl,
        model: model
      })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.message ||
        `Server error: ${response.status}`
      )
    }

    const reportId =
      data.report_id ||
      data.report?.report_id ||
      data.report?.id ||
      data.id

    if (!reportId) {
      showMessage(
        'Analysis completed, but no report ID was returned.',
        'error'
      )
      return
    }

    currentReportId = reportId

    // Save this report without overwriting other PR/model reports.
    const result = await chrome.storage.local.get('reports')
    const reports = result.reports || {}

    const reportKey = getReportKey(prUrl, model)

    reports[reportKey] = {
      prUrl: prUrl,
      reportId: reportId,
      model: model,
      savedAt: new Date().toISOString()
    }

    await chrome.storage.local.set({ reports })

    showMessage(
      `Analysis completed successfully!\nReport ID: ${reportId}`,
      'success'
    )

    viewReportBtn.classList.remove('hidden')

  } catch (error) {
    console.error('PRism analysis error:', error)

    showMessage(
      error.message || 'Could not connect to the PRism backend.',
      'error'
    )

  } finally {
    analyzeBtn.disabled = false
    buttonText.textContent = 'Analyze with PRism'
  }
}

// Open report in PRism frontend.
viewReportBtn.addEventListener('click', async () => {
  if (!currentReportId) return

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'OPEN_REPORT',
      reportId: currentReportId
    })

    if (response?.success === false) {
      throw new Error('Could not open the report.')
    }
  } catch (error) {
    console.error('PRism report error:', error)
    showMessage(error.message, 'error')
  }
})

// Analyze button.
analyzeBtn.addEventListener('click', analyzePR)

// Restore model first, then detect the current PR.
restoreSelectedModel()