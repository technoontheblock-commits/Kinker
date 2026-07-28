import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')?.trim()

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode fehlt' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data: product, error: productError } = await (supabase as any)
      .from('bar_products')
      .select('*')
      .ilike('barcode', barcode)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    }

    const { data: transactions, error: txError } = await (supabase as any)
      .from('bar_inventory_transactions')
      .select('bar_id, quantity_change')
      .eq('product_id', product.id)

    if (txError) {
      console.error('Error loading inventory transactions:', txError)
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    const stock = {
      warehouse: 0,
      bars: {} as Record<string, number>,
      total: 0,
    }

    for (const t of transactions || []) {
      stock.total += t.quantity_change
      if (t.bar_id) {
        stock.bars[t.bar_id] = (stock.bars[t.bar_id] || 0) + t.quantity_change
      } else {
        stock.warehouse += t.quantity_change
      }
    }

    return NextResponse.json({ product, stock })
  } catch (error: any) {
    console.error('Inventory products GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
