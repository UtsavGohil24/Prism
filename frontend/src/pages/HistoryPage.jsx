import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listReports } from '../utils/api'
import Sidebar from '../components/Sidebar'
import SettingsDrawer from '../components/SettingsDrawer'
import RiskBadge from '../components/RiskBadge'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const fetchHistory = () => {
    setLoading(true)
    setError(null)
    listReports()
      .then((res) => {
        setReports(res.reports || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch history', err)
        setError(err.message || 'Failed to retrieve analysis history.')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen text-on-surface flex bg-transparent">
      {/* Sidebar navigation */}
      <Sidebar 
        activePage="history" 
        onOpenSettings={() => setIsSettingsOpen(true)} 
      />

      {/* Settings overlay drawer */}
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Main Content Layout */}
      <main className="flex-1 flex flex-col md:ml-64 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface-dim/40 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30">
          <div className="flex items-center gap-3 text-left">
            <span className="material-symbols-outlined text-primary text-2xl">history</span>
            <div className="w-px h-6 bg-outline-variant/40" />
            <h1 className="text-sm font-extrabold tracking-wider tech-tracking tech-mono text-on-surface">
              ANALYSIS HISTORY
            </h1>
          </div>
        </header>

        {/* Content Container */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Page Header text */}
            <div className="text-left space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Archive</span>
              <h2 className="text-xl font-bold text-on-surface">Audit Records</h2>
              <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
                Browse through previously analyzed pull requests and review their risk metrics.
              </p>
            </div>

            {/* States Handler */}
            {loading ? (
              <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
                <svg className="animate-spin h-8 w-8 text-primary mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-medium text-on-surface-variant">Loading history...</span>
              </div>
            ) : error ? (
              <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                <span className="material-symbols-outlined text-error text-4xl">error</span>
                <p className="text-sm font-semibold text-on-surface">{error}</p>
                <button
                  onClick={fetchHistory}
                  className="px-4 py-2 text-xs font-bold bg-primary-container text-on-primary rounded-lg hover:bg-primary-container/80 transition-all cursor-pointer shadow"
                >
                  Retry Connection
                </button>
              </div>
            ) : reports.length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
                <span className="material-symbols-outlined text-on-surface-variant text-4xl">folder_open</span>
                <p className="text-sm font-semibold text-on-surface">No reports yet</p>
                <p className="text-xs text-on-surface-variant">Analyze a Pull Request on the dashboard to see it cataloged here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => {
                  const formattedDate = report.created_at
                    ? new Date(report.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Recent Date'
                  
                  return (
                    <div 
                      key={report.report_id}
                      onClick={() => navigate(`/report/${report.report_id}`)}
                      className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-primary/50 transition-all text-left shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-on-surface truncate" title={report.pr_title}>
                          {report.pr_title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
                          <span className="font-semibold text-primary truncate max-w-[150px] sm:max-w-xs">{report.pr_url}</span>
                          <span>•</span>
                          <span>by @{report.author}</span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <RiskBadge level={report.confidence} type="confidence" />
                        <div className="w-12 text-center">
                          <div className={`text-lg font-extrabold ${
                            report.risk_score >= 70 
                              ? 'text-error' 
                              : report.risk_score >= 35 
                                ? 'text-tertiary' 
                                : 'text-primary'
                          }`}>
                            {report.risk_score}
                          </div>
                          <div className="text-[9px] font-bold text-on-surface-variant/60 tech-mono">RISK</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>

          {/* Footer */}
          <footer className="w-full mt-16 border-t border-outline-variant/30 pt-8 text-on-surface-variant">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg">biotech</span>
                <span className="tech-tracking uppercase">PRism Engine v1.0.0</span>
              </div>
              <p>© {new Date().getFullYear()} PRism. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              </div>
            </div>
          </footer>

        </div>
      </main>
    </div>
  )
}
