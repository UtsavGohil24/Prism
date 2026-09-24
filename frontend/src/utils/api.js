import apiClient from '../lib/apiClient'

// Analysis can take a while: a free-tier model may stall before the backend
// falls back to Groq. apiClient has no timeout of its own, so this is a
// generous safety net (5 min) rather than the normal path.
const ANALYZE_TIMEOUT_MS = 300_000

// model: "gemini" | "nemotron" | "glm" (must match the backend's AnalysisRequest)
export const analyzePR = (prUrl, model = 'gemini') =>
  apiClient
    .post(`/analyze`, { pr_url: prUrl, model }, { timeout: ANALYZE_TIMEOUT_MS })
    .then(r => r.data)

export const getReport = (reportId) =>
  apiClient.get(`/report/${reportId}`).then(r => r.data)

export const getSystemStatus = () =>
  apiClient.get(`/status`).then(r => r.data)

export const listReports = (limit = 20) =>
  apiClient.get(`/reports`, { params: { limit } }).then(r => r.data)

export const chatWithReport = (reportId, message, history = []) =>
  apiClient.post(`/report/${reportId}/chat`, { message, history }).then(r => r.data)
