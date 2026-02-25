import type { ActivityLevel, GoalType } from '@/lib/constants'

export interface Profile {
  id: string
  display_name: string
  avatar_url?: string | null
  height_cm?: number | null
  current_weight_kg?: number | null
  goal_weight_kg?: number | null
  body_fat_pct?: number | null
  activity_level: ActivityLevel
  goal_type: GoalType
  goal_rate: number
  calorie_target?: number | null
  protein_target_g?: number | null
  carb_target_g?: number | null
  fat_target_g?: number | null
  custom_tdee?: number | null
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  checked_in_at: string
  weight_kg: number
  body_fat_pct?: number | null
  estimated_tdee?: number | null
  avg_daily_calories_7d?: number | null
  weight_trend_kg?: number | null
  expenditure_estimate?: number | null
  notes?: string | null
  created_at: string
}

export interface MacroTargets {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface ExpenditureResult {
  tdee: number
  confidence: 'high' | 'medium' | 'low'
  method: 'initial' | 'adaptive'
  avg_daily_calories?: number
  weight_delta?: number
}
