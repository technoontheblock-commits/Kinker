import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Helper to generate QR code data
function generateQRCode(ticketId: string, secret: string): string {
  return `KINKER-${ticketId}-${secret}`
}

// POST /api/checkout - Process checkout
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const cookieStore = cookies()
    const sessionId = cookieStore.get('session_id')?.value
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:merchandise(*),
        event_ticket:event_tickets(*, event:events(*))
      `)
      .eq('session_id', sessionId)

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = cartItems.map((item: any) => {
      const isTicket = !!item.event_ticket
      const price = isTicket ? item.event_ticket.price : item.product.price
      const name = isTicket ? item.event_ticket.name : item.product.name
      subtotal += price * item.quantity

      return {
        product_id: item.product_id,
        event_ticket_id: item.event_ticket_id,
        name: name,
        price: price,
        quantity: item.quantity,
        selected_size: item.selected_size,
        is_ticket: isTicket,
        event_id: isTicket ? item.event_ticket.event_id : null,
        event_name: isTicket ? item.event_ticket.event?.name : null,
        event_date: isTicket ? item.event_ticket.event?.date : null
      }
    })

    const shippingCost = body.shipping_cost || 0
    const total = subtotal + shippingCost

    // Generate order number
    const year = new Date().getFullYear()
    const { data: orderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', `${year}-01-01`)
    
    const sequence = (orderCount?.length || 0) + 1
    const orderNumber = `KINKER-${year}-${String(sequence).padStart(6, '0')}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_email: body.customer_email,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone || null,
        shipping_address: body.shipping_address || null,
        billing_address: body.billing_address || null,
        payment_method: body.payment_method,
        payment_status: body.payment_method === 'twint' ? 'pending' : 'pending',
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total: total,
        status: 'pending',
        notes: body.notes || null
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Create order error:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create order items
    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map((item: any) => ({ ...item, order_id: order.id })))
      .select()

    if (itemsError) {
      console.error('Create order items error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Create tickets for event tickets
    const tickets = []
    for (const item of createdItems || []) {
      if (item.is_ticket && item.event_ticket_id) {
        for (let i = 0; i < item.quantity; i++) {
          const ticketSecret = randomUUID().replace(/-/g, '').substring(0, 16)
          const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .insert([{
              order_id: order.id,
              order_item_id: item.id,
              event_id: item.event_id,
              event_ticket_id: item.event_ticket_id,
              ticket_number: `${orderNumber}-T${String(i + 1).padStart(2, '0')}`,
              qr_code: generateQRCode(randomUUID(), ticketSecret),
              qr_secret: ticketSecret,
              holder_name: body.customer_name,
              holder_email: body.customer_email
            }])
            .select()
            .single()

          if (!ticketError && ticket) {
            tickets.push(ticket)
          }
        }

        // Update sold count
        await supabase
          .from('event_tickets')
          .update({ sold_count: supabase.rpc('increment', { x: item.quantity }) })
          .eq('id', item.event_ticket_id)
      }
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('session_id', sessionId)

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/order-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order,
          items: createdItems,
          tickets
        })
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return NextResponse.json({
      order,
      items: createdItems,
      tickets,
      paymentInstructions: getPaymentInstructions(body.payment_method, order.order_number)
    })
  } catch (error: any) {
    console.error('Checkout exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getPaymentInstructions(method: string, orderNumber: string) {
  switch (method) {
    case 'twint':
      return {
        method: 'twint',
        title: 'Zahlung per TWINT',
        description: 'Scanne den QR-Code mit deiner TWINT App oder sende die Zahlung an:',
        qrCode: true,
        phone: '+41 79 123 45 67',
        reference: orderNumber
      }
    case 'bank_transfer':
      return {
        method: 'bank_transfer',
        title: 'Banküberweisung',
        description: 'Bitte überweise den Betrag auf folgendes Konto:',
        iban: 'CH93 0076 2011 6238 5295 7',
        bic: 'BKBBCHBB',
        accountName: 'KINKER Basel GmbH',
        reference: orderNumber,
        note: 'Die Bestellung wird nach Zahlungseingang bearbeitet.'
      }
    case 'invoice':
      return {
        method: 'invoice',
        title: 'Rechnung',
        description: 'Du erhältst eine Rechnung per E-Mail.',
        note: 'Zahlungsfrist: 14 Tage nach Rechnungsdatum'
      }
    default:
      return null
  }
}
