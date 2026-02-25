import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { weight_kg, body_fat_pct, notes } = await req.json()

    // Get last 14 days of food log summaries
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: dailyLogs } = await supabase
      .from('daily_summary')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', fourteenDaysAgo.toISOString().split('T')[0])

    // Get last 4 check-ins for weight trend
    const { data: recentCheckins } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(4)

    // Calculate average daily calories
    const days = dailyLogs?.length ?? 0
    const avgCalories = days > 0
      ? (dailyLogs ?? []).reduce((sum: number, d: any) => sum + (d.total_calories ?? 0), 0) / days
      : null

    // Calculate weight trend
    let weightDelta = null
    if (recentCheckins && recentCheckins.length >= 2) {
      const latest = weight_kg
      const oldest = recentCheckins[recentCheckins.length - 1].weight_kg
      weightDelta = latest - oldest
    }

    // Estimate expenditure
    let expenditure = null
    if (avgCalories && weightDelta !== null && days >= 3) {
      const weightDeltaKcal = weightDelta * 7700
      expenditure = avgCalories - (weightDeltaKcal / days)
      expenditure = Math.max(1200, Math.min(5000, expenditure))
    }

    // Get previous TDEE for blending
    const previousTDEE = recentCheckins?.[0]?.estimated_tdee
    let estimatedTDEE = expenditure ? Math.round(expenditure) : previousTDEE
    if (estimatedTDEE && previousTDEE) {
      estimatedTDEE = Math.round(0.7 * estimatedTDEE + 0.3 * previousTDEE)
    }

    // Save check-in
    const { data: checkIn, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        weight_kg,
        body_fat_pct: body_fat_pct || null,
        estimated_tdee: estimatedTDEE,
        avg_daily_calories_7d: avgCalories ? Math.round(avgCalories) : null,
        weight_trend_kg: weightDelta,
        expenditure_estimate: expenditure ? Math.round(expenditure) : null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(checkIn), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
