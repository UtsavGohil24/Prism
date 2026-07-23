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
  const [stepsFinished, setStepsFinished] = useState(false)

  const runAnalysis = () => {
    if (!prUrl) {
      setError('No Pull Request URL provided. Please go back and enter a valid URL.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setStepsFinished(false)
    apiDataRef.current = null

    analyzePR(prUrl)
      .then((data) => {
        apiDataRef.current = data
        // Redirect immediately once the API response is received
        navigate(`/report/${data.report_id}`)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'An error occurred during PR analysis. Please ensure the PR is public and valid.')
        setLoading(false)
      })
  }

  // Run on mount or when URL changes
  useEffect(() => {
    runAnalysis()
  }, [prUrl])

  // Fired when the 3 animated loading stages (4.5s total) complete
  const handleLoadingFinished = () => {
    setStepsFinished(true)
    // If the API call has already completed, navigate now
    if (apiDataRef.current) {
      navigate(`/report/${apiDataRef.current.report_id}`)
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
