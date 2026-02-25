import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

interface StreakCardProps {
  daysLogged: number
  currentStreak: number
  weekData: boolean[]  // last 7 days logged status
}

export function StreakCard({ daysLogged, currentStreak, weekData }: StreakCardProps) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="animate-flame"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          >
            <Flame size={20} className="text-calories" />
          </motion.div>
          <div>
            <div className="text-sm font-semibold text-text-primary">
              {currentStreak} day streak
            </div>
            <div className="text-xs text-text-muted">{daysLogged} total days logged</div>
          </div>
        </div>

        {/* Mini streak flame animation */}
        {currentStreak >= 3 && (
          <motion.div
            className="flex items-center gap-0.5"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            {Array.from({ length: Math.min(currentStreak, 5) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1 - i * 0.15, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Flame size={12 + (4 - i) * 2} className="text-calories" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Week dots */}
      <div className="flex justify-between gap-1">
        {weekData.map((logged, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                logged
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-bg-elevated text-text-muted'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05, type: 'spring', stiffness: 300 }}
            >
              {logged && (
                <motion.svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                >
                  <motion.path
                    d="M2 5 L4 7 L8 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                  />
                </motion.svg>
              )}
            </motion.div>
            <span className="text-[9px] text-text-muted">{days[i]}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
