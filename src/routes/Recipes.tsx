import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookOpen } from 'lucide-react'

export default function Recipes() {
  return (
    <AnimatedPage className="space-y-4 pb-4">
      <h2 className="text-lg font-semibold text-text-primary">Recipes</h2>

      <GlassCard className="py-8 text-center space-y-2">
        <BookOpen size={32} className="mx-auto text-text-muted" />
        <p className="text-text-muted text-sm">No saved recipes yet.</p>
        <p className="text-text-muted text-xs">
          Save meals as recipes to quickly log them again later.
        </p>
      </GlassCard>
    </AnimatedPage>
  )
}
