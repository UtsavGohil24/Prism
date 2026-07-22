export const MOCK_REPORT = {
  report_id: 'mock001',
  pr_url: 'https://github.com/example/repo/pull/42',
  pr_title: 'Add auth module',
  author: 'dev_user',
  created_at: '2025-06-26T10:00:00Z',
  overall_risk_score: 72,
  confidence: 'high',
  merge_recommendation: 'Review carefully before merging.',
  summary: {
    total_files: 8,
    high_risk_files: 3,
    medium_risk_files: 3,
    low_risk_files: 2,
    total_bugs: 5
  },
  files: [
    {
      filename: 'auth/login.py',
      risk_level: 'high',
      lines_changed: 42,
      bugs: ['SQL injection risk on line 34'],
      suggestions: ['Use parameterized queries']
    },
    {
      filename: 'utils/helpers.js',
      risk_level: 'medium',
      lines_changed: 18,
      bugs: ['Unhandled promise rejection'],
      suggestions: ['Add .catch() or try/catch']
    },
    {
      filename: 'README.md',
      risk_level: 'low',
      lines_changed: 5,
      bugs: [],
      suggestions: []
    }
  ]
}
