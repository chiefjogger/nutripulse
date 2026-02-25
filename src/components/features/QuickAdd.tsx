import { useState } from 'react'
import { Drawer } from 'vaul'
import { Search, Star, Clock, Sparkles, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useAddFoodLog } from '@/hooks/useFoodLog'
import { MEAL_TYPES, MEAL_LABELS, type MealType, MACRO_COLORS } from '@/lib/constants'
import type { FoodItem } from '@/types/food'

const TABS = ['recent', 'favorites', 'search'] as const
type Tab = (typeof TABS)[number]

export function QuickAdd() {
  const { quickAddOpen, closeQuickAdd, selectedDate, selectedMeal } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const addFoodLog = useAddFoodLog()

  const [tab, setTab] = useState<Tab>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [servings, setServings] = useState(1)
  const [mealType, setMealType] = useState<MealType>(selectedMeal)

  function handleClose() {
    closeQuickAdd()
    setSelectedFood(null)
    setServings(1)
    setSearchQuery('')
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
    handleClose()
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
              {selectedFood ? (
                /* Food detail view */
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 pb-4"
                >
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="text-sm text-accent"
                  >
                    &larr; Back
                  </button>

                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {selectedFood.name}
                    </h3>
                    {selectedFood.brand && (
                      <p className="text-xs text-text-muted">{selectedFood.brand}</p>
                    )}
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
                        <div className="text-lg font-bold tabular-nums" style={{ color: m.color }}>
                          {Math.round(m.value)}
                        </div>
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

                  <Button
                    onClick={handleAddWithServings}
                    isLoading={addFoodLog.isPending}
                    className="w-full"
                    size="lg"
                  >
                    Add to Log
                  </Button>
                </motion.div>
              ) : (
                /* Main list view */
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

                  {/* Content */}
                  <div className="space-y-1.5">
                    <div className="py-8 text-center">
                      <p className="text-text-muted text-sm">
                        {tab === 'recent' && 'Your recent foods will appear here as you log meals.'}
                        {tab === 'favorites' && 'Star foods to add them to your favorites.'}
                        {tab === 'search' && (searchQuery.length < 2 ? 'Type at least 2 characters to search.' : 'Searching...')}
                      </p>
                    </div>
                  </div>

                  {/* AI Estimate */}
                  <button className="w-full flex items-center gap-2 py-3 px-4 rounded-xl bg-accent/5 border border-accent/15 text-sm text-accent hover:bg-accent/10 transition-colors">
                    <Sparkles size={16} />
                    <span>Can't find it? Describe what you ate</span>
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
