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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const productId = searchParams.get('productId')
    const barId = searchParams.get('barId')
    const type = searchParams.get('type')

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    let query = (supabase as any)
      .from('bar_inventory_transactions')
      .select('*, product:bar_products(*), bar:event_bars(*), event:bar_events(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (productId) query = query.eq('product_id', productId)
    if (barId && barId !== 'null') query = query.eq('bar_id', barId)
    if (barId === 'null') query = query.is('bar_id', null)
    if (type) query = query.eq('type', type)

    const { data, error } = await query

    if (error) {
      console.error('Error loading inventory transactions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ transactions: data || [] })
  } catch (error: any) {
    console.error('Inventory transactions GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
