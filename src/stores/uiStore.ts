import { create } from 'zustand'
import dayjs from 'dayjs'
import type { MealType } from '@/lib/constants'

interface UIState {
  quickAddOpen: boolean
  commandPaletteOpen: boolean
  selectedMeal: MealType
  selectedDate: string
  openQuickAdd: () => void
  closeQuickAdd: () => void
  setMeal: (meal: MealType) => void
  setDate: (date: string) => void
  goToPreviousDay: () => void
  goToNextDay: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  quickAddOpen: false,
  commandPaletteOpen: false,
  selectedMeal: 'lunch',
  selectedDate: dayjs().format('YYYY-MM-DD'),
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  setMeal: (selectedMeal) => set({ selectedMeal }),
  setDate: (selectedDate) => set({ selectedDate }),
  goToPreviousDay: () =>
    set({ selectedDate: dayjs(get().selectedDate).subtract(1, 'day').format('YYYY-MM-DD') }),
  goToNextDay: () => {
    const next = dayjs(get().selectedDate).add(1, 'day')
    if (next.isAfter(dayjs(), 'day')) return
    set({ selectedDate: next.format('YYYY-MM-DD') })
  },
}))
