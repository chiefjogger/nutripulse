import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MacroRingProps {
  current: number
  target: number
  color: string
  size?: number
  strokeWidth?: number
  label?: string
  unit?: string
  className?: string
}

export function MacroRing({
  current,
  target,
  color,
  size = 120,
  strokeWidth = 8,
  label,
  unit = '',
  className,
}: MacroRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(current / Math.max(target, 1), 1.5)
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1))
  const isOver = current > target
  const center = size / 2

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-elevated"
          opacity={0.5}
        />
        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isOver ? '#EF4444' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums"
          style={{
            fontSize: size > 140 ? '1.5rem' : size > 100 ? '1.125rem' : '0.875rem',
            color: isOver ? '#EF4444' : color,
          }}
        >
          {Math.round(current)}
        </span>
        {target > 0 && (
          <span className="text-text-muted" style={{ fontSize: size > 100 ? '0.75rem' : '0.625rem' }}>
            / {Math.round(target)}{unit}
          </span>
        )}
        {label && (
          <span className="text-text-secondary mt-0.5" style={{ fontSize: '0.625rem' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
