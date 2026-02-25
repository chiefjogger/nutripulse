import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { useUIStore } from '@/stores/uiStore'
import { useDailyLog, useDeleteFoodLog } from '@/hooks/useFoodLog'
import { getEffectiveMacros } from '@/types/food'
import { MEAL_TYPES, MEAL_LABELS, type MealType } from '@/lib/constants'

export default function FoodLog() {
  const selectedDate = useUIStore((s) => s.selectedDate)
  const { data: logEntries = [], isLoading } = useDailyLog(selectedDate)
  const deleteMutation = useDeleteFoodLog()

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

  if (isLoading) {
    return (
      <AnimatedPage className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[100px] rounded-2xl" />
        ))}
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="space-y-3 pb-4">
      <h2 className="text-lg font-semibold text-text-primary">Food Log</h2>

      {MEAL_TYPES.map((mealType) => {
        const entries = mealGroups[mealType]
        const mealCals = entries.reduce(
          (sum, e) => sum + getEffectiveMacros(e).calories,
          0,
        )

        return (
          <GlassCard key={mealType} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                {MEAL_LABELS[mealType]}
              </h3>
              <span className="text-xs tabular-nums text-text-muted">
                {entries.length > 0 ? `${Math.round(mealCals)} kcal` : ''}
              </span>
            </div>

            {entries.length === 0 ? (
              <p className="text-xs text-text-muted py-2">No items logged</p>
            ) : (
              <div className="space-y-1">
                {entries.map((entry) => {
                  const macros = getEffectiveMacros(entry)
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      className="flex items-center justify-between py-2 border-b border-glass-border-light last:border-0"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="text-sm text-text-primary truncate">
                          {entry.food_items?.name ?? entry.quick_description ?? 'Custom'}
                        </div>
                        <div className="text-xs text-text-muted">
                          {entry.servings}x · {Math.round(macros.calories)} kcal · P{Math.round(macros.protein)} C{Math.round(macros.carbs)} F{Math.round(macros.fat)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate({ id: entry.id, logged_at: entry.logged_at })}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        )
      })}
    </AnimatedPage>
  )
}
