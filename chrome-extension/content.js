
(() => {
  const BUTTON_ID = 'prism-floating-button'

  function injectButton() {
    // Only run on GitHub Pull Request pages.
    const match = window.location.pathname.match(
      /^\/[^/]+\/[^/]+\/pull\/\d+/
    )

    // Remove the button if we navigate away from a PR.
    if (!match) {
      document.getElementById(BUTTON_ID)?.remove()
      return
    }

    // Prevent duplicate buttons.
    if (document.getElementById(BUTTON_ID)) return

    const prUrl = window.location.origin + match[0]
    let reportId = null

    const button = document.createElement('button')
    button.id = BUTTON_ID
    button.textContent = '✦ Review with PRism'

    Object.assign(button.style, {
      position: 'fixed',
      bottom: '25px',
      right: '25px',
      zIndex: '999999',
      padding: '13px 20px',
      border: 'none',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
      color: '#fff',
      fontSize: '13px',
      fontWeight: '800',
      cursor: 'pointer',
      boxShadow: '0 5px 25px rgba(220,38,38,0.35)'
    })

    button.addEventListener('click', async () => {
      if (reportId) {
        chrome.runtime.sendMessage({
          action: 'OPEN_REPORT',
          reportId
        })
        return
      }

      button.disabled = true
      button.textContent = 'Analyzing PR...'

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'ANALYZE_PR',
          prUrl
        })

        if (!response?.success) {
          throw new Error(response?.error || 'Analysis failed')
        }

        reportId = response.reportId

        if (!reportId) {
          throw new Error(
            'Analysis completed, but no report ID was returned.'
          )
        }

        button.textContent = '↗ View Report'
        button.style.background = '#166534'
        button.title = `Report ID: ${reportId}`

      } catch (error) {
        console.error('PRism:', error)
        button.textContent = '✕ Try again'
        button.title = error.message

      } finally {
        button.disabled = false
      }
    })

    document.body.appendChild(button)
  }

  // Initial page load.
  injectButton()

  // GitHub Turbo navigation.
  document.addEventListener('turbo:load', injectButton)
  document.addEventListener('turbo:render', injectButton)

  // GitHub navigation events.
  window.addEventListener('popstate', injectButton)

  // Detect URL changes even when GitHub uses other navigation mechanisms.
  let lastUrl = window.location.href

  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href
      injectButton()
    }
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
})()