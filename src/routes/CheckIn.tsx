import { useState } from 'react'
import { toast } from 'sonner'
import { Scale } from 'lucide-react'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export default function CheckIn() {
  const user = useAuthStore((s) => s.user)
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !weight) return

    setSaving(true)
    const { error } = await supabase.from('check_ins').insert({
      user_id: user.id,
      weight_kg: parseFloat(weight),
      body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
      notes: notes || null,
    })
    setSaving(false)

    if (error) {
      toast.error('Failed to save check-in')
      return
    }

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
    </AnimatedPage>
  )
}
