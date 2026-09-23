import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { analyzePR } from '../utils/api'
import LoadingScreen from '../components/LoadingScreen'
import ErrorState from '../components/ErrorState'

export default function AnalyzePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const prUrl = searchParams.get('url')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Track state of API response and loading screen animation completion
  const apiDataRef = useRef(null)
  const stepsFinishedRef = useRef(false)
  const [stepsFinished, setStepsFinished] = useState(false)

  // Guards against React StrictMode's dev-mode double-invocation of effects,
  // which would otherwise fire runAnalysis() twice and create two reports.
  const hasRunForUrlRef = useRef(null)

  const runAnalysis = () => {
    if (!prUrl) {
      setError('No Pull Request URL provided. Please go back and enter a valid URL.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setStepsFinished(false)
    stepsFinishedRef.current = false
    apiDataRef.current = null

    analyzePR(prUrl)
      .then((data) => {
        apiDataRef.current = data
        // Only navigate now if the loading animation already finished;
        // otherwise handleLoadingFinished will navigate once it completes.
        if (stepsFinishedRef.current) {
          navigate(`/report/${data.report_id}`, { replace: true })
        }
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'An error occurred during PR analysis. Please ensure the PR is public and valid.')
        setLoading(false)
      })
  }

  // Run on mount or when URL changes
  useEffect(() => {
    if (hasRunForUrlRef.current === prUrl) return
    hasRunForUrlRef.current = prUrl
    runAnalysis()
  }, [prUrl])

  // Fired when the 3 animated loading stages (4.5s total) complete
  const handleLoadingFinished = () => {
    stepsFinishedRef.current = true
    setStepsFinished(true)
    // If the API call has already completed, navigate now
    if (apiDataRef.current) {
      navigate(`/report/${apiDataRef.current.report_id}`, { replace: true })
    }
  }

  // If steps have finished but API is still pending, we remain in loading state,
  // showing the final stage active.
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <ErrorState 
          message={error} 
          onRetry={runAnalysis} 
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <LoadingScreen onFinished={handleLoadingFinished} />
    </div>
  )
}