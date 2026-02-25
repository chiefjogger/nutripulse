import type { ExpenditureResult } from '@/types/algorithm'
import type { DailySummary } from '@/types/food'

/**
 * Adaptive expenditure estimation
 *
 * Simplified MacroFactor-inspired algorithm:
 * 1. Average daily calorie intake over window (7-14 days)
 * 2. Smoothed weight change
 * 3. Convert weight change to calories: 1 kg ~ 7,700 kcal
 * 4. Estimated expenditure = avg_intake - (weight_delta_kcal / days)
 * 5. Blend with previous estimate for stability (70/30)
 */
export function calculateAdaptiveExpenditure(
  dailySummaries: DailySummary[],
  weightEntries: { date: string; weight_kg: number }[],
  previousTDEE: number | null,
): ExpenditureResult {
  const days = dailySummaries.length

  // Need at least 3 days of data
  if (days < 3) {
    return {
      tdee: previousTDEE ?? 2000,
      confidence: 'low',
      method: previousTDEE ? 'adaptive' : 'initial',
    }
  }

  // Average daily calories
  const avgDailyCalories =
    dailySummaries.reduce((sum, d) => sum + d.total_calories, 0) / days

  // Calculate weight delta
  if (weightEntries.length < 2) {
    return {
      tdee: Math.round(avgDailyCalories),
      confidence: 'low',
      method: 'adaptive',
      avg_daily_calories: avgDailyCalories,
    }
  }

  // Sort by date ascending
  const sorted = [...weightEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  const firstWeight = sorted[0].weight_kg
  const lastWeight = sorted[sorted.length - 1].weight_kg
  const weightDelta = lastWeight - firstWeight // kg change over period

  // Convert to calories: 1 kg body weight ~ 7,700 kcal
  const weightDeltaKcal = weightDelta * 7700

  // Estimate expenditure
  const rawExpenditure = avgDailyCalories - weightDeltaKcal / days

  // Blend with previous for stability
  let finalTDEE: number
  if (previousTDEE) {
    finalTDEE = Math.round(0.7 * rawExpenditure + 0.3 * previousTDEE)
  } else {
    finalTDEE = Math.round(rawExpenditure)
  }

  // Clamp to reasonable range
  finalTDEE = Math.max(1200, Math.min(5000, finalTDEE))

  return {
    tdee: finalTDEE,
    confidence: days >= 14 ? 'high' : days >= 7 ? 'medium' : 'low',
    method: 'adaptive',
    avg_daily_calories: avgDailyCalories,
    weight_delta: weightDelta,
  }
}
