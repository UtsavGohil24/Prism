import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Sidebar({ onOpenSettings, activePage }) {
  const navigate = useNavigate()

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 border-r border-outline-variant/30 bg-surface-dim/40 backdrop-blur-xl hidden md:flex flex-col z-40">
      {/* Sidebar Header */}
      <div 
        onClick={() => navigate('/')} 
        className="h-16 flex items-center px-6 border-b border-outline-variant/30 gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-primary text-2xl">biotech</span>
        <span className="text-sm font-extrabold tracking-wider tech-tracking tech-mono text-on-surface">PRISM ENGINE</span>
      </div>

      {/* Sidebar Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link 
          to="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            activePage === 'dashboard'
              ? 'text-on-surface bg-surface-lowest/60 border border-outline-variant/20 shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-lowest/30'
          }`}
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          <span>Dashboard</span>
        </Link>
        <Link 
          to="/history"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            activePage === 'history'
              ? 'text-on-surface bg-surface-lowest/60 border border-outline-variant/20 shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-lowest/30'
          }`}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          <span>History</span>
        </Link>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-lowest/30 transition-all text-left cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          <span>Settings</span>
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-outline-variant/30 text-[10px] tech-mono text-on-surface-variant/60 text-left">
        <span>SYSTEM ONLINE</span>
      </div>
    </aside>
  )
}
