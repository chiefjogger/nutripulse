import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CalorieSparklineProps {
  data: { date: string; calories: number; target: number }[]
}

export function CalorieSparkline({ data }: CalorieSparklineProps) {
  if (data.length < 2) return null

  const maxCal = Math.max(...data.map(d => Math.max(d.calories, d.target)), 1)
  const width = 280
  const height = 60
  const padding = 4

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - d.calories / maxCal) * (height - padding * 2),
    calories: d.calories,
    target: d.target,
    date: d.date,
  }))

  const targetPoints = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - d.target / maxCal) * (height - padding * 2),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const targetPathD = targetPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  const avgCal = data.reduce((sum, d) => sum + d.calories, 0) / data.length
  const avgTarget = data.reduce((sum, d) => sum + d.target, 0) / data.length
  const diff = avgCal - avgTarget
  const trendIcon = diff > 50 ? <TrendingUp size={14} /> : diff < -50 ? <TrendingDown size={14} /> : <Minus size={14} />
  const trendColor = diff > 50 ? 'text-danger' : diff < -50 ? 'text-success' : 'text-text-muted'

  return (
    <GlassCard className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">7-Day Trend</span>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          {trendIcon}
          <span>{Math.abs(Math.round(diff))} kcal {diff > 0 ? 'over' : 'under'}</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <motion.path
          d={areaD}
          fill="url(#sparkGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Target line (dashed) */}
        <motion.path
          d={targetPathD}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Actual line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />

        {/* Dots */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={p.calories > p.target ? 'var(--color-danger)' : 'var(--color-accent)'}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
          />
        ))}
      </svg>

      {/* Day labels */}
      <div className="flex justify-between text-[9px] text-text-muted">
        {data.map((d, i) => (
          <span key={i}>{d.date.slice(-2)}</span>
        ))}
      </div>
    </GlassCard>
  )
}
