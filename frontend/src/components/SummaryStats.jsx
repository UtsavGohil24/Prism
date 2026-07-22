import React from 'react'

export default function SummaryStats({ summary = {}, files = [] }) {
  const totalFiles = summary.total_files || 0
  const highRisk = summary.high_risk_files || 0
  const bugsFound = summary.total_bugs || 0
  
  // Calculate total lines changed from the files array
  const linesChanged = files.reduce((acc, curr) => acc + (curr.lines_changed || 0), 0)

  const stats = [
    {
      title: 'Total Files',
      value: totalFiles,
      icon: (
        <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'High Risk Files',
      value: highRisk,
      icon: (
        <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      valueColor: highRisk > 0 ? 'text-danger' : 'text-textpri'
    },
    {
      title: 'Bugs Detected',
      value: bugsFound,
      icon: (
        <svg className="h-6 w-6 text-warn" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      valueColor: bugsFound > 0 ? 'text-warn' : 'text-textpri'
    },
    {
      title: 'Lines Changed',
      value: linesChanged,
      icon: (
        <svg className="h-6 w-6 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => (
        <div 
          key={idx}
          className="bg-card border border-border rounded-xl backdrop-blur-sm p-5 sm:p-6 shadow-lg flex items-center justify-between transition-all hover:border-border/80"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-textmuted">
              {stat.title}
            </p>
            <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${stat.valueColor || 'text-textpri'}`}>
              {stat.value}
            </p>
          </div>
          <div className="rounded-lg bg-bg/50 p-2.5 border border-border/30">
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  )
}
