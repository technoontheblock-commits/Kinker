import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function isValidStockValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')

    // Load existing stock records for this event (optionally filtered by bar)
    let stocksQuery = (supabase as any)
      .from('bar_event_bar_stocks')
      .select('*')
      .eq('event_id', params.id)

    if (barId) {
      stocksQuery = stocksQuery.eq('bar_id', barId)
    }

    const { data: stocks, error: stocksError } = await stocksQuery

    if (stocksError) {
      console.error('Fetch stocks error:', stocksError)
      return NextResponse.json({ error: stocksError.message }, { status: 500 })
    }

    // If no barId requested, return just the stock overview
    if (!barId) {
      return NextResponse.json({
        stocks: stocks || [],
      })
    }

    // Verify bar belongs to event
    const { data: bar, error: barError } = await (supabase as any)
      .from('event_bars')
      .select('id, name, event_id')
      .eq('id', barId)
      .eq('event_id', params.id)
      .single()

    if (barError || !bar) {
      return NextResponse.json({ error: barError?.message || 'Bar nicht gefunden' }, { status: 404 })
    }

    // Load all active bar products
    const { data: products, error: productsError } = await (supabase as any)
      .from('bar_products')
      .select('id, name, category, active, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (productsError) {
      console.error('Fetch products error:', productsError)
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    return NextResponse.json({
      bar,
      products: products || [],
      stocks: stocks || [],
    })
  } catch (error: any) {
    console.error('Bar stock GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { barId, type, stocks } = body

    if (!barId || typeof barId !== 'string') {
      return NextResponse.json({ error: 'barId ist erforderlich' }, { status: 400 })
    }

    if (!type || (type !== 'initial' && type !== 'final')) {
      return NextResponse.json({ error: 'type muss "initial" oder "final" sein' }, { status: 400 })
    }

    if (!stocks || typeof stocks !== 'object') {
      return NextResponse.json({ error: 'stocks ist erforderlich' }, { status: 400 })
    }

    // Verify bar belongs to event
    const { data: bar, error: barError } = await (supabase as any)
      .from('event_bars')
      .select('id')
      .eq('id', barId)
      .eq('event_id', params.id)
      .single()

    if (barError || !bar) {
      return NextResponse.json({ error: barError?.message || 'Bar nicht gefunden' }, { status: 404 })
    }

    // Check if stock type already submitted
    const submittedAtField = type === 'initial' ? 'initial_submitted_at' : 'final_submitted_at'
    const { data: existingSubmitted, error: checkError } = await (supabase as any)
      .from('bar_event_bar_stocks')
      .select('id')
      .eq('event_id', params.id)
      .eq('bar_id', barId)
      .not(submittedAtField, 'is', null)
      .limit(1)

    if (checkError) {
      console.error('Check existing stock error:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingSubmitted && existingSubmitted.length > 0) {
      return NextResponse.json({ error: `${type === 'initial' ? 'Anfangsstock' : 'Endstock'} wurde bereits erfasst und kann nicht mehr geändert werden` }, { status: 409 })
    }

    // Validate product IDs and stock values
    const productIds = Object.keys(stocks)
    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Mindestens ein Produkt ist erforderlich' }, { status: 400 })
    }

    const { data: validProducts, error: productsError } = await (supabase as any)
      .from('bar_products')
      .select('id')
      .eq('active', true)
      .in('id', productIds)

    if (productsError) {
      console.error('Validate products error:', productsError)
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const validProductIds = new Set((validProducts || []).map((p: any) => p.id))
    for (const productId of productIds) {
      if (!validProductIds.has(productId)) {
        return NextResponse.json({ error: `Ungültiges Produkt: ${productId}` }, { status: 400 })
      }
      if (!isValidStockValue(stocks[productId])) {
        return NextResponse.json({ error: `Ungültige Flaschenanzahl für Produkt ${productId}` }, { status: 400 })
      }
    }

    // For final stock, require that initial stock exists for this bar
    if (type === 'final') {
      const { data: initialExists, error: initialError } = await (supabase as any)
        .from('bar_event_bar_stocks')
        .select('id')
        .eq('event_id', params.id)
        .eq('bar_id', barId)
        .not('initial_submitted_at', 'is', null)
        .limit(1)

      if (initialError) {
        console.error('Check initial stock error:', initialError)
        return NextResponse.json({ error: initialError.message }, { status: 500 })
      }

      if (!initialExists || initialExists.length === 0) {
        return NextResponse.json({ error: 'Anfangsstock muss zuerst erfasst werden' }, { status: 400 })
      }
    }

    const stockField = type === 'initial' ? 'initial_stock' : 'final_stock'
    const submittedByField = type === 'initial' ? 'initial_submitted_by' : 'final_submitted_by'

    // Upsert stock records
    for (const productId of productIds) {
      const { error: upsertError } = await (supabase as any)
        .from('bar_event_bar_stocks')
        .upsert(
          {
            event_id: params.id,
            bar_id: barId,
            product_id: productId,
            [stockField]: stocks[productId],
            [submittedByField]: auth.user?.id || null,
            [submittedAtField]: new Date().toISOString(),
          },
          {
            onConflict: 'event_id,bar_id,product_id',
            ignoreDuplicates: false,
          }
        )

      if (upsertError) {
        console.error('Upsert stock error:', upsertError)
        return NextResponse.json({ error: upsertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Bar stock POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
