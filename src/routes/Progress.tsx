import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { TrendingUp, Camera } from 'lucide-react'

export default function Progress() {
  return (
    <AnimatedPage className="space-y-4 pb-4">
      <h2 className="text-lg font-semibold text-text-primary">Progress</h2>

      {/* Weight Trend */}
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <TrendingUp size={18} />
          <span className="text-sm font-medium">Weight Trend</span>
        </div>
        <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
          Weight chart will appear here after your first few check-ins.
        </div>
      </GlassCard>

      {/* Progress Photos */}
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-secondary">
            <Camera size={18} />
            <span className="text-sm font-medium">Photos</span>
          </div>
          <button className="text-xs text-accent hover:text-accent-light transition-colors">
            Add Photo
          </button>
        </div>
        <div className="h-[120px] flex items-center justify-center text-text-muted text-sm">
          No progress photos yet.
        </div>
      </GlassCard>
    </AnimatedPage>
  )
}
