import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FoodItem } from '@/types/food'

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['food-search', query],
    queryFn: async (): Promise<FoodItem[]> => {
      // First check local cache
      const { data: cached } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)

      // Then call edge function for USDA + OFF
      const { data: remote, error } = await supabase.functions.invoke(
        'food-search',
        { body: { query, pageSize: 20 } },
      )

      if (error) {
        // Return local results if edge function fails
        return (cached ?? []) as FoodItem[]
      }

      // Merge: local first, then remote (deduped)
      const localIds = new Set((cached ?? []).map((f: FoodItem) => f.fdc_id).filter(Boolean))
      const remoteFoods = ((remote?.foods as FoodItem[]) ?? []).filter(
        (f) => !f.fdc_id || !localIds.has(f.fdc_id),
      )

      return [...(cached ?? []) as FoodItem[], ...remoteFoods]
    },
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000,
  })
}
