import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Drumstick, Wheat, Droplets } from 'lucide-react'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { MacroRing } from '@/components/ui/MacroRing'
import { WelcomeHero } from '@/components/features/WelcomeHero'
import { StreakCard } from '@/components/features/StreakCard'
import { CalorieSparkline } from '@/components/features/CalorieSparkline'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { MACRO_COLORS, MEAL_LABELS, type MealType } from '@/lib/constants'
import { useDailyLog } from '@/hooks/useFoodLog'
import { getEffectiveMacros } from '@/types/food'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const profile = useAuthStore((s) => s.profile)
  const selectedDate = useUIStore((s) => s.selectedDate)
  const { data: logEntries = [], isLoading } = useDailyLog(selectedDate)

  const totals = useMemo(() => {
    return logEntries.reduce(
      (acc, entry) => {
        const macros = getEffectiveMacros(entry)
        return {
          calories: acc.calories + macros.calories,
          protein: acc.protein + macros.protein,
          carbs: acc.carbs + macros.carbs,
          fat: acc.fat + macros.fat,
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [logEntries])

  const mealGroups = useMemo(() => {
    const groups: Record<MealType, typeof logEntries> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    for (const entry of logEntries) {
      groups[entry.meal_type as MealType]?.push(entry)
    }
    return groups
  }, [logEntries])

  const targets = {
    calories: profile?.calorie_target ?? 2200,
    protein: profile?.protein_target_g ?? 140,
    carbs: profile?.carb_target_g ?? 250,
    fat: profile?.fat_target_g ?? 70,
  }

  const remaining = Math.max(0, targets.calories - totals.calories)

  // Mock streak data (will use real data from food_log once populated)
  const mockWeekData = [true, true, true, false, true, true, logEntries.length > 0]
  const mockStreakDays = mockWeekData.filter(Boolean).length
  const mockSparkline = Array.from({ length: 7 }, (_, i) => ({
    date: `2026-02-${19 + i}`,
    calories: Math.round(1800 + Math.random() * 600),
    target: targets.calories,
  }))
  if (mockSparkline.length > 0) {
    mockSparkline[mockSparkline.length - 1].calories = Math.round(totals.calories)
  }

  if (isLoading) {
    return (
      <AnimatedPage className="space-y-4">
        <div className="skeleton h-[100px] rounded-2xl" />
        <div className="skeleton h-[200px] rounded-2xl" />
        <div className="skeleton h-[80px] rounded-2xl" />
        <div className="skeleton h-[120px] rounded-2xl" />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="space-y-4 pb-4">
      {/* Welcome Hero */}
      <WelcomeHero />

      {/* Calorie Ring */}
      <GlassCard className="flex flex-col items-center py-6 relative overflow-hidden">
        {/* Decorative background ring */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <svg width="260" height="260" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="125" stroke="var(--color-accent)" strokeWidth="1" fill="none" strokeDasharray="8 4" />
          </svg>
        </div>

        <MacroRing
          current={totals.calories}
          target={targets.calories}
          color={MACRO_COLORS.calories}
          size={180}
          strokeWidth={12}
          unit=" kcal"
        />
        <motion.div
          className="mt-3 flex items-center gap-1.5 text-sm text-text-muted"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Flame size={14} className="text-calories" />
          <span>{Math.round(remaining)} kcal remaining</span>
        </motion.div>
      </GlassCard>

      {/* Macro Bars */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { key: 'protein', label: 'Protein', icon: Drumstick, color: MACRO_COLORS.protein, current: totals.protein, target: targets.protein },
          { key: 'carbs', label: 'Carbs', icon: Wheat, color: MACRO_COLORS.carbs, current: totals.carbs, target: targets.carbs },
          { key: 'fat', label: 'Fat', icon: Droplets, color: MACRO_COLORS.fat, current: totals.fat, target: targets.fat },
        ] as const).map((macro, i) => (
          <motion.div
            key={macro.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <GlassCard className="flex flex-col items-center py-3 px-2" animate={false}>
              <MacroRing
                current={macro.current}
                target={macro.target}
                color={macro.color}
                size={72}
                strokeWidth={5}
                label={macro.label}
                unit="g"
              />
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Streak */}
      <StreakCard
        daysLogged={mockStreakDays + 12}
        currentStreak={mockStreakDays}
        weekData={mockWeekData}
      />

      {/* Sparkline */}
      <CalorieSparkline data={mockSparkline} />

      {/* Meal Sections */}
      <div className="space-y-2">
        {(Object.entries(mealGroups) as [MealType, typeof logEntries][]).map(
          ([mealType, entries]) => {
            if (entries.length === 0) return null
            const mealCals = entries.reduce((sum, e) => sum + getEffectiveMacros(e).calories, 0)

            return (
              <GlassCard key={mealType} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    {MEAL_LABELS[mealType]}
                  </span>
                  <span className="text-xs text-text-muted tabular-nums">
                    {Math.round(mealCals)} kcal
                  </span>
                </div>
                <div className="space-y-1.5">
                  {entries.map((entry) => {
                    const macros = getEffectiveMacros(entry)
                    return (
                      <motion.div
                        key={entry.id}
                        className="flex items-center justify-between py-1 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-text-primary">
                            {entry.food_items?.name ?? entry.quick_description ?? 'Unknown'}
                          </div>
                          <div className="text-xs text-text-muted">
                            {entry.servings !== 1 ? `${entry.servings}x · ` : ''}
                            {Math.round(macros.calories)} kcal
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-text-muted tabular-nums ml-2">
                          <span className={cn('text-protein')}>P{Math.round(macros.protein)}</span>
                          <span className={cn('text-carbs')}>C{Math.round(macros.carbs)}</span>
                          <span className={cn('text-fat')}>F{Math.round(macros.fat)}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </GlassCard>
            )
          },
        )}

        {logEntries.length === 0 && (
          <GlassCard className="py-8 text-center relative overflow-hidden">
            <motion.div
              className="flex justify-center mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <motion.circle
                  cx="32" cy="32" r="28"
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  opacity="0.3"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <motion.text
                  x="32" y="36"
                  textAnchor="middle"
                  fontSize="20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  🍽️
                </motion.text>
              </svg>
            </motion.div>
            <p className="text-text-muted text-sm">No food logged yet today.</p>
            <p className="text-text-muted text-xs mt-1">Tap the + button to get started!</p>
          </GlassCard>
        )}
      </div>
    </AnimatedPage>
  )
}
