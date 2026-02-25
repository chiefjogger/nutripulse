import { useState } from 'react'
import { Drawer } from 'vaul'
import { Search, Star, Clock, Sparkles, Plus, Minus, PenLine, Loader2, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useAddFoodLog } from '@/hooks/useFoodLog'
import { useFoodSearch } from '@/hooks/useFoodSearch'
import { supabase } from '@/lib/supabase'
import { MEAL_TYPES, MEAL_LABELS, type MealType, MACRO_COLORS } from '@/lib/constants'
import type { FoodItem } from '@/types/food'

type View = 'list' | 'detail' | 'manual' | 'ai'

const TABS = ['recent', 'favorites', 'search'] as const
type Tab = (typeof TABS)[number]

interface AIResult {
  name: string
  serving_size: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

export function QuickAdd() {
  const { quickAddOpen, closeQuickAdd, selectedDate, selectedMeal } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const addFoodLog = useAddFoodLog()

  const [view, setView] = useState<View>('list')
  const [tab, setTab] = useState<Tab>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [servings, setServings] = useState(1)
  const [mealType, setMealType] = useState<MealType>(selectedMeal)

  // Manual entry fields
  const [manualName, setManualName] = useState('')
  const [manualCal, setManualCal] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')

  // AI estimate
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiError, setAiError] = useState('')

  // Food search
  const { data: searchResults = [], isLoading: searchLoading } = useFoodSearch(
    tab === 'search' ? searchQuery : '',
  )

  function handleClose() {
    closeQuickAdd()
    setSelectedFood(null)
    setServings(1)
    setSearchQuery('')
    setView('list')
    setManualName('')
    setManualCal('')
    setManualProtein('')
    setManualCarbs('')
    setManualFat('')
    setAiQuery('')
    setAiResult(null)
    setAiError('')
  }

  function handleSelectFood(food: FoodItem) {
    setSelectedFood(food)
    setServings(1)
    setView('detail')
  }

  function handleAddWithServings() {
    if (!user || !selectedFood) return
    addFoodLog.mutate({
      user_id: user.id,
      food_item_id: selectedFood.id,
      logged_at: selectedDate,
      meal_type: mealType,
      servings,
      serving_size: selectedFood.serving_size,
      serving_unit: selectedFood.serving_unit,
      calories: selectedFood.calories_per_serving * servings,
      protein_g: selectedFood.protein_g * servings,
      carbs_g: selectedFood.carbs_g * servings,
      fat_g: selectedFood.fat_g * servings,
    })
    toast.success(`${selectedFood.name} added`)
    handleClose()
  }

  function handleManualAdd() {
    if (!user || !manualName.trim()) return
    const cal = parseFloat(manualCal) || 0
    const pro = parseFloat(manualProtein) || 0
    const carb = parseFloat(manualCarbs) || 0
    const fat = parseFloat(manualFat) || 0

    addFoodLog.mutate({
      user_id: user.id,
      logged_at: selectedDate,
      meal_type: mealType,
      servings: 1,
      calories: cal,
      protein_g: pro,
      carbs_g: carb,
      fat_g: fat,
      quick_description: manualName.trim(),
    })
    toast.success(`${manualName.trim()} added`)
    handleClose()
  }

  async function handleAIEstimate() {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('ai-estimate', {
        body: { description: aiQuery.trim() },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setAiResult(data as AIResult)
    } catch (err) {
      setAiError((err as Error).message || 'AI estimation failed')
    } finally {
      setAiLoading(false)
    }
  }

  function handleAcceptAI() {
    if (!user || !aiResult) return
    addFoodLog.mutate({
      user_id: user.id,
      logged_at: selectedDate,
      meal_type: mealType,
      servings: 1,
      calories: aiResult.calories,
      protein_g: aiResult.protein_g,
      carbs_g: aiResult.carbs_g,
      fat_g: aiResult.fat_g,
      quick_description: aiResult.name,
    })
    toast.success(`${aiResult.name} added`)
    handleClose()
  }

  const confidenceColor = {
    high: 'text-success',
    medium: 'text-warning',
    low: 'text-danger',
  }

  return (
    <Drawer.Root open={quickAddOpen} onOpenChange={(open) => !open && handleClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl bg-bg-card border-t border-glass-border max-h-[85dvh]">
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="h-1 w-10 rounded-full bg-text-muted/30" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-safe">
            <AnimatePresence mode="wait">
              {/* === MANUAL ENTRY VIEW === */}
              {view === 'manual' && (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 pb-4"
                >
                  <button onClick={() => setView('list')} className="text-sm text-accent">
                    &larr; Back
                  </button>

                  <h3 className="text-lg font-semibold text-text-primary">Manual Entry</h3>

                  <Input
                    label="Food name"
                    placeholder="e.g. Pho bo, Com tam..."
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    autoFocus
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Calories" placeholder="480" type="number" value={manualCal} onChange={(e) => setManualCal(e.target.value)} suffix="kcal" />
                    <Input label="Protein" placeholder="25" type="number" value={manualProtein} onChange={(e) => setManualProtein(e.target.value)} suffix="g" />
                    <Input label="Carbs" placeholder="60" type="number" value={manualCarbs} onChange={(e) => setManualCarbs(e.target.value)} suffix="g" />
                    <Input label="Fat" placeholder="15" type="number" value={manualFat} onChange={(e) => setManualFat(e.target.value)} suffix="g" />
                  </div>

                  {/* Meal selector */}
                  <div className="flex gap-1.5">
                    {MEAL_TYPES.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMealType(m)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                          mealType === m
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'bg-bg-elevated text-text-muted border border-transparent hover:bg-bg-hover',
                        )}
                      >
                        {MEAL_LABELS[m]}
                      </button>
                    ))}
                  </div>

                  <Button onClick={handleManualAdd} isLoading={addFoodLog.isPending} disabled={!manualName.trim()} className="w-full" size="lg">
                    Add to Log
                  </Button>
                </motion.div>
              )}

              {/* === AI ESTIMATE VIEW === */}
              {view === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 pb-4"
                >
                  <button onClick={() => { setView('list'); setAiResult(null); setAiError('') }} className="text-sm text-accent">
                    &larr; Back
                  </button>

                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-accent" />
                    <h3 className="text-lg font-semibold text-text-primary">AI Estimate</h3>
                  </div>

                  <p className="text-xs text-text-muted">
                    Describe what you ate and AI will estimate the macros. Works great with Vietnamese foods!
                  </p>

                  <Input
                    label="What did you eat?"
                    placeholder="e.g. 1 bowl pho bo with extra beef, side of spring rolls"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    autoFocus
                  />

                  {!aiResult && (
                    <Button
                      onClick={handleAIEstimate}
                      isLoading={aiLoading}
                      disabled={!aiQuery.trim()}
                      className="w-full"
                      icon={<Sparkles size={16} />}
                    >
                      Estimate Macros
                    </Button>
                  )}

                  {aiError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger">
                      <AlertCircle size={16} />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {aiResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-text-primary">{aiResult.name}</h4>
                        <span className={cn('text-xs font-medium', confidenceColor[aiResult.confidence])}>
                          {aiResult.confidence} confidence
                        </span>
                      </div>

                      {aiResult.notes && (
                        <p className="text-xs text-text-muted italic">{aiResult.notes}</p>
                      )}

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'kcal', value: aiResult.calories, color: MACRO_COLORS.calories },
                          { label: 'pro', value: aiResult.protein_g, color: MACRO_COLORS.protein },
                          { label: 'carb', value: aiResult.carbs_g, color: MACRO_COLORS.carbs },
                          { label: 'fat', value: aiResult.fat_g, color: MACRO_COLORS.fat },
                        ].map((m) => (
                          <div key={m.label} className="text-center py-2 rounded-xl bg-bg-elevated">
                            <div className="text-lg font-bold tabular-nums" style={{ color: m.color }}>{Math.round(m.value)}</div>
                            <div className="text-[10px] text-text-muted uppercase">{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Meal selector */}
                      <div className="flex gap-1.5">
                        {MEAL_TYPES.map((m) => (
                          <button
                            key={m}
                            onClick={() => setMealType(m)}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                              mealType === m
                                ? 'bg-accent/15 text-accent border border-accent/30'
                                : 'bg-bg-elevated text-text-muted border border-transparent hover:bg-bg-hover',
                            )}
                          >
                            {MEAL_LABELS[m]}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => { setAiResult(null); setAiQuery('') }}
                          className="flex-1"
                        >
                          Try Again
                        </Button>
                        <Button
                          onClick={handleAcceptAI}
                          isLoading={addFoodLog.isPending}
                          icon={<Check size={16} />}
                          className="flex-1"
                        >
                          Accept & Add
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* === FOOD DETAIL VIEW === */}
              {view === 'detail' && selectedFood && (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 pb-4"
                >
                  <button onClick={() => { setSelectedFood(null); setView('list') }} className="text-sm text-accent">
                    &larr; Back
                  </button>

                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{selectedFood.name}</h3>
                    {selectedFood.brand && <p className="text-xs text-text-muted">{selectedFood.brand}</p>}
                  </div>

                  {/* Servings stepper */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated text-text-secondary hover:bg-bg-hover transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="text-2xl font-bold text-text-primary tabular-nums min-w-[60px] text-center">
                      {servings}
                    </span>
                    <button
                      onClick={() => setServings(servings + 0.5)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated text-text-secondary hover:bg-bg-hover transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-text-muted text-center">
                    {selectedFood.serving_size * servings}{selectedFood.serving_unit} per serving
                  </p>

                  {/* Macro summary */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'kcal', value: selectedFood.calories_per_serving * servings, color: MACRO_COLORS.calories },
                      { label: 'pro', value: selectedFood.protein_g * servings, color: MACRO_COLORS.protein },
                      { label: 'carb', value: selectedFood.carbs_g * servings, color: MACRO_COLORS.carbs },
                      { label: 'fat', value: selectedFood.fat_g * servings, color: MACRO_COLORS.fat },
                    ].map((m) => (
                      <div key={m.label} className="text-center py-2 rounded-xl bg-bg-elevated">
                        <div className="text-lg font-bold tabular-nums" style={{ color: m.color }}>{Math.round(m.value)}</div>
                        <div className="text-[10px] text-text-muted uppercase">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Meal selector */}
                  <div className="flex gap-1.5">
                    {MEAL_TYPES.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMealType(m)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                          mealType === m
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : 'bg-bg-elevated text-text-muted border border-transparent hover:bg-bg-hover',
                        )}
                      >
                        {MEAL_LABELS[m]}
                      </button>
                    ))}
                  </div>

                  <Button onClick={handleAddWithServings} isLoading={addFoodLog.isPending} className="w-full" size="lg">
                    Add to Log
                  </Button>
                </motion.div>
              )}

              {/* === LIST VIEW === */}
              {view === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 pb-4"
                >
                  {/* Search */}
                  <Input
                    placeholder="Search foods..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value) setTab('search')
                    }}
                    icon={<Search size={16} />}
                  />

                  {/* Tabs */}
                  <div className="flex gap-1 bg-bg-elevated rounded-xl p-1">
                    {TABS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 capitalize',
                          tab === t
                            ? 'bg-accent/15 text-accent'
                            : 'text-text-muted hover:text-text-secondary',
                        )}
                      >
                        {t === 'recent' && <Clock size={12} className="inline mr-1" />}
                        {t === 'favorites' && <Star size={12} className="inline mr-1" />}
                        {t === 'search' && <Search size={12} className="inline mr-1" />}
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Search Results */}
                  {tab === 'search' && (
                    <div className="space-y-1.5">
                      {searchLoading && searchQuery.length >= 2 && (
                        <div className="py-6 flex justify-center">
                          <Loader2 size={20} className="animate-spin text-accent" />
                        </div>
                      )}

                      {!searchLoading && searchResults.length > 0 && (
                        searchResults.map((food, i) => (
                          <motion.button
                            key={food.id ?? `${food.name}-${i}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => handleSelectFood(food)}
                            className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-bg-elevated hover:bg-bg-hover transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-text-primary truncate">{food.name}</div>
                              <div className="text-xs text-text-muted">
                                {food.brand && <span>{food.brand} · </span>}
                                {Math.round(food.calories_per_serving)} kcal · {food.serving_size}{food.serving_unit}
                                {food.source && (
                                  <span className="ml-1 px-1 py-0.5 rounded text-[9px] bg-accent/10 text-accent uppercase">{food.source}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1.5 text-[10px] text-text-muted tabular-nums ml-2">
                              <span className="text-protein">P{Math.round(food.protein_g)}</span>
                              <span className="text-carbs">C{Math.round(food.carbs_g)}</span>
                              <span className="text-fat">F{Math.round(food.fat_g)}</span>
                            </div>
                          </motion.button>
                        ))
                      )}

                      {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="py-6 text-center">
                          <p className="text-text-muted text-sm">No results for &ldquo;{searchQuery}&rdquo;</p>
                          <p className="text-text-muted text-xs mt-1">Try manual entry or AI estimate below</p>
                        </div>
                      )}

                      {searchQuery.length < 2 && (
                        <div className="py-6 text-center">
                          <p className="text-text-muted text-sm">Type at least 2 characters to search</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent/Favorites empty states */}
                  {tab === 'recent' && (
                    <div className="py-6 text-center">
                      <p className="text-text-muted text-sm">Your recent foods will appear here as you log meals.</p>
                    </div>
                  )}
                  {tab === 'favorites' && (
                    <div className="py-6 text-center">
                      <p className="text-text-muted text-sm">Star foods to add them to your favorites.</p>
                    </div>
                  )}

                  {/* Manual entry button */}
                  <button
                    onClick={() => setView('manual')}
                    className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent hover:bg-accent/15 transition-colors"
                  >
                    <PenLine size={18} />
                    <div className="text-left">
                      <div className="font-medium">Manual Entry</div>
                      <div className="text-xs text-accent/70">Type food name and macros directly</div>
                    </div>
                  </button>

                  {/* AI Estimate */}
                  <button
                    onClick={() => setView('ai')}
                    className="w-full flex items-center gap-3 py-3.5 px-4 rounded-xl bg-bg-elevated border border-glass-border-light text-sm text-text-secondary hover:bg-bg-hover transition-colors"
                  >
                    <Sparkles size={18} />
                    <div className="text-left">
                      <div className="font-medium">AI Estimate</div>
                      <div className="text-xs text-text-muted">Describe your food, AI fills the macros</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
