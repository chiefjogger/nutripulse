import type { MealType } from '@/lib/constants'

export interface FoodItem {
  id: string
  fdc_id?: number | null
  off_barcode?: string | null
  name: string
  brand?: string | null
  serving_size: number
  serving_unit: string
  calories_per_serving: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number | null
  source: 'usda' | 'off' | 'custom' | 'ai'
  created_by?: string | null
  created_at: string
}

export interface FoodLogEntry {
  id: string
  user_id: string
  food_item_id?: string | null
  logged_at: string
  meal_type: MealType
  servings: number
  serving_size?: number | null
  serving_unit?: string | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  override_calories?: number | null
  override_protein_g?: number | null
  override_carbs_g?: number | null
  override_fat_g?: number | null
  quick_description?: string | null
  notes?: string | null
  created_at: string
  food_items?: FoodItem | null
}

export interface NewFoodLogEntry {
  user_id: string
  food_item_id?: string | null
  logged_at: string
  meal_type: MealType
  servings: number
  serving_size?: number | null
  serving_unit?: string | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  override_calories?: number | null
  override_protein_g?: number | null
  override_carbs_g?: number | null
  override_fat_g?: number | null
  quick_description?: string | null
  notes?: string | null
}

export interface FoodUsage {
  id: string
  user_id: string
  food_item_id: string
  use_count: number
  last_used_at: string
  last_serving_size?: number | null
  last_serving_unit?: string | null
  food_items?: FoodItem
}

export interface AIEstimateResult {
  name: string
  serving_size: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

export interface DailySummary {
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  entry_count: number
}

export function getEffectiveMacros(entry: FoodLogEntry) {
  return {
    calories: entry.override_calories ?? entry.calories,
    protein: entry.override_protein_g ?? entry.protein_g,
    carbs: entry.override_carbs_g ?? entry.carbs_g,
    fat: entry.override_fat_g ?? entry.fat_g,
  }
}
