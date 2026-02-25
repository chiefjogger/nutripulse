import { ACTIVITY_MULTIPLIERS, type ActivityLevel } from '@/lib/constants'

/**
 * Cunningham equation — requires body fat %
 * BMR = 500 + (22 * lean body mass in kg)
 */
export function cunninghamBMR(weightKg: number, bodyFatPct: number): number {
  const lbm = weightKg * (1 - bodyFatPct / 100)
  return 500 + 22 * lbm
}

/**
 * Mifflin-St Jeor — fallback without body fat %
 * Male:   10*weight + 6.25*height - 5*age + 5
 * Female: 10*weight + 6.25*height - 5*age - 161
 */
export function mifflinStJeorBMR(
  weightKg: number,
  heightCm: number,
  age: number = 25,
  isMale: boolean = true,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return isMale ? base + 5 : base - 161
}

/**
 * Calculate initial TDEE estimate based on profile
 */
export function calculateInitialTDEE(
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel,
  bodyFatPct?: number | null,
  age: number = 25,
  isMale: boolean = true,
): number {
  const bmr =
    bodyFatPct != null
      ? cunninghamBMR(weightKg, bodyFatPct)
      : mifflinStJeorBMR(weightKg, heightCm, age, isMale)

  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}
