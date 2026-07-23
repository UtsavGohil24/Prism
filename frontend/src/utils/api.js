import axios from 'axios'
const BASE = import.meta.env.VITE_API_BASE_URL
export const analyzePR = (prUrl) =>
  axios.post(`${BASE}/analyze`, { pr_url: prUrl }).then(r => r.data)
export const getReport = (reportId) =>
  axios.get(`${BASE}/report/${reportId}`).then(r => r.data)

export const getSystemStatus = () =>
  axios.get(`${BASE}/status`).then(r => r.data)

export const listReports = (limit = 20) =>
  axios.get(`${BASE}/reports`, { params: { limit } }).then(r => r.data)
