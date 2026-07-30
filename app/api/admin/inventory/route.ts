import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { productId, type, quantity, barId, notes } = body

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Produkt ID fehlt' }, { status: 400 })
    }

    if (!['delivery', 'transfer_to_bar', 'correction'].includes(type)) {
      return NextResponse.json({ error: 'Ungültiger Typ' }, { status: 400 })
    }

    if (type === 'correction') {
      if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity === 0) {
        return NextResponse.json({ error: 'Menge muss eine von 0 verschiedene Ganzzahl sein' }, { status: 400 })
      }
    } else {
      if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Menge muss eine positive Ganzzahl sein' }, { status: 400 })
      }
    }

    if (type === 'transfer_to_bar' && !barId) {
      return NextResponse.json({ error: 'Bar ID fehlt für Transfer' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const baseTx = {
      product_id: productId,
      created_by: auth.user.id,
      notes: typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : null,
    }

    if (type === 'delivery') {
      const { data, error } = await (supabase as any)
        .from('bar_inventory_transactions')
        .insert({
          ...baseTx,
          bar_id: null,
          event_id: null,
          quantity_change: quantity,
          type: 'delivery',
        })
        .select()

      if (error) throw error
      return NextResponse.json({ success: true, transactions: data })
    }

    if (type === 'transfer_to_bar') {
      const { data: bar, error: barError } = await (supabase as any)
        .from('event_bars')
        .select('event_id')
        .eq('id', barId)
        .single()

      if (barError || !bar) {
        return NextResponse.json({ error: 'Bar nicht gefunden' }, { status: 404 })
      }

      const { data, error } = await (supabase as any)
        .from('bar_inventory_transactions')
        .insert([
          {
            ...baseTx,
            bar_id: null,
            event_id: null,
            quantity_change: -quantity,
            type: 'transfer_out',
            notes: `${baseTx.notes || ''} Transfer zu Bar ${barId}`.trim(),
          },
          {
            ...baseTx,
            bar_id: barId,
            event_id: bar.event_id,
            quantity_change: quantity,
            type: 'transfer_in',
            notes: `${baseTx.notes || ''} Transfer aus Lager`.trim(),
          },
        ])
        .select()

      if (error) throw error
      return NextResponse.json({ success: true, transactions: data })
    }

    if (type === 'correction') {
      const { data: bar, error: barError } = barId
        ? await (supabase as any)
            .from('event_bars')
            .select('event_id')
            .eq('id', barId)
            .single()
        : { data: null, error: null }

      if (barId && (barError || !bar)) {
        return NextResponse.json({ error: 'Bar nicht gefunden' }, { status: 404 })
      }

      const { data, error } = await (supabase as any)
        .from('bar_inventory_transactions')
        .insert({
          ...baseTx,
          bar_id: barId || null,
          event_id: bar?.event_id || null,
          quantity_change: quantity,
          type: 'correction',
        })
        .select()

      if (error) throw error
      return NextResponse.json({ success: true, transactions: data })
    }
  } catch (error: any) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
