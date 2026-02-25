import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Drumstick, Wheat, Droplets } from 'lucide-react'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { MacroRing } from '@/components/ui/MacroRing'
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

  if (isLoading) {
    return (
      <AnimatedPage className="space-y-4">
        <div className="skeleton h-[200px] rounded-2xl" />
        <div className="skeleton h-[80px] rounded-2xl" />
        <div className="skeleton h-[120px] rounded-2xl" />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="space-y-4 pb-4">
      {/* Calorie Ring */}
      <GlassCard className="flex flex-col items-center py-6">
        <MacroRing
          current={totals.calories}
          target={targets.calories}
          color={MACRO_COLORS.calories}
          size={180}
          strokeWidth={12}
          unit=" kcal"
        />
        <div className="mt-3 flex items-center gap-1.5 text-sm text-text-muted">
          <Flame size={14} className="text-calories" />
          <span>{Math.round(remaining)} kcal remaining</span>
        </div>
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
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-1 text-sm"
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
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            )
          },
        )}

        {logEntries.length === 0 && (
          <GlassCard className="py-8 text-center">
            <p className="text-text-muted text-sm">No food logged yet today.</p>
            <p className="text-text-muted text-xs mt-1">Tap the + button to get started!</p>
          </GlassCard>
        )}
      </div>
    </AnimatedPage>
  )
}
