import { create } from 'zustand'
import type { FoodItem } from '@/types/food'
import type { MealType } from '@/lib/constants'

interface DraftEntry {
  foodItem: FoodItem | null
  servings: number
  mealType: MealType
  overrideCalories?: number | null
  overrideProtein?: number | null
  overrideCarbs?: number | null
  overrideFat?: number | null
  quickDescription?: string | null
}

interface DraftState {
  draft: DraftEntry | null
  setDraft: (draft: DraftEntry) => void
  updateDraft: (partial: Partial<DraftEntry>) => void
  clearDraft: () => void
}

export const useDraftStore = create<DraftState>((set, get) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  updateDraft: (partial) => {
    const current = get().draft
    if (current) {
      set({ draft: { ...current, ...partial } })
    }
  },
  clearDraft: () => set({ draft: null }),
}))
