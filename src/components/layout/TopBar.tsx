import { ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'

export function TopBar() {
  const { selectedDate, goToPreviousDay, goToNextDay } = useUIStore()
  const profile = useAuthStore((s) => s.profile)

  const isToday = selectedDate === dayjs().format('YYYY-MM-DD')
  const displayDate = isToday
    ? 'Today'
    : dayjs(selectedDate).format('ddd, MMM D')

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-bg-primary/80 backdrop-blur-xl border-b border-glass-border-light pt-safe">
      <div className="flex items-center gap-2">
        <button
          onClick={goToPreviousDay}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-text-primary min-w-[100px] text-center">
          {displayDate}
        </span>
        <button
          onClick={goToNextDay}
          disabled={isToday}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
          {profile?.display_name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  )
}
