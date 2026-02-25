import { useNavigate } from 'react-router-dom'
import { LogOut, User, Target, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { ACTIVITY_LABELS, GOAL_LABELS } from '@/lib/constants'

export default function Settings() {
  const navigate = useNavigate()
  const { profile, signOut: clearAuth } = useAuthStore()

  async function handleSignOut() {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/login', { replace: true })
    toast.success('Signed out')
  }

  return (
    <AnimatedPage className="space-y-4 pb-4">
      <h2 className="text-lg font-semibold text-text-primary">Settings</h2>

      {/* Profile */}
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <User size={18} />
          <span className="text-sm font-medium">Profile</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Name</span>
            <span className="text-text-primary">{profile?.display_name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Height</span>
            <span className="text-text-primary">{profile?.height_cm ? `${profile.height_cm} cm` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Weight</span>
            <span className="text-text-primary">{profile?.current_weight_kg ? `${profile.current_weight_kg} kg` : '—'}</span>
          </div>
        </div>
      </GlassCard>

      {/* Goals */}
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <Target size={18} />
          <span className="text-sm font-medium">Goals</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Goal</span>
            <span className="text-text-primary">{profile?.goal_type ? GOAL_LABELS[profile.goal_type] : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Calories</span>
            <span className="text-calories font-medium">{profile?.calorie_target ?? '—'} kcal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Protein</span>
            <span className="text-protein font-medium">{profile?.protein_target_g ?? '—'}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Carbs</span>
            <span className="text-carbs font-medium">{profile?.carb_target_g ?? '—'}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Fat</span>
            <span className="text-fat font-medium">{profile?.fat_target_g ?? '—'}g</span>
          </div>
        </div>
      </GlassCard>

      {/* Activity */}
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <Activity size={18} />
          <span className="text-sm font-medium">Activity Level</span>
        </div>
        <p className="text-sm text-text-primary">
          {profile?.activity_level ? ACTIVITY_LABELS[profile.activity_level] : '—'}
        </p>
      </GlassCard>

      {/* Sign out */}
      <Button
        variant="danger"
        onClick={handleSignOut}
        icon={<LogOut size={16} />}
        className="w-full"
      >
        Sign Out
      </Button>
    </AnimatedPage>
  )
}
