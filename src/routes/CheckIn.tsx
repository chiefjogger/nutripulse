import { useState } from 'react'
import { toast } from 'sonner'
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useQuery } from '@tanstack/react-query'

export default function CheckIn() {
  const { user, setProfile } = useAuthStore()
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch recent check-ins for history
  const { data: recentCheckins = [], refetch } = useQuery({
    queryKey: ['check-ins', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user!.id)
        .order('checked_in_at', { ascending: false })
        .limit(10)
      return data ?? []
    },
    enabled: !!user,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !weight) return

    setSaving(true)
    const weightKg = parseFloat(weight)

    // Insert check-in
    const { error } = await supabase.from('check_ins').insert({
      user_id: user.id,
      weight_kg: weightKg,
      body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
      notes: notes || null,
    })

    if (error) {
      setSaving(false)
      toast.error('Failed to save check-in')
      return
    }

    // Update profile with new weight
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .update({ current_weight_kg: weightKg })
      .eq('id', user.id)
      .select()
      .single()

    if (updatedProfile) {
      setProfile(updatedProfile)
    }

    setSaving(false)
    refetch()
    toast.success('Check-in saved!')
    setWeight('')
    setBodyFat('')
    setNotes('')
  }

  return (
    <AnimatedPage className="space-y-4 pb-4">
      <h2 className="text-lg font-semibold text-text-primary">Weekly Check-In</h2>

      <form onSubmit={handleSubmit}>
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Scale size={18} />
            <span className="text-sm font-medium">Log your weight</span>
          </div>

          <Input
            label="Weight"
            placeholder="70.0"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            suffix="kg"
            required
          />

          <Input
            label="Body Fat % (optional)"
            placeholder="15"
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            suffix="%"
          />

          <Input
            label="Notes (optional)"
            placeholder="How are you feeling?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" isLoading={saving} className="w-full" size="lg">
            Save Check-In
          </Button>
        </GlassCard>
      </form>

      <GlassCard>
        <p className="text-xs text-text-muted text-center">
          Check in weekly for the best TDEE accuracy. Your calorie targets adapt automatically based on your weight trend and food intake.
        </p>
      </GlassCard>

      {/* Check-in History */}
      {recentCheckins.length > 0 && (
        <GlassCard className="space-y-3">
          <span className="text-sm font-medium text-text-secondary">Recent Check-ins</span>
          <div className="space-y-2">
            {recentCheckins.map((ci: { id: string; checked_in_at: string; weight_kg: number; body_fat_pct?: number | null; notes?: string | null }, i: number) => {
              const prev = recentCheckins[i + 1] as { weight_kg: number } | undefined
              const delta = prev ? ci.weight_kg - prev.weight_kg : 0
              return (
                <div key={ci.id} className="flex items-center justify-between py-1.5 border-b border-glass-border last:border-0">
                  <div>
                    <div className="text-sm text-text-primary font-medium tabular-nums">
                      {ci.weight_kg} kg
                      {ci.body_fat_pct && <span className="text-text-muted text-xs ml-1">({ci.body_fat_pct}% BF)</span>}
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(ci.checked_in_at).toLocaleDateString()}
                    </div>
                  </div>
                  {prev && (
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${delta > 0 ? 'text-danger' : delta < 0 ? 'text-success' : 'text-text-muted'}`}>
                      {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                      <span>{delta > 0 ? '+' : ''}{delta.toFixed(1)} kg</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}
    </AnimatedPage>
  )
}
