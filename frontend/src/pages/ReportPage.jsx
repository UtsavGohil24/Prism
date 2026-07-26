import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getReport } from '../utils/api'
import { exportReportPDF } from '../utils/pdfExport'
import RiskMeter from '../components/RiskMeter'
import RiskBadge from '../components/RiskBadge'
import HeatmapGrid from '../components/HeatmapGrid'
import ErrorState from '../components/ErrorState'
import Sidebar from '../components/Sidebar'
import SettingsDrawer from '../components/SettingsDrawer'
import RiskComparisonCard from '../components/RiskComparisonCard'
import RiskPercentileChart from '../components/RiskPercentileChart'
import RiskBreakdownList from '../components/RiskBreakdownList'

// TEMP DEBUG TOGGLE — DO NOT COMMIT AS NON-NULL. Remove this whole block 
// once visual verification is complete.
const MOCK_COMPARISON_STATE = null; 
// Set to 'insufficient' | 'active' | null to preview states. 

export default function ReportPage() {
  const { report_id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const fetchReport = () => {
    setLoading(true)
    setError(null)

    getReport(report_id)
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('API fetch failed, falling back to mock report for debug:', err)
        import('../utils/mockData').then(({ MOCK_REPORT }) => {
          setData(MOCK_REPORT)
          setLoading(false)
        }).catch(() => {
          setError(err.message || 'Failed to retrieve report data.')
          setLoading(false)
        })
      })
  }

  useEffect(() => {
    fetchReport()
  }, [report_id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => console.error('Failed to copy link', err))
  }

  const handleDownloadPDF = async () => {
    try {
      await exportReportPDF(report_id)
    } catch (err) {
      console.error('PDF export failed', err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-on-surface">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-on-surface-variant text-sm font-medium">Loading report content...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen text-on-surface">
        <ErrorState message={error} onRetry={fetchReport} />
      </div>
    )
  }

  if (!data) return null

  // Helpers
  const getRepoName = (url) => {
    if (!url) return 'github-repo'
    try {
      const parts = url.replace('https://github.com/', '').split('/')
      if (parts.length >= 2) return `${parts[0]}/${parts[1]}`
    } catch (e) {}
    return 'github-repository'
  }

  const getPrNumber = (url) => {
    if (!url) return ''
    try {
      const match = url.match(/\/pull\/(\d+)/)
      return match ? `PR #${match[1]}` : 'PR'
    } catch (e) {}
    return 'PR'
  }

  const getInitials = (author) => {
    if (!author) return 'PR'
    return author.slice(0, 2).toUpperCase()
  }

  const repoName = getRepoName(data.pr_url)
  const formattedDate = data.created_at
    ? new Date(data.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Recent Date'

  // Summary Metrics calculations
  const totalFiles = data.summary.total_files || 0
  const highRisk = data.summary.high_risk_files || 0
  const bugsFound = data.summary.total_bugs || 0
  const linesChanged = data.files.reduce((acc, curr) => acc + (curr.lines_changed || 0), 0)

  // Chart data configuration
  const chartData = [
    { name: 'High Risk', value: data.summary.high_risk_files || 0, color: '#ffb4ab' }, // error color
    { name: 'Medium Risk', value: data.summary.medium_risk_files || 0, color: '#c1c6db' }, // tertiary color
    { name: 'Low Risk', value: data.summary.low_risk_files || 0, color: '#c0c1ff' } // primary color
  ].filter((item) => item.value > 0)

  // Stats definition with computed progress percentages
  const stats = [
    { 
      title: 'Total Files', 
      value: totalFiles, 
      progress: 100, 
      icon: 'folder', 
      colorClass: 'bg-primary' 
    },
    { 
      title: 'High Risk Files', 
      value: highRisk, 
      progress: totalFiles > 0 ? (highRisk / totalFiles) * 100 : 0, 
      icon: 'warning', 
      colorClass: 'bg-error' 
    },
    { 
      title: 'Bugs Detected', 
      value: bugsFound, 
      progress: totalFiles > 0 ? Math.min((bugsFound / totalFiles) * 100, 100) : 0, 
      icon: 'bug_report', 
      colorClass: 'bg-tertiary' 
    },
    { 
      title: 'Lines Changed', 
      value: linesChanged, 
      progress: Math.min((linesChanged / Math.max(linesChanged, 500)) * 100, 100), 
      icon: 'code', 
      colorClass: 'bg-primary-container' 
    }
  ]

  return (
    <div className="min-h-screen text-on-surface flex bg-transparent">
      {/* 1. Shared Left Sidebar */}
      <Sidebar activePage="" onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* 2. Settings Drawer Overlay */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* 2. Top Bar */}
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface-dim/40 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30">
          {/* Logo & PR Details */}
          <div className="flex items-center gap-3 text-left">
            {/* Mobile Biotech icon */}
            <span className="material-symbols-outlined text-primary text-2xl md:hidden">biotech</span>
            <div className="hidden sm:block w-px h-6 bg-outline-variant/40 md:hidden" />
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-on-surface truncate max-w-[200px] sm:max-w-md" title={data.pr_title}>
                {data.pr_title}
              </h1>
              <span className="text-[10px] text-on-surface-variant font-medium tech-mono">
                {getPrNumber(data.pr_url)} • main
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border border-outline-variant/50 rounded-lg hover:bg-surface-bright/20 transition-all cursor-pointer text-on-surface"
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'link'}</span>
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-primary-container text-on-primary rounded-lg hover:bg-primary-container/85 transition-all cursor-pointer shadow"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Download PDF</span>
            </button>
          </div>
        </header>

        {/* Main Content Panel */}
        <main className="pt-20 px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 flex flex-col justify-between">
          
          {/* PDF Capture Box */}
          <div id="report-capture" className="space-y-8 text-left bg-transparent p-1">
            
            {/* 3. Header Info Row */}
            <section className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
              <div className="flex items-center gap-3">
                {/* Initials glass badge */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-container/10 border border-primary-container/30 text-primary font-bold text-sm select-none">
                  {getInitials(data.author)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-on-surface">@{data.author}</span>
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs text-on-surface-variant tech-mono font-medium">TARGET: main</span>
              </div>
            </section>

            {/* 4. Bento Grid (3 columns on lg) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Bento Card: Risk Score & Recommendation (1 col) */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-between relative min-h-[340px] shadow-sm">
                {/* Confidence Badge in corner */}
                <div className="absolute top-4 right-4">
                  <RiskBadge level={data.confidence} type="confidence" />
                </div>

                <div className="w-full text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Risk Rating</span>
                </div>

                {/* RiskMeter Arc */}
                <div className="my-auto py-4">
                  <RiskMeter score={data.overall_risk_score} />
                </div>

                {/* Recommendation */}
                <div className="w-full text-left mt-4 border-t border-outline-variant/30 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Recommendation</span>
                  <p className="text-sm text-on-surface mt-1 leading-relaxed">{data.merge_recommendation}</p>
                </div>
              </div>

              {/* Right Bento Column: Stats and PieChart (2 cols) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* a) 4-up statistics card grid */}
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 text-left">
                          <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-on-surface-variant">{stat.title}</span>
                          <p className="text-2xl font-extrabold text-on-surface">{stat.value}</p>
                        </div>
                        <span className="material-symbols-outlined text-primary text-xl">{stat.icon}</span>
                      </div>
                      {/* Computed Progress Bar */}
                      <div className="w-full bg-outline-variant/20 h-1 rounded-full mt-4 overflow-hidden">
                        <div 
                          className={`h-full ${stat.colorClass} rounded-full transition-all duration-1000`} 
                          style={{ width: `${stat.progress}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* b) Recharts PieChart (Risk Distribution breakdown) */}
                <div className="glass-panel p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between min-h-[300px]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Risk Distribution</span>
                    <h3 className="text-lg font-bold text-on-surface">Files Breakdown</h3>
                  </div>
                  <div className="h-[200px] w-full flex items-center justify-center mt-4">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(18, 33, 49, 0.95)',
                              borderColor: 'rgba(70, 69, 84, 0.5)',
                              borderRadius: '12px',
                              color: '#d4e4fa'
                            }}
                          />
                          <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-on-surface-variant text-sm italic">No risk files to distribute.</p>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* Historical Risk Comparison Section */}
            {(() => {
              const mockComparisons = {
                insufficient: {
                  insufficient_data: true,
                  percentile: null,
                  median: null,
                  sample_size: 1,
                  current_score: 42,
                  repo: data?.comparison?.repo || "test-repo"
                },
                active: {
                  insufficient_data: false,
                  percentile: 78,
                  median: 35,
                  sample_size: 12,
                  current_score: 62,
                  repo: data?.comparison?.repo || "test-repo"
                }
              };

              const comparisonToRender = MOCK_COMPARISON_STATE 
                ? mockComparisons[MOCK_COMPARISON_STATE] 
                : data?.comparison;

              if (!comparisonToRender) return null;

              return (
                <section className="space-y-4">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Historical Analytics</span>
                    <h2 className="text-lg font-bold tracking-tight text-on-surface">Repo Risk Comparison</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`${comparisonToRender.insufficient_data ? 'md:col-span-3' : 'md:col-span-1'}`}>
                      <RiskComparisonCard comparison={comparisonToRender} />
                    </div>
                    {!comparisonToRender.insufficient_data && (
                      <div className="md:col-span-2">
                        <RiskPercentileChart comparison={comparisonToRender} />
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}

            {/* Explainable Risk Breakdown Section */}
            <section className="space-y-4">
              <RiskBreakdownList 
                riskFactors={data.risk_factors || []} 
                overallRiskScore={data.overall_risk_score || 0} 
              />
            </section>

            {/* 5. File Heatmap Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Diff Inspector</span>
                  <h2 className="text-lg font-bold tracking-tight text-on-surface">Analyzed Files Breakdown</h2>
                </div>
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider tech-mono">
                  Click to inspect suggestions & bugs
                </span>
              </div>
              <HeatmapGrid files={data.files} />
            </section>

          </div>

          {/* 6. Footer */}
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

        </main>
      </div>
    </div>
  )
}
