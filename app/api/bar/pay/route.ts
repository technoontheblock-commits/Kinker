import { NextRequest, NextResponse } from 'next/server'
import { requireBar } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { generateOrderNumber, normalizeNfcUid } from '@/lib/bar'

export const dynamic = 'force-dynamic'

interface OrderItemInput {
  productId: string
  name: string
  price: number
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBar()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { nfcUid, items, tip, receiptType, eventId, barId } = body

    const normalizedUid = normalizeNfcUid(nfcUid)
    if (!normalizedUid) {
      return NextResponse.json({ error: 'NFC-UID fehlt' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Bestellung ist leer' }, { status: 400 })
    }

    const parsedTip = typeof tip === 'number' && !isNaN(tip) ? Math.max(0, tip) : 0

    if (!['none', 'app', 'email'].includes(receiptType)) {
      return NextResponse.json({ error: 'Ungültige Beleg-Auswahl' }, { status: 400 })
    }

    const validItems: OrderItemInput[] = []
    for (const item of items) {
      if (
        !item.productId || typeof item.productId !== 'string' ||
        !item.name || typeof item.name !== 'string' ||
        typeof item.price !== 'number' || item.price < 0 ||
        typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)
      ) {
        return NextResponse.json({ error: 'Ungültiges Bestellprodukt' }, { status: 400 })
      }
      validItems.push({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const orderNumber = generateOrderNumber()

    const { data, error } = await (supabase as any).rpc('process_bracelet_payment', {
      p_order_number: orderNumber,
      p_nfc_uid: normalizedUid,
      p_staff_id: auth.user.id,
      p_items: validItems,
      p_tip_amount: parsedTip,
      p_receipt_type: receiptType,
      p_event_id: eventId || null,
      p_bar_id: barId || null,
    })

    if (error) {
      console.error('process_bracelet_payment error:', error)
      const message = error.message || 'Bezahlung fehlgeschlagen'
      if (message.includes('Insufficient balance')) {
        return NextResponse.json({ error: 'Guthaben reicht nicht aus' }, { status: 409 })
      }
      if (message.includes('Bracelet is not active')) {
        return NextResponse.json({ error: 'Armband ist nicht aktiv' }, { status: 403 })
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ success: true, result: data })
  } catch (error: any) {
    console.error('Bar pay error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
