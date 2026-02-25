import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { FAB } from '@/components/ui/FAB'
import { QuickAdd } from '@/components/features/QuickAdd'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-primary">
      <TopBar />
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-2">
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
      <QuickAdd />
    </div>
  )
}
