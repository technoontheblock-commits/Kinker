import { NextRequest, NextResponse } from 'next/server'
import { requireBar } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { generateOrderNumber, normalizeNfcUid, getFirstName } from '@/lib/bar'
import { sendBarReceiptEmail } from '@/lib/email'
import { generateBarReceiptPdfBuffer } from '@/lib/bar-receipt-pdf-buffer'

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
    const { nfcUid, items, tip, receiptType, email, eventId, barId } = body

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

    if (receiptType === 'email') {
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return NextResponse.json({ error: 'Gültige E-Mail-Adresse erforderlich' }, { status: 400 })
      }
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

    const result = data as {
      order_id: string
      order_number: string
      subtotal: number
      tip: number
      total: number
      remaining_balance: number
    }

    if (receiptType === 'email' && email) {
      try {
        const pdfBuffer = await generateBarReceiptPdfBuffer({
          orderNumber: result.order_number,
          createdAt: new Date().toLocaleString('de-CH', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          items: validItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
          })),
          subtotal: result.subtotal,
          tip: result.tip,
          total: result.total,
          remainingBalance: result.remaining_balance,
          currency: 'CHF',
        })

        const emailResult = await sendBarReceiptEmail({
          to: email.trim(),
          customerName: getFirstName(email.trim().split('@')[0]),
          orderNumber: result.order_number,
          items: validItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
          })),
          subtotal: result.subtotal,
          tip: result.tip,
          total: result.total,
          remainingBalance: result.remaining_balance,
          currency: 'CHF',
          pdfBuffer,
        })

        if (!emailResult.success) {
          console.error('Bar receipt email failed:', emailResult.error)
        } else {
          await (supabase as any)
            .from('bar_orders')
            .update({ receipt_sent: true })
            .eq('id', result.order_id)
        }

        return NextResponse.json({
          success: true,
          result: data,
          emailSent: emailResult.success,
          emailWarning: emailResult.warning,
          emailError: emailResult.error,
        })
      } catch (emailError: any) {
        console.error('Bar receipt email error:', emailError)
        return NextResponse.json({
          success: true,
          result: data,
          emailSent: false,
          emailError: emailError.message || 'E-Mail-Versand fehlgeschlagen',
        })
      }
    }

    return NextResponse.json({ success: true, result: data })
  } catch (error: any) {
    console.error('Bar pay error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
