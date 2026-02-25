import { useState } from 'react'
import { Search, Sparkles, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatedPage } from '@/components/ui/AnimatedPage'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useFoodSearch } from '@/hooks/useFoodSearch'

export default function FoodSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { data: results = [], isLoading } = useFoodSearch(query)

  return (
    <AnimatedPage className="space-y-3 pb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">Search Foods</h2>
      </div>

      <Input
        placeholder="Search foods..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={<Search size={16} />}
        autoFocus
      />

      {isLoading && query.length >= 2 && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-[60px] rounded-xl" />
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map((food) => (
            <GlassCard
              key={food.id ?? `${food.name}-${food.source}`}
              className="flex items-center justify-between py-3"
              onClick={() => {
                // TODO: Open food detail / add to log
              }}
            >
              <div className="flex-1 min-w-0 mr-2">
                <div className="text-sm text-text-primary truncate">{food.name}</div>
                <div className="text-xs text-text-muted">
                  {food.brand ? `${food.brand} · ` : ''}
                  {Math.round(food.calories_per_serving)} kcal / {food.serving_size}{food.serving_unit}
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-muted uppercase">
                {food.source}
              </span>
            </GlassCard>
          ))}
        </div>
      )}

      {query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-text-muted text-sm">No results found</p>
          <Button
            variant="ghost"
            className="mt-3"
            icon={<Sparkles size={14} />}
            onClick={() => {
              // TODO: Open AI estimate
            }}
          >
            Describe what you ate instead
          </Button>
        </div>
      )}
    </AnimatedPage>
  )
}
