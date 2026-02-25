import type { MacroTargets } from '@/types/algorithm'
import type { GoalType } from '@/lib/constants'

/**
 * Calculate macro targets from TDEE + goal
 *
 * Protein: 2.0g per kg body weight
 * Fat: 27% of total calories
 * Carbs: remainder
 */
export function calculateMacroTargets(
  tdee: number,
  goalType: GoalType,
  goalRateKgPerWeek: number,
  weightKg: number,
): MacroTargets {
  // Calorie adjustment: goalRate * 7700 / 7 = daily surplus/deficit
  const dailyAdjustment =
    goalType === 'maintain' ? 0 : (goalRateKgPerWeek * 7700) / 7
  const targetCalories = Math.round(tdee + dailyAdjustment)

  // Protein: 2.0g per kg
  const protein_g = Math.round(weightKg * 2.0)
  const proteinCals = protein_g * 4

  // Fat: 27% of total calories
  const fatCals = targetCalories * 0.27
  const fat_g = Math.round(fatCals / 9)

  // Carbs: remainder
  const carbCals = targetCalories - proteinCals - fat_g * 9
  const carbs_g = Math.max(0, Math.round(carbCals / 4))

  return {
    calories: Math.max(1200, targetCalories),
    protein_g,
    carbs_g,
    fat_g,
  }
}
