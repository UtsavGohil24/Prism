import apiClient from '../lib/apiClient'

export const analyzePR = (prUrl) =>
  apiClient.post(`/analyze`, { pr_url: prUrl }).then(r => r.data)

export const getReport = (reportId) =>
  apiClient.get(`/report/${reportId}`).then(r => r.data)

export const getSystemStatus = () =>
  apiClient.get(`/status`).then(r => r.data)

export const listReports = (limit = 20) =>
  apiClient.get(`/reports`, { params: { limit } }).then(r => r.data)

export const chatWithReport = (reportId, message, history = []) =>
  apiClient.post(`/report/${reportId}/chat`, { message, history }).then(r => r.data)