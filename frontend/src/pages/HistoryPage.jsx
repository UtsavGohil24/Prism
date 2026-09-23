  import React, { useEffect, useState, useMemo } from 'react'
  import { useNavigate } from 'react-router-dom'
  import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Dot
  } from 'recharts'
  import { listReports } from '../utils/api'
  import Sidebar from '../components/Sidebar'
  import SettingsDrawer from '../components/SettingsDrawer'
  import RiskBadge from '../components/RiskBadge'

  // Extract "owner/repo" from a GitHub PR URL
  function extractRepo(prUrl) {
    try {
      const match = prUrl.match(/github\.com\/([^/]+\/[^/]+)\/pull\//)
      return match ? match[1] : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // Extract the PR number safely (ignores trailing /files, ?query, #hash)
  function extractPrNumber(prUrl) {
    return prUrl?.match(/\/pull\/(\d+)/)?.[1] ?? '?'
  }

  // Unique identity of a PR across repos, e.g. "UtsavGohil24/Prism#5"
  function prKeyOf(report) {
    return `${report.repo}#${extractPrNumber(report.pr_url)}`
  }

  // Deduplicate by diff_hash: if the exact same diff content was analyzed
  // more than once, keep only the most recent one. Reports with different
  // diff_hash values (including new commits on the same PR) are kept as
  // separate points, since they represent real changes.
  function deduplicateReports(reports) {
    const seen = new Map()
    for (const r of reports) {
      const key = r.diff_hash || r.pr_url // fallback for legacy rows with no diff_hash
      if (!seen.has(key) || new Date(r.created_at) > new Date(seen.get(key).created_at)) {
        seen.set(key, r)
      }
    }
    return Array.from(seen.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }

  // Color based on risk score
  function riskColor(score) {
    if (score >= 70) return '#ffb4ab'   // error
    if (score >= 35) return '#c1c6db'   // tertiary
    return '#c0c1ff'                     // primary
  }

  export default function HistoryPage() {
    const navigate = useNavigate()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [selectedRepo, setSelectedRepo] = useState('all')
    const [selectedPr, setSelectedPr] = useState(null) // e.g. "owner/repo#5" or null

    const fetchHistory = () => {
      setLoading(true)
      setError(null)
      listReports(50)
        .then((res) => {
          const raw = res.reports || []
          const withRepo = raw.map(r => ({ ...r, repo: extractRepo(r.pr_url) }))
          setReports(withRepo)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Failed to fetch history', err)
          setError(err.message || 'Failed to retrieve analysis history.')
          setLoading(false)
        })
    }

    useEffect(() => { fetchHistory() }, [])

    const repos = useMemo(() => {
      return [...new Set(reports.map(r => r.repo))].filter(r => r !== 'unknown')
    }, [reports])

    // Filter + deduplicate (by diff_hash) reports for selected repo
    const filteredReports = useMemo(() => {
      const subset = selectedRepo === 'all' ? reports : reports.filter(r => r.repo === selectedRepo)
      return deduplicateReports(subset)
    }, [reports, selectedRepo])

    // Every analysis as a point, with its version number within its PR.
    // Computed over ALL filtered reports so "v2" means the same thing in both views.
    const allPoints = useMemo(() => {
      const totals = {}
      filteredReports.forEach(r => {
        const k = prKeyOf(r)
        totals[k] = (totals[k] || 0) + 1
      })
      const running = {}
      return filteredReports.map(r => {
        const k = prKeyOf(r)
        running[k] = (running[k] || 0) + 1
        return {
          ...r,
          prKey: k,
          pr: extractPrNumber(r.pr_url),
          revision: running[k],
          revisionTotal: totals[k],
          date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          time: new Date(r.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          risk_score: r.risk_score ?? r.overall_risk_score ?? 0,
        }
      })
    }, [filteredReports])

    // Chart data: all PRs, or only the selected PR's versions.
    // `idx` is a unique x-axis key so the tooltip resolves the right point
    // even when many points share the same date.
    const chartData = useMemo(() => {
      const subset = selectedPr ? allPoints.filter(p => p.prKey === selectedPr) : allPoints
      return subset.map((p, i) => ({ ...p, idx: i }))
    }, [allPoints, selectedPr])

    // Report list follows the same scope as the chart
    const visiblePoints = useMemo(() => {
      return selectedPr ? allPoints.filter(p => p.prKey === selectedPr) : allPoints
    }, [allPoints, selectedPr])

    const avgScore = useMemo(() => {
      if (!chartData.length) return 0
      return Math.round(chartData.reduce((s, r) => s + r.risk_score, 0) / chartData.length)
    }, [chartData])

    // In PR view: change between first and latest version
    const delta = useMemo(() => {
      if (!selectedPr || chartData.length < 2) return null
      return chartData[chartData.length - 1].risk_score - chartData[0].risk_score
    }, [selectedPr, chartData])

    const selectedPrNumber = selectedPr ? selectedPr.split('#')[1] : null

    const changeRepo = (repo) => {
      setSelectedRepo(repo)
      setSelectedPr(null)
    }

    // Clicking a point: overview -> drill into that PR; PR view -> open that report
    const handlePointClick = (point) => {
      if (!point) return
      if (!selectedPr) setSelectedPr(point.prKey)
      else navigate(`/report/${point.report_id}`)
    }

    const renderDot = (props, r = 5) => {
      const { key, cx, cy, payload } = props
      if (cx == null || cy == null) return null
      return (
        <Dot
          key={key}
          cx={cx}
          cy={cy}
          r={r}
          fill={riskColor(payload.risk_score)}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          style={{ cursor: 'pointer' }}
          onClick={() => handlePointClick(payload)}
        />
      )
    }

    const CustomTooltip = ({ active, payload }) => {
      if (!active || !payload?.length) return null
      const d = payload[0].payload
      return (
        <div className="bg-surface-dim/95 border border-outline-variant/40 rounded-xl px-4 py-3 text-xs shadow-xl">
          <p className="font-bold text-on-surface mb-1 truncate max-w-[200px]">{d.repo}</p>
          <p className="text-on-surface-variant">
            PR #{d.pr}{d.revisionTotal > 1 && ` (version ${d.revision} of ${d.revisionTotal})`}
          </p>
          <p className="text-on-surface-variant">{d.date}, {d.time}</p>
          <p className="font-extrabold mt-1 text-sm" style={{ color: riskColor(d.risk_score) }}>
            Risk: {d.risk_score}
          </p>
          <p className="text-[10px] text-on-surface-variant/60 mt-1.5">
            {selectedPr ? 'Click to open this report' : 'Click to see this PR\u2019s trend'}
          </p>
        </div>
      )
    }

    return (
      <div className="min-h-screen text-on-surface flex bg-transparent">
        <Sidebar activePage="history" onOpenSettings={() => setIsSettingsOpen(true)} />
        <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        <main className="flex-1 flex flex-col md:ml-64 min-h-screen">

          {/* Top Header */}
          <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-surface-dim/40 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30">
            <div className="flex items-center gap-3 text-left">
              <span className="material-symbols-outlined text-primary text-2xl">history</span>
              <div className="w-px h-6 bg-outline-variant/40" />
              <h1 className="text-sm font-extrabold tracking-wider tech-tracking tech-mono text-on-surface">
                ANALYSIS HISTORY
              </h1>
            </div>
          </header>

          <div className="pt-20 px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col justify-between">
            <div className="space-y-8">

              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Archive</span>
                  <h2 className="text-xl font-bold text-on-surface">Audit Records</h2>
                  <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
                    Browse previously analyzed pull requests and track risk trends over time.
                  </p>
                </div>

                {/* Repo Filter */}
                {repos.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-on-surface-variant">Filter:</span>
                    <button
                      onClick={() => changeRepo('all')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        selectedRepo === 'all'
                          ? 'bg-primary text-on-primary border-primary'
                          : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/50'
                      }`}
                    >
                      All Repos
                    </button>
                    {repos.map(repo => (
                      <button
                        key={repo}
                        onClick={() => changeRepo(repo)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all truncate max-w-[150px] ${
                          selectedRepo === repo
                            ? 'bg-primary text-on-primary border-primary'
                            : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/50'
                        }`}
                        title={repo}
                      >
                        {repo}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
              ) : filteredReports.length === 0 ? (
                <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-4xl">folder_open</span>
                  <p className="text-sm font-semibold text-on-surface">No reports yet</p>
                  <p className="text-xs text-on-surface-variant">Analyze a Pull Request on the dashboard to see it cataloged here.</p>
                </div>
              ) : (
                <>
                  {/* Historical Trends Chart */}
                  {(chartData.length >= 2 || selectedPr) && (
                    <section className="glass-panel p-6 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="text-left space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">
                            {selectedPr ? 'PR Trend' : 'Historical Trends'}
                          </span>
                          <h3 className="text-lg font-bold text-on-surface">
                            {selectedPr ? `PR #${selectedPrNumber} across versions` : 'Risk Score Over Time'}
                          </h3>
                          <p className="text-xs text-on-surface-variant">
                            {selectedPr
                              ? 'Each point is one analysis of this PR. Click a point to open that report.'
                              : 'Click a point to see the trend for that PR.'}
                          </p>
                          {selectedPr && (
                            <button
                              onClick={() => setSelectedPr(null)}
                              className="mt-2 px-3 py-1.5 text-xs font-bold rounded-lg border border-outline-variant/50 text-on-surface-variant hover:border-primary/50 transition-all cursor-pointer"
                            >
                              &larr; Back to all PRs
                            </button>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider tech-mono text-on-surface-variant">
                            {selectedPr ? 'Latest' : 'Avg Risk'}
                          </p>
                          <p className="text-2xl font-extrabold" style={{ color: riskColor(selectedPr ? chartData[chartData.length - 1]?.risk_score ?? 0 : avgScore) }}>
                            {selectedPr ? chartData[chartData.length - 1]?.risk_score ?? 0 : avgScore}
                          </p>
                          {delta !== null && (
                            <p className="text-[10px] font-bold tech-mono text-on-surface-variant">
                              {delta > 0 ? '+' : ''}{delta} since v1
                            </p>
                          )}
                        </div>
                      </div>

                      {chartData.length < 2 ? (
                        <div className="h-[160px] flex items-center justify-center text-xs text-on-surface-variant text-center">
                          This PR has only one analysis so far. Analyze it again after new commits to see a trend.
                        </div>
                      ) : (
                        <div className="h-[240px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis
                                dataKey="idx"
                                tickFormatter={(i) => {
                                const d = chartData[i]
                                if (!d) return ''
                                // PR-specific trend view: label points by version (v1, v2, ...)
                                if (selectedPr) return `v${d.revision}`
                                // Main/overview chart: always just the PR number, never version tags
                                return `#${d.pr}`
                                }}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <ReferenceLine y={70} stroke="rgba(255,180,171,0.3)" strokeDasharray="4 4" label={{ value: 'High', position: 'right', fontSize: 9, fill: 'rgba(255,180,171,0.6)' }} />
                              <ReferenceLine y={35} stroke="rgba(193,198,219,0.3)" strokeDasharray="4 4" label={{ value: 'Med', position: 'right', fontSize: 9, fill: 'rgba(193,198,219,0.6)' }} />
                              <Line
                                type="monotone"
                                dataKey="risk_score"
                                stroke="#c0c1ff"
                                strokeWidth={2}
                                dot={(props) => renderDot(props, 5)}
                                activeDot={(props) => renderDot(props, 7)}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Legend */}
                      <div className="flex items-center gap-6 text-[10px] font-bold tech-mono text-on-surface-variant justify-end">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ffb4ab]" />HIGH ≥70
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#c1c6db]" />MED ≥35
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#c0c1ff]" />LOW &lt;35
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Report List */}
                  <div className="space-y-3">
                    {[...visiblePoints].reverse().map((report) => {
                      const score = report.risk_score
                      const formattedDate = report.created_at
                        ? new Date(report.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
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
                              {report.revisionTotal > 1 && (
                                <span className="px-1.5 py-0.5 rounded border border-outline-variant/50 text-[10px] font-bold tech-mono">
                                  v{report.revision} of {report.revisionTotal}
                                </span>
                              )}
                              <span>•</span>
                              <span>by @{report.author}</span>
                              <span>•</span>
                              <span>{formattedDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <RiskBadge level={report.confidence} type="confidence" />
                            <div className="w-12 text-center">
                              <div
                                className="text-lg font-extrabold"
                                style={{ color: riskColor(score) }}
                              >
                                {score}
                              </div>
                              <div className="text-[9px] font-bold text-on-surface-variant/60 tech-mono">RISK</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
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