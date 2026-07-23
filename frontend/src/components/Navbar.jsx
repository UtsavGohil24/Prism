import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const { pathname } = location
  if (pathname === '/' || pathname === '/history' || pathname.startsWith('/report/')) {
    return null
  }

  const handleAnalyzeClick = () => {
    if (location.pathname === '/') {
      const input = document.getElementById('pr-url-input')
      if (input) {
        input.focus()
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      navigate('/')
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div 
          onClick={() => navigate('/')} 
          className="flex cursor-pointer items-center gap-2.5"
        >
          <svg 
            className="h-8 w-8 text-accent animate-pulse" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <polygon points="12 2 2 22 22 22" className="stroke-accent" />
            <polygon points="12 2 12 22" className="stroke-violet opacity-80" />
            <polygon points="2 22 12 12 22 22" className="stroke-accent opacity-50" />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-white">
            PR<span className="text-accent">ism</span>
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleAnalyzeClick}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-violet focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          Analyze PR
        </button>
      </div>
    </nav>
  )
}
