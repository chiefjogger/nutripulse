import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GlassCard } from '@/components/ui/GlassCard'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_LEVELS,
  ACTIVITY_LABELS,
  ACTIVITY_DESCRIPTIONS,
  ACTIVITY_MULTIPLIERS,
  GOAL_TYPES,
  GOAL_LABELS,
  type ActivityLevel,
  type GoalType,
} from '@/lib/constants'

const STEPS = ['welcome', 'body', 'goals', 'activity', 'review'] as const

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    display_name: '',
    height_cm: '',
    current_weight_kg: '',
    body_fat_pct: '',
    goal_type: 'maintain' as GoalType,
    goal_weight_kg: '',
    goal_rate: '0',
    activity_level: 'moderate' as ActivityLevel,
  })

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  function calculateTDEE() {
    const weight = parseFloat(form.current_weight_kg) || 70
    const height = parseFloat(form.height_cm) || 170
    const age = 25
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[form.activity_level])
  }

  function calculateTargets() {
    const tdee = calculateTDEE()
    const rate = parseFloat(form.goal_rate) || 0
    const adjustment = (rate * 7700) / 7
    const calories = Math.round(tdee + adjustment)
    const weight = parseFloat(form.current_weight_kg) || 70
    const protein_g = Math.round(weight * 2.0)
    const fat_g = Math.round((calories * 0.27) / 9)
    const carbs_g = Math.round((calories - protein_g * 4 - fat_g * 9) / 4)
    return { calories, protein_g, carbs_g, fat_g }
  }

  async function handleComplete() {
    if (!user) return
    setSaving(true)
    const targets = calculateTargets()
    const profileData = {
      display_name: form.display_name || 'User',
      height_cm: parseFloat(form.height_cm) || null,
      current_weight_kg: parseFloat(form.current_weight_kg) || null,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      goal_type: form.goal_type,
      goal_weight_kg: form.goal_weight_kg ? parseFloat(form.goal_weight_kg) : null,
      goal_rate: parseFloat(form.goal_rate) || 0,
      activity_level: form.activity_level,
      calorie_target: targets.calories,
      protein_target_g: targets.protein_g,
      carb_target_g: targets.carbs_g,
      fat_target_g: targets.fat_g,
      onboarded: true,
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single()

    setSaving(false)
    if (error) {
      toast.error('Failed to save profile')
      return
    }
    setProfile(data)
    toast.success('Profile set up!')
    navigate('/', { replace: true })
  }

  const canAdvance = () => {
    if (step === 1) return form.height_cm && form.current_weight_kg
    if (step === 0) return form.display_name.trim()
    return true
  }

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
  }

  const [direction, setDirection] = useState(1)

  const next = () => { setDirection(1); setStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  const prev = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)) }

  return (
    <div className="flex min-h-dvh flex-col bg-bg-primary px-6 py-8">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-8 bg-accent' : i < step ? 'w-1.5 bg-accent/50' : 'w-1.5 bg-bg-elevated',
            )}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold gradient-text">Welcome!</h2>
                  <p className="mt-2 text-sm text-text-secondary">What should we call you?</p>
                </div>
                <Input
                  placeholder="Your name"
                  value={form.display_name}
                  onChange={(e) => update('display_name', e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-text-primary">Body Stats</h2>
                  <p className="mt-1 text-sm text-text-secondary">For accurate calorie targets</p>
                </div>
                <div className="space-y-4">
                  <Input label="Height" placeholder="170" value={form.height_cm} onChange={(e) => update('height_cm', e.target.value)} type="number" suffix="cm" />
                  <Input label="Current Weight" placeholder="70" value={form.current_weight_kg} onChange={(e) => update('current_weight_kg', e.target.value)} type="number" suffix="kg" />
                  <Input label="Body Fat % (optional)" placeholder="15" value={form.body_fat_pct} onChange={(e) => update('body_fat_pct', e.target.value)} type="number" suffix="%" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-text-primary">Your Goal</h2>
                  <p className="mt-1 text-sm text-text-secondary">What are you working towards?</p>
                </div>
                <div className="space-y-2">
                  {GOAL_TYPES.map((g) => (
                    <button
                      key={g}
                      onClick={() => update('goal_type', g)}
                      className={cn(
                        'w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200',
                        form.goal_type === g
                          ? 'bg-accent/15 text-accent border border-accent/30 glow-accent'
                          : 'bg-bg-elevated text-text-secondary border border-transparent hover:bg-bg-hover',
                      )}
                    >
                      {GOAL_LABELS[g]}
                    </button>
                  ))}
                </div>
                {form.goal_type !== 'maintain' && (
                  <div className="space-y-4">
                    <Input label="Goal Weight" placeholder="65" value={form.goal_weight_kg} onChange={(e) => update('goal_weight_kg', e.target.value)} type="number" suffix="kg" />
                    <Input label={`Rate (kg/week, ${form.goal_type === 'lose' ? 'negative' : 'positive'})`} placeholder={form.goal_type === 'lose' ? '-0.5' : '0.3'} value={form.goal_rate} onChange={(e) => update('goal_rate', e.target.value)} type="number" suffix="kg/w" />
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-text-primary">Activity Level</h2>
                  <p className="mt-1 text-sm text-text-secondary">How active are you?</p>
                </div>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => update('activity_level', level)}
                      className={cn(
                        'w-full rounded-xl px-4 py-3 text-left transition-all duration-200',
                        form.activity_level === level
                          ? 'bg-accent/15 border border-accent/30 glow-accent'
                          : 'bg-bg-elevated border border-transparent hover:bg-bg-hover',
                      )}
                    >
                      <div className={cn('text-sm font-medium', form.activity_level === level ? 'text-accent' : 'text-text-primary')}>
                        {ACTIVITY_LABELS[level]}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {ACTIVITY_DESCRIPTIONS[level]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold gradient-text">You're all set!</h2>
                  <p className="mt-1 text-sm text-text-secondary">Here are your starting targets</p>
                </div>
                <GlassCard className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">TDEE</span>
                    <span className="font-semibold text-text-primary">{calculateTDEE()} kcal</span>
                  </div>
                  {(() => {
                    const t = calculateTargets()
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-calories">Calories</span>
                          <span className="font-semibold">{t.calories} kcal</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-protein">Protein</span>
                          <span className="font-semibold">{t.protein_g}g</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-carbs">Carbs</span>
                          <span className="font-semibold">{t.carbs_g}g</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-fat">Fat</span>
                          <span className="font-semibold">{t.fat_g}g</span>
                        </div>
                      </>
                    )
                  })()}
                </GlassCard>
                <p className="text-xs text-text-muted text-center">
                  These adapt automatically as you log food and check in weekly.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-8 max-w-sm mx-auto w-full">
        {step > 0 && (
          <Button variant="secondary" onClick={prev} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canAdvance()} className="min-w-[100px]">
            Next <ArrowRight size={16} />
          </Button>
        ) : (
          <Button onClick={handleComplete} isLoading={saving} icon={<Check size={16} />} className="min-w-[120px]">
            Let's go!
          </Button>
        )}
      </div>
    </div>
  )
}
