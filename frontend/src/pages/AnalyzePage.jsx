import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { analyzePR } from '../utils/api'
import { MODELS, DEFAULT_MODEL } from '../utils/models'
import LoadingScreen from '../components/LoadingScreen'
import ErrorState from '../components/ErrorState'

export default function AnalyzePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const prUrl = searchParams.get('url')

  // Model comes from the landing page: /analyze?url=...&model=nemotron
  // Anything unknown falls back to the default so a bad URL can't break the request.
  const requestedModel = searchParams.get('model')
  const model = MODELS.some(m => m.key === requestedModel) ? requestedModel : DEFAULT_MODEL

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Track state of API response and loading screen animation completion
  const apiDataRef = useRef(null)
  const stepsFinishedRef = useRef(false)
  const [stepsFinished, setStepsFinished] = useState(false)

  // Guards against React StrictMode's dev-mode double-invocation of effects,
  // which would otherwise fire runAnalysis() twice and create two reports.
  // Keyed on URL + model so switching model on the same URL still runs.
  const hasRunForKeyRef = useRef(null)

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

    analyzePR(prUrl, model)
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
        // The backend puts the real reason in `detail` (e.g. "AI analysis failed: ...").
        // err.message alone would just say "Request failed with status code 502".
        const detail = err.response?.data?.detail
        setError(
          (typeof detail === 'string' && detail) ||
          err.message ||
          'An error occurred during PR analysis. Please ensure the PR is public and valid.'
        )
        setLoading(false)
      })
  }

  // Run on mount or when URL / model changes
  useEffect(() => {
    const key = `${prUrl}|${model}`
    if (hasRunForKeyRef.current === key) return
    hasRunForKeyRef.current = key
    runAnalysis()
  }, [prUrl, model])

  // Fired when the animated loading stages complete
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
      <LoadingScreen onFinished={handleLoadingFinished} model={model} />
    </div>
  )
}
