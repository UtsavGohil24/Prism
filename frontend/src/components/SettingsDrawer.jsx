import React, { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { getSystemStatus } from '../utils/api'

export default function SettingsDrawer({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  const fetchStatus = () => {
    setLoading(true)
    getSystemStatus()
      .then((res) => {
        setStatus(res)
        setIsOnline(true)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch system status', err)
        setIsOnline(false)
        setLoading(false)
      })
  }

  useEffect(() => {
    if (isOpen) {
      fetchStatus()
    }
  }, [isOpen])

  // Click outside to close backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      {/* Sliding Drawer Container */}
      <div 
        className={`w-full max-w-[380px] h-full glass-panel border-l border-outline-variant/30 flex flex-col justify-between p-6 shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">settings</span>
            <h2 className="text-base font-extrabold tracking-wider tech-tracking tech-mono text-on-surface">SETTINGS</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-high/50 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Sections Scrollable Wrapper */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-left">
          
          {/* SECTION 1 - Account */}
          <div className="glass-card p-5 rounded-xl border border-outline-variant/30 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-xl">account_circle</span>
              <h3 className="text-sm font-bold tech-mono tracking-wider">Account</h3>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-on-surface">No account required</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                PRism works completely without login — analyze any public GitHub Pull Request directly.
              </p>
            </div>
          </div>

          {/* SECTION 2 - Theme (Appearance) */}
          <div className="glass-card p-5 rounded-xl border border-outline-variant/30 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-xl">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <h3 className="text-sm font-bold tech-mono tracking-wider">Appearance</h3>
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-on-surface-variant">Theme Mode</span>
              <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-surface-lowest/70 border border-outline-variant/40 rounded-lg hover:border-primary text-on-surface transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 3 - System Status */}
          <div className="glass-card p-5 rounded-xl border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between text-primary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">dns</span>
                <h3 className="text-sm font-bold tech-mono tracking-wider">System Status</h3>
              </div>
              {/* Online/Offline Badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isOnline 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'bg-error/20 text-error border border-error/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-error'}`} />
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </span>
            </div>

            {/* API Status Metrics */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">GitHub Token</span>
                <span className="flex items-center">
                  {status?.github_token ? (
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-error text-lg">cancel</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Gemini API</span>
                <span className="flex items-center">
                  {status?.gemini_api_key ? (
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-error text-lg">cancel</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Groq Fallback</span>
                <span className="flex items-center">
                  {status?.groq_api_key ? (
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-error text-lg">cancel</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant font-medium">Supabase DB</span>
                <span className="flex items-center">
                  {status?.supabase_configured ? (
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-error text-lg">cancel</span>
                  )}
                </span>
              </div>

              {/* API Base URL Read-Only Input */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-on-surface-variant">API Endpoint URL</span>
                <div className="bg-surface-lowest/70 border border-outline-variant/40 rounded-lg p-2 select-all break-all text-[10px] text-on-surface font-mono">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-outline-variant/20 text-center">
          <span className="text-[9px] tech-mono text-on-surface-variant/40">PRISM CONTROL PANEL v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
