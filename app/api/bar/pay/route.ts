import { NextRequest, NextResponse } from 'next/server'
import { requireBar } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { generateOrderNumber } from '@/lib/bar'
import { sendBarReceiptEmail } from '@/lib/email'

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
    const { customerId, items, tip, receiptType } = body

    if (!customerId || typeof customerId !== 'string') {
      return NextResponse.json({ error: 'Kunde fehlt' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Bestellung ist leer' }, { status: 400 })
    }

    const parsedTip = typeof tip === 'number' && !isNaN(tip) ? Math.max(0, tip) : 0

    if (!['none', 'app', 'email'].includes(receiptType)) {
      return NextResponse.json({ error: 'Ungültige Beleg-Auswahl' }, { status: 400 })
    }

    // Validate each item
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

    const { data, error } = await (supabase as any).rpc('process_bar_payment', {
      p_order_number: orderNumber,
      p_customer_id: customerId,
      p_staff_id: auth.user.id,
      p_items: validItems,
      p_tip_amount: parsedTip,
      p_receipt_type: receiptType,
    })

    if (error) {
      console.error('process_bar_payment error:', error)
      const message = error.message || 'Bezahlung fehlgeschlagen'
      if (message.includes('Insufficient balance')) {
        return NextResponse.json({ error: 'Guthaben reicht nicht aus' }, { status: 409 })
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    // Send receipt by email if requested. Email failures are logged but do not
    // fail the payment itself.
    if (receiptType === 'email' && data?.order_id) {
      try {
        const { data: user } = await (supabase as any)
          .from('users')
          .select('name, email')
          .eq('id', customerId)
          .single()

        if (user?.email) {
          await sendBarReceiptEmail({
            to: user.email,
            customerName: user.name?.split(' ')[0] || user.name || 'Gast',
            orderNumber,
            items: validItems.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
            })),
            subtotal: data.subtotal,
            tip: data.tip,
            total: data.total,
            remainingBalance: data.remaining_balance,
          })

          // Mark receipt as sent
          await (supabase as any)
            .from('bar_orders')
            .update({ receipt_sent: true })
            .eq('id', data.order_id)
        }
      } catch (emailError) {
        console.error('Bar receipt email error:', emailError)
      }
    }

    return NextResponse.json({ success: true, result: data })
  } catch (error: any) {
    console.error('Bar pay error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
