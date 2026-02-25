import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Target, Activity, Sun, Moon, Zap, Save } from 'lucide-react'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { ACTIVITY_LABELS, ACTIVITY_LEVELS, ACTIVITY_DESCRIPTIONS, ACTIVITY_MULTIPLIERS, GOAL_LABELS, type ActivityLevel } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, setProfile, signOut: clearAuth } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [targets, setTargets] = useState({
    calorie_target: profile?.calorie_target?.toString() ?? '',
    protein_target_g: profile?.protein_target_g?.toString() ?? '',
    carb_target_g: profile?.carb_target_g?.toString() ?? '',
    fat_target_g: profile?.fat_target_g?.toString() ?? '',
    custom_tdee: profile?.custom_tdee?.toString() ?? '',
    activity_level: (profile?.activity_level ?? 'moderate') as ActivityLevel,
  })

  async function handleSignOut() {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/login', { replace: true })
    toast.success('Signed out')
  }

  async function saveTargets() {
    if (!user) return
    setSaving(true)
    const updateData: Record<string, unknown> = {
      calorie_target: parseFloat(targets.calorie_target) || null,
      protein_target_g: parseFloat(targets.protein_target_g) || null,
      carb_target_g: parseFloat(targets.carb_target_g) || null,
      fat_target_g: parseFloat(targets.fat_target_g) || null,
      activity_level: targets.activity_level,
    }
    if (targets.custom_tdee) {
      updateData.custom_tdee = parseFloat(targets.custom_tdee)
    } else {
      updateData.custom_tdee = null
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    setSaving(false)
    if (error) {
      toast.error('Failed to save')
      return
    }
    setProfile(data)
    setEditing(null)
    toast.success('Targets updated!')
  }

  function recalculateFromTDEE() {
    const tdee = parseFloat(targets.custom_tdee) || calculateAutoTDEE()
    const rate = profile?.goal_rate ?? 0
    const adjustment = (rate * 7700) / 7
    const calories = Math.round(tdee + adjustment)
    const weight = profile?.current_weight_kg ?? 70
    const protein = Math.round(weight * 2.0)
    const fat = Math.round((calories * 0.27) / 9)
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)
    setTargets(prev => ({
      ...prev,
      calorie_target: calories.toString(),
      protein_target_g: protein.toString(),
      carb_target_g: carbs.toString(),
      fat_target_g: fat.toString(),
    }))
  }

  function calculateAutoTDEE() {
    const weight = profile?.current_weight_kg ?? 70
    const height = profile?.height_cm ?? 170
    const age = 25
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[targets.activity_level])
  }

  return (
    <AnimatedPage className="space-y-4 pb-4">
      <h2 className="text-lg font-semibold text-text-primary">Settings</h2>

      {/* Theme Toggle */}
      <GlassCard className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theme === 'dark' ? <Moon size={18} className="text-accent" /> : <Sun size={18} className="text-warning" />}
          <div>
            <div className="text-sm font-medium text-text-primary">Appearance</div>
            <div className="text-xs text-text-muted">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</div>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={cn(
            'relative h-7 w-12 rounded-full transition-colors duration-300',
            theme === 'dark' ? 'bg-accent' : 'bg-bg-elevated border border-glass-border-light',
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300',
              theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
      </GlassCard>

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

      {/* Daily Expenditure (TDEE) */}
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-secondary">
            <Zap size={18} />
            <span className="text-sm font-medium">Daily Expenditure</span>
          </div>
          {editing !== 'tdee' && (
            <button onClick={() => setEditing('tdee')} className="text-xs text-accent font-medium">
              Edit
            </button>
          )}
        </div>

        {editing === 'tdee' ? (
          <div className="space-y-3">
            <Input
              label="Custom TDEE (leave empty for auto)"
              placeholder={calculateAutoTDEE().toString()}
              value={targets.custom_tdee}
              onChange={(e) => setTargets(prev => ({ ...prev, custom_tdee: e.target.value }))}
              type="number"
              suffix="kcal"
            />
            <p className="text-xs text-text-muted">
              Auto-calculated: {calculateAutoTDEE()} kcal
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary font-medium">Activity Level</label>
              {ACTIVITY_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setTargets(prev => ({ ...prev, activity_level: level }))}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left transition-all text-xs',
                    targets.activity_level === level
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'bg-bg-elevated text-text-secondary border border-transparent',
                  )}
                >
                  <div className="font-medium">{ACTIVITY_LABELS[level]}</div>
                  <div className="text-text-muted">{ACTIVITY_DESCRIPTIONS[level]}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(null)} className="flex-1">
                Cancel
              </Button>
              <Button size="sm" onClick={() => { recalculateFromTDEE(); setEditing('targets') }} className="flex-1">
                Recalculate Macros
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">TDEE</span>
              <span className="text-text-primary font-medium">
                {profile?.custom_tdee
                  ? `${profile.custom_tdee} kcal`
                  : `${calculateAutoTDEE()} kcal`}
                {profile?.custom_tdee && (
                  <span className="text-xs text-accent ml-1">(manual)</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Activity</span>
              <span className="text-text-primary">
                {profile?.activity_level ? ACTIVITY_LABELS[profile.activity_level as ActivityLevel] : '—'}
              </span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Macro Targets */}
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-secondary">
            <Target size={18} />
            <span className="text-sm font-medium">Daily Targets</span>
          </div>
          {editing !== 'targets' && (
            <button onClick={() => setEditing('targets')} className="text-xs text-accent font-medium">
              Edit
            </button>
          )}
        </div>

        {editing === 'targets' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Calories"
                value={targets.calorie_target}
                onChange={(e) => setTargets(prev => ({ ...prev, calorie_target: e.target.value }))}
                type="number"
                suffix="kcal"
              />
              <Input
                label="Protein"
                value={targets.protein_target_g}
                onChange={(e) => setTargets(prev => ({ ...prev, protein_target_g: e.target.value }))}
                type="number"
                suffix="g"
              />
              <Input
                label="Carbs"
                value={targets.carb_target_g}
                onChange={(e) => setTargets(prev => ({ ...prev, carb_target_g: e.target.value }))}
                type="number"
                suffix="g"
              />
              <Input
                label="Fat"
                value={targets.fat_target_g}
                onChange={(e) => setTargets(prev => ({ ...prev, fat_target_g: e.target.value }))}
                type="number"
                suffix="g"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(null)} className="flex-1">
                Cancel
              </Button>
              <Button size="sm" onClick={saveTargets} isLoading={saving} icon={<Save size={14} />} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Goal</span>
              <span className="text-text-primary">{profile?.goal_type ? GOAL_LABELS[profile.goal_type as keyof typeof GOAL_LABELS] : '—'}</span>
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
        )}
      </GlassCard>

      {/* Activity */}
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <Activity size={18} />
          <span className="text-sm font-medium">Activity Level</span>
        </div>
        <p className="text-sm text-text-primary">
          {profile?.activity_level ? ACTIVITY_LABELS[profile.activity_level as ActivityLevel] : '—'}
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
