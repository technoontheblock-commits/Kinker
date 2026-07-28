import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data: products, error: productsError } = await (supabase as any)
      .from('bar_products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (productsError) {
      console.error('Error loading products:', productsError)
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const { data: transactions, error: txError } = await (supabase as any)
      .from('bar_inventory_transactions')
      .select('product_id, bar_id, quantity_change')

    if (txError) {
      console.error('Error loading inventory transactions:', txError)
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    const { data: bars, error: barsError } = await (supabase as any)
      .from('event_bars')
      .select('id, name, event_id')

    if (barsError) {
      console.error('Error loading bars:', barsError)
      return NextResponse.json({ error: barsError.message }, { status: 500 })
    }

    const stockByProduct: Record<string, { warehouse: number; bars: Record<string, number>; total: number }> = {}
    for (const p of products || []) {
      stockByProduct[p.id] = { warehouse: 0, bars: {}, total: 0 }
    }

    for (const t of transactions || []) {
      const s = stockByProduct[t.product_id]
      if (!s) continue
      s.total += t.quantity_change
      if (t.bar_id) {
        s.bars[t.bar_id] = (s.bars[t.bar_id] || 0) + t.quantity_change
      } else {
        s.warehouse += t.quantity_change
      }
    }

    const stock = (products || []).map((p: any) => ({
      product: p,
      warehouse: stockByProduct[p.id].warehouse,
      bars: Object.entries(stockByProduct[p.id].bars).map(([barId, quantity]) => ({
        bar: bars?.find((b: any) => b.id === barId) || { id: barId, name: 'Unbekannt' },
        quantity,
      })),
      total: stockByProduct[p.id].total,
    }))

    return NextResponse.json({ stock })
  } catch (error: any) {
    console.error('Inventory stock GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
