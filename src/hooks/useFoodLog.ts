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

export function useWeeklyStats(today: string) {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['weekly-stats', today],
    queryFn: async () => {
      if (!user) return { days: [], streak: 0, totalDaysLogged: 0 }

      // Get last 7 days
      const dates: string[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        dates.push(d.toISOString().slice(0, 10))
      }

      // Fetch food_log for last 7 days
      const { data: logs } = await supabase
        .from('food_log')
        .select('logged_at, calories')
        .eq('user_id', user.id)
        .gte('logged_at', dates[0])
        .lte('logged_at', dates[dates.length - 1])

      // Aggregate per day
      const dailyMap = new Map<string, number>()
      for (const log of logs ?? []) {
        const prev = dailyMap.get(log.logged_at) ?? 0
        dailyMap.set(log.logged_at, prev + (log.calories ?? 0))
      }

      const days = dates.map(date => ({
        date,
        calories: dailyMap.get(date) ?? 0,
        logged: dailyMap.has(date),
      }))

      // Calculate streak (consecutive days with logs, counting backwards from today)
      let streak = 0
      for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].logged) streak++
        else break
      }

      // Total days ever logged
      const { count } = await supabase
        .from('food_log')
        .select('logged_at', { count: 'exact', head: true })
        .eq('user_id', user.id)

      return { days, streak, totalDaysLogged: count ?? 0 }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
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
