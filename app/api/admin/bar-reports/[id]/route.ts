import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
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

    const { data: event, error: eventError } = await (supabase as any)
      .from('bar_events')
      .select('*, event_bars(*)')
      .eq('id', params.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: eventError?.message || 'Event not found' }, { status: 404 })
    }

    // Sales and tips per bar
    const { data: barStats, error: barStatsError } = await (supabase as any)
      .rpc('get_event_bar_stats', { p_event_id: params.id })

    if (barStatsError) {
      console.error('Bar stats error:', barStatsError)
    }

    // Top-ups by payment method for this event
    const { data: topUpStats, error: topUpStatsError } = await (supabase as any)
      .from('bar_bracelet_transactions')
      .select('metadata, amount')
      .eq('event_id', params.id)
      .eq('type', 'top_up')
      .eq('status', 'completed')

    if (topUpStatsError) {
      console.error('Top-up stats error:', topUpStatsError)
    }

    // Total consumed balance (payments) for event
    const { data: paymentStats, error: paymentStatsError } = await (supabase as any)
      .from('bar_bracelet_transactions')
      .select('amount')
      .eq('event_id', params.id)
      .eq('type', 'payment')
      .eq('status', 'completed')

    if (paymentStatsError) {
      console.error('Payment stats error:', paymentStatsError)
    }

    // Total tips for event
    const { data: tipStats, error: tipStatsError } = await (supabase as any)
      .from('bar_bracelet_transactions')
      .select('bar_id, amount')
      .eq('event_id', params.id)
      .eq('type', 'tip')
      .eq('status', 'completed')

    if (tipStatsError) {
      console.error('Tip stats error:', tipStatsError)
    }

    // Top sold products for event
    const { data: productStats, error: productStatsError } = await (supabase as any)
      .from('bar_order_items')
      .select('name, quantity, total, bar_orders!inner(event_id)')
      .eq('bar_orders.event_id', params.id)
      .order('quantity', { ascending: false })
      .limit(20)

    if (productStatsError) {
      console.error('Product stats error:', productStatsError)
    }

    // Aggregate top-ups by method
    const topUpsByMethod: Record<string, number> = {}
    for (const tx of topUpStats || []) {
      const method = tx.metadata?.payment_method || 'unknown'
      topUpsByMethod[method] = (topUpsByMethod[method] || 0) + Number(tx.amount)
    }

    const totalTopUps = Object.values(topUpsByMethod).reduce((a, b) => a + b, 0)
    const totalPayments = (paymentStats || []).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0)
    const totalTips = (tipStats || []).reduce((sum: number, tx: any) => sum + Number(tx.amount), 0)

    return NextResponse.json({
      event,
      barStats: barStats || [],
      topUpsByMethod,
      totalTopUps,
      totalPayments,
      totalTips,
      productStats: productStats || [],
    })
  } catch (error: any) {
    console.error('Bar report detail error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
