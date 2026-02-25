import { corsHeaders } from '../_shared/cors.ts'

const USDA_API_KEY = Deno.env.get('USDA_API_KEY') ?? ''

interface NormalizedFood {
  name: string
  brand: string | null
  serving_size: number
  serving_unit: string
  calories_per_serving: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  fdc_id: number | null
  off_barcode: string | null
  source: 'usda' | 'off'
}

function getNutrientValue(nutrients: any[], id: number): number {
  const n = nutrients?.find((n: any) => n.nutrientId === id)
  return n?.value ?? 0
}

function normalizeUSDA(data: any): NormalizedFood[] {
  return (data?.foods ?? []).map((food: any) => ({
    name: food.description ?? 'Unknown',
    brand: food.brandName ?? food.brandOwner ?? null,
    serving_size: food.servingSize ?? 100,
    serving_unit: food.servingSizeUnit ?? 'g',
    calories_per_serving: getNutrientValue(food.foodNutrients, 1008),
    protein_g: getNutrientValue(food.foodNutrients, 1003),
    carbs_g: getNutrientValue(food.foodNutrients, 1005),
    fat_g: getNutrientValue(food.foodNutrients, 1004),
    fiber_g: getNutrientValue(food.foodNutrients, 1079) || null,
    fdc_id: food.fdcId,
    off_barcode: null,
    source: 'usda' as const,
  }))
}

function normalizeOFF(data: any): NormalizedFood[] {
  return (data?.products ?? [])
    .filter((p: any) => p.nutriments && p.product_name)
    .map((p: any) => ({
      name: p.product_name,
      brand: p.brands ?? null,
      serving_size: parseFloat(p.serving_quantity) || 100,
      serving_unit: p.serving_quantity_unit ?? 'g',
      calories_per_serving: p.nutriments?.['energy-kcal_100g'] ?? 0,
      protein_g: p.nutriments?.proteins_100g ?? 0,
      carbs_g: p.nutriments?.carbohydrates_100g ?? 0,
      fat_g: p.nutriments?.fat_100g ?? 0,
      fiber_g: p.nutriments?.fiber_100g ?? null,
      fdc_id: null,
      off_barcode: p.code ?? null,
      source: 'off' as const,
    }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, pageSize = 20 } = await req.json()

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ foods: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch from both APIs in parallel
    const [usdaRes, offRes] = await Promise.allSettled([
      fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          dataType: ['Foundation', 'SR Legacy', 'Branded'],
          pageSize,
        }),
      }).then((r) => r.json()),

      fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10`,
      ).then((r) => r.json()),
    ])

    const usdaFoods =
      usdaRes.status === 'fulfilled' ? normalizeUSDA(usdaRes.value) : []
    const offFoods =
      offRes.status === 'fulfilled' ? normalizeOFF(offRes.value) : []

    // Merge: USDA first, then OFF (deduplicated by name similarity)
    const foods = [...usdaFoods, ...offFoods]

    return new Response(JSON.stringify({ foods }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
