import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const navigate = useNavigate()

  const handleAnalyze = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    navigate(`/analyze?url=${encodeURIComponent(url.trim())}`)
  }

  const handleNavAnalyzeClick = () => {
    const input = document.getElementById('pr-url-input')
    if (input) {
      input.focus()
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const steps = [
    {
      num: '01',
      icon: 'link',
      title: 'Paste URL',
      desc: 'Provide the link to any public GitHub Pull Request.'
    },
    {
      num: '02',
      icon: 'psychology',
      title: 'AI Analyzes Diff',
      desc: 'Our models run risk grading, bug detection, and review recommendations.'
    },
    {
      num: '03',
      icon: 'description',
      title: 'Get Visual Report',
      desc: 'Download a PDF report of risk scores, lines changed, and code quality suggestions.'
    }
  ]

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between text-on-surface">
      {/* 1. Top Nav Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-dim/40 backdrop-blur-xl border-b border-outline-variant/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Left: Logo + Biotech Icon */}
          <div onClick={() => navigate('/')} className="flex cursor-pointer items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl animate-pulse">biotech</span>
            <span className="text-xl font-extrabold tracking-tight tech-tracking">
              PR<span className="text-primary-container">ism</span>
            </span>
          </div>

          {/* Center: Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-on-surface-variant">
            <Link to="/" className="hover:text-on-surface transition-colors">Dashboard</Link>
            <Link to="/history" className="hover:text-on-surface transition-colors">History</Link>
          </div>

          {/* Right: CTA Button */}
          <button
            onClick={handleNavAnalyzeClick}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-primary-container/40 rounded-lg hover:bg-primary-container/10 transition-all cursor-pointer"
          >
            Analyze PR
          </button>
        </div>
      </nav>

      {/* Main Content container */}
      <div className="flex-1 w-full max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
        {/* 2. Hero Section */}
        <header className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-8">
          {/* Left: Headline & Subtext */}
          <div className="space-y-6 text-left">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-on-surface">
              Paste a PR.<br />
              Get a <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">risk report.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
              AI-powered merge confidence scoring, automated bug detection, and code safety reviews for any public GitHub pull request.
            </p>
          </div>

          {/* Right: Glass Card Panel */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <form onSubmit={handleAnalyze} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="pr-url-input" className="block text-xs font-bold tracking-wider tech-mono text-primary">
                  GITHUB PULL REQUEST URL
                </label>
                <div className="relative flex items-center">
                  <input
                    id="pr-url-input"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/org/repo/pull/42"
                    className="w-full pr-12 bg-surface-lowest/70 border border-outline-variant/60 rounded-xl py-3.5 px-4 text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all text-sm sm:text-base"
                  />
                  <span className="material-symbols-outlined absolute right-4 text-on-surface-variant">link</span>
                </div>
              </div>

              <button
                type="submit"
                className="primary-button w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span className="material-symbols-outlined">analytics</span>
                Analyze PR
              </button>
            </form>

            {/* Decorative indicators */}
            <div className="mt-6 pt-6 border-t border-outline-variant/30 flex justify-between text-xs text-on-surface-variant/70 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">security</span>
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                <span>15s Avg. Audit</span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Continuous Intelligence 3-Step Section */}
        <section className="space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider tech-mono text-primary">
              How It Works
            </h2>
            <p className="text-2xl font-bold text-on-surface">
              Continuous Intelligence Pipeline
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl relative flex flex-col justify-between min-h-[160px] overflow-hidden">
                <span className="absolute top-4 right-6 text-6xl font-extrabold text-primary-container/10 select-none font-mono">
                  {step.num}
                </span>
                <div className="space-y-3 mt-4 text-left">
                  <span className="material-symbols-outlined text-primary text-2xl">{step.icon}</span>
                  <h3 className="text-lg font-bold text-on-surface">
                    {step.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Bento Showcase Section */}
        <section className="space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider tech-mono text-primary">
              Platform Features
            </h2>
            <p className="text-2xl font-bold text-on-surface">
              Static & Semantic Analysis
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Large Bento Card (8 cols) */}
            <div className="lg:col-span-8 glass-card p-8 rounded-2xl flex flex-col justify-between overflow-hidden relative min-h-[360px]">
              {/* Radial gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
              
              <div className="space-y-3 text-left relative z-10">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-container/30 bg-primary-container/10 px-3 py-1 text-xs font-semibold text-primary">
                  <span>Interactive Heatmap View</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">
                  Visual Change Heatmaps
                </h3>
                <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">
                  Analyze pull request files in real-time, grade change risk, and identify hotspots. Spot bugs and performance optimizations before merging.
                </p>
              </div>

              {/* Mock UI Code Window (Stitch Mock representation) */}
              <div className="mt-8 rounded-xl border border-outline-variant/40 bg-surface-lowest/70 backdrop-blur p-4 text-left font-mono text-[11px] sm:text-xs text-on-surface-variant relative z-10 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-error" />
                    <span className="w-3 h-3 rounded-full bg-tertiary" />
                    <span className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <span className="text-[10px] text-primary tech-mono">auth_service.py</span>
                </div>
                <div className="space-y-1">
                  <div className="text-red-400 opacity-80">- def check_auth(token):</div>
                  <div className="text-primary-container font-semibold">+ def check_auth(token, session_db):</div>
                  <div className="text-on-surface/50">     # Validate token security</div>
                  <div className="text-primary-container font-semibold">+    if not token or len(token) &lt; 32:</div>
                  <div className="text-red-400 opacity-80">-        return False</div>
                  <div className="text-primary-container font-semibold">+        raise InvalidTokenError()</div>
                </div>
              </div>
            </div>

            {/* Small Bento Cards Stack (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Card 1: Bug Detection */}
              <div className="glass-card p-6 rounded-2xl text-left flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="material-symbols-outlined text-primary text-3xl">bug_report</span>
                  <h4 className="text-lg font-bold text-on-surface">Bug Detection</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Identify syntax errors, logical flaws, and edge cases in your changes automatically before merge.
                  </p>
                </div>
              </div>

              {/* Card 2: Security Audit */}
              <div className="glass-card p-6 rounded-2xl text-left flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="material-symbols-outlined text-primary text-3xl">security</span>
                  <h4 className="text-lg font-bold text-on-surface">Security Audit</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Scan for exposed secrets, dependency issues, and potential vulnerability vectors in the diff.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Footer */}
      <footer className="w-full mt-24 border-t border-outline-variant/30 bg-surface-lowest/40 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
          <div className="flex items-center gap-2 font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary text-xl">biotech</span>
            <span className="tech-tracking uppercase text-xs">PRism Engine v1.0.0</span>
          </div>
          <p>© {new Date().getFullYear()} PRism. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
