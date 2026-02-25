import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { FoodLogEntry, NewFoodLogEntry } from '@/types/food'

export function useDailyLog(date: string) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['food-log', date],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('food_log')
        .select('*, food_items(*)')
        .eq('user_id', user.id)
        .eq('logged_at', date)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as FoodLogEntry[]
    },
    enabled: !!user,
  })
}

export function useAddFoodLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: NewFoodLogEntry) => {
      const { data, error } = await supabase
        .from('food_log')
        .insert(entry)
        .select('*, food_items(*)')
        .single()

      if (error) throw error

      // Update frecency
      if (entry.food_item_id) {
        await supabase.rpc('upsert_food_usage', {
          p_user_id: entry.user_id,
          p_food_item_id: entry.food_item_id,
          p_serving_size: entry.serving_size ?? 100,
          p_serving_unit: entry.serving_unit ?? 'g',
        })
      }

      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['food-log', variables.logged_at] })
      queryClient.invalidateQueries({ queryKey: ['recent-foods'] })
      toast.success('Food logged!')
    },
    onError: (error) => {
      toast.error(`Failed to log food: ${error.message}`)
    },
  })
}

export function useUpdateFoodLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<FoodLogEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('food_log')
        .update(updates)
        .eq('id', id)
        .select('*, food_items(*)')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['food-log', data.logged_at],
      })
      toast.success('Entry updated')
    },
  })
}

export function useDeleteFoodLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      logged_at,
    }: {
      id: string
      logged_at: string
    }) => {
      const { error } = await supabase.from('food_log').delete().eq('id', id)
      if (error) throw error
      return logged_at
    },
    onSuccess: (logged_at) => {
      queryClient.invalidateQueries({ queryKey: ['food-log', logged_at] })
      toast.success('Entry deleted')
    },
  })
}
