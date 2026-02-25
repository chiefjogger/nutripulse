import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import type { MealType } from '@/lib/constants'

type Theme = 'dark' | 'light'

interface UIState {
  quickAddOpen: boolean
  commandPaletteOpen: boolean
  selectedMeal: MealType
  selectedDate: string
  theme: Theme
  openQuickAdd: () => void
  closeQuickAdd: () => void
  setMeal: (meal: MealType) => void
  setDate: (date: string) => void
  goToPreviousDay: () => void
  goToNextDay: () => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      quickAddOpen: false,
      commandPaletteOpen: false,
      selectedMeal: 'lunch',
      selectedDate: dayjs().format('YYYY-MM-DD'),
      theme: 'dark' as Theme,
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
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.classList.toggle('light', next === 'light')
        set({ theme: next })
      },
      setTheme: (theme) => {
        document.documentElement.classList.toggle('light', theme === 'light')
        set({ theme })
      },
    }),
    {
      name: 'nutripulse-ui',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)
