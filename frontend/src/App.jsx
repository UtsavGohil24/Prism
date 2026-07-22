import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'
import NotFound from './pages/NotFound'
import AnimatedBackground from './components/AnimatedBackground'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen text-on-surface flex flex-col">
        <Navbar />
        <AnimatedBackground />
        <main className="flex-1 w-full relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/report/:report_id" element={<ReportPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
