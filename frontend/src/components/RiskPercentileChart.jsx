import React from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts'

export default function RiskPercentileChart({ comparison }) {
  if (!comparison || comparison.insufficient_data) return null

  const { percentile, median, current_score } = comparison

  // Data for the chart: single row representing the PR's position
  const data = [
    {
      name: 'This PR',
      percentile: percentile,
      score: current_score,
    }
  ]

  // Decide color of the percentile marker/bar based on current_score
  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--color-error)'
    if (score >= 35) return '#F59E0B' // warning yellow/orange
    return '#10B981' // green
  }

  const scoreColor = getScoreColor(current_score)

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between min-h-[160px] h-full relative overflow-hidden">
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider tech-mono text-primary">Percentile Distribution</span>
        <h3 className="text-lg font-bold text-on-surface">Repo Percentile Placement</h3>
      </div>

      <div className="h-[80px] w-full mt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
              stroke="var(--color-on-surface-variant)"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              hide
            />
            {/* Background track bar */}
            <Bar
              dataKey={() => 100}
              barSize={16}
              fill="var(--color-outline-variant)"
              radius={8}
              isAnimationActive={false}
            />
            {/* Active percentile bar */}
            <Bar
              dataKey="percentile"
              barSize={16}
              fill={scoreColor}
              radius={8}
            />
            {/* Median Reference Line at 50% */}
            <ReferenceLine
              x={50}
              stroke="var(--color-primary)"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: `Historical Median (${median})`,
                position: 'top',
                fill: 'var(--color-on-surface-variant)',
                fontSize: 10,
                fontFamily: 'JetBrains Mono'
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[10px] text-on-surface-variant flex justify-between mt-2 tech-mono">
        <span>Safer (0%)</span>
        <span>Riskier (100%)</span>
      </div>
    </div>
  )
}
