import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { cart, customer } = await request.json()
    const cookieStore = cookies()
    const sessionId = cookieStore.get('session_id')?.value

    if (!cart?.items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate order number
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase()
    const { data: orderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', `${year}-01-01`)
    
    const sequence = (orderCount?.length || 0) + 1
    const orderNumber = `KINKER-${year}-${String(sequence).padStart(4, '0')}-${timestamp}`

    // Calculate totals
    let subtotal = 0
    const lineItems = cart.items.map((item: any) => {
      let name = ''
      let price = 0
      let description = ''

      if (item.product?.name) {
        name = item.product.name
        price = item.product.price
        description = item.selected_size ? `Größe: ${item.selected_size}` : ''
      } else if (item.event_ticket?.name) {
        name = item.event_ticket.name
        price = item.event_ticket.price
        description = item.event_ticket.event?.name || ''
      } else if (item.vip_booking_id || item.metadata?.type === 'vip_booking') {
        name = `VIP ${item.metadata?.package || item.selected_size} Package`
        price = item.metadata?.price || 0
        description = item.metadata?.event_name || ''
      }

      subtotal += price * item.quantity

      return {
        price_data: {
          currency: 'chf',
          product_data: {
            name,
            description,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }
    })

    const total = subtotal - (cart.discountAmount || 0)

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_email: customer.email,
        customer_name: customer.name,
        customer_phone: customer.phone || null,
        shipping_address: {
          street: customer.street,
          city: customer.city,
          zip: customer.zip,
          country: customer.country,
        },
        payment_method: 'stripe',
        payment_status: 'pending',
        subtotal: subtotal,
        discount_amount: cart.discountAmount || 0,
        total: total,
        status: 'pending',
      }])
      .select()
      .single()

    if (orderError) {
      console.error('Create order error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items
    const orderItems = cart.items.map((item: any) => {
      let name = ''
      let price = 0
      let isTicket = false
      let isVIP = false
      let eventId = null

      if (item.product?.name) {
        name = item.product.name
        price = item.product.price
      } else if (item.event_ticket?.name) {
        name = item.event_ticket.name
        price = item.event_ticket.price
        isTicket = true
        eventId = item.event_ticket.event_id
      } else if (item.vip_booking_id || item.metadata?.type === 'vip_booking') {
        name = `VIP ${item.metadata?.package || item.selected_size} Package`
        price = item.metadata?.price || 0
        isVIP = true
        eventId = item.metadata?.event_id
      }

      return {
        order_id: order.id,
        product_id: item.product_id,
        event_ticket_id: item.event_ticket_id,
        vip_booking_id: item.vip_booking_id,
        name,
        price,
        quantity: item.quantity,
        selected_size: item.selected_size,
        is_ticket: isTicket,
        is_vip: isVIP,
        event_id: eventId,
        metadata: item.metadata,
      }
    })

    await supabase.from('order_items').insert(orderItems)

    // Clear cart
    if (sessionId) {
      await supabase.from('cart_items').delete().eq('session_id', sessionId)
    }

    // Create Stripe Checkout Session with activated payment methods
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card',        // Kreditkarten
        'paypal',      // PayPal
        'bancontact',  // Belgien
      ],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://knkr.ch'}/checkout/success?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://knkr.ch'}/checkout?canceled=true`,
      customer_email: customer.email,
      metadata: {
        order_number: orderNumber,
        order_id: order.id,
      },
      // Collect billing address
      billing_address_collection: 'required',
      // Collect shipping address for physical products
      shipping_address_collection: {
        allowed_countries: ['CH', 'DE', 'AT', 'FR', 'IT', 'LI'],
      },
    })

    // Update order with Stripe session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
