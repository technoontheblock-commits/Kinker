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
    
    // Get discount from cookie
    const discountCookie = cookieStore.get('cart_discount')?.value
    let discountAmount = 0
    let discountInfo = null
    let redemptionId = null
    
    if (discountCookie) {
      try {
        const discount = JSON.parse(discountCookie)
        redemptionId = discount.redemption_id
        
        // Calculate discount based on type
        if (discount.type === 'discount' && discount.value?.discount_percent) {
          discountAmount = (subtotal * discount.value.discount_percent) / 100
        } else if (discount.type === 'free_ticket') {
          // Free ticket - find cheapest ticket
          const tickets = orderItems.filter((item: any) => item.is_ticket)
          if (tickets.length > 0) {
            const cheapestTicket = tickets.reduce((min: any, item: any) => 
              item.price < min.price ? item : min
            )
            discountAmount = cheapestTicket.price * cheapestTicket.quantity
          }
        }
        
        discountInfo = {
          code: discount.code,
          name: discount.name,
          type: discount.type,
          amount: discountAmount
        }
      } catch {
        // Invalid discount cookie
      }
    }
    
    const total = Math.max(0, subtotal + shippingCost - discountAmount)

    // Generate order number
    const year = new Date().getFullYear()
    const { data: orderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', `${year}-01-01`)
    
    const sequence = (orderCount?.length || 0) + 1
    const orderNumber = `KINKER-${year}-${String(sequence).padStart(6, '0')}`

    // Create order (only include fields that exist in schema)
    const orderData: any = {
      order_number: orderNumber,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone || null,
      shipping_address: body.shipping_address || null,
      billing_address: body.billing_address || null,
      payment_method: body.payment_method,
      payment_status: 'pending',
      subtotal: subtotal,
      shipping_cost: shippingCost,
      total: total,
      status: 'pending',
      notes: body.iban ? `IBAN: ${body.iban}` : (body.notes || null)
    }
    
    // Only add discount fields if they exist (will be ignored if column doesn't exist)
    if (discountAmount > 0) {
      orderData.discount_amount = discountAmount
      orderData.discount_code = discountInfo?.code || null
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
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
              holder_email: body.customer_email,
              payment_status: 'pending'
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

    // Mark redemption as used if discount was applied
    if (redemptionId) {
      try {
        await supabase
          .from('reward_redemptions')
          .update({
            status: 'used',
            used_at: new Date().toISOString()
          })
          .eq('id', redemptionId)
        
        // Clear discount cookie
        cookieStore.delete('cart_discount')
      } catch (error) {
        console.error('Error marking redemption as used:', error)
      }
    }

    // Award points to logged-in user
    try {
      const userSession = cookieStore.get('user_session')?.value
      if (userSession) {
        const user = JSON.parse(userSession)
        
        // Calculate points: Tickets = 1x, Merch = 2x
        let pointsToAdd = 0
        for (const item of orderItems) {
          if (item.is_ticket) {
            pointsToAdd += Math.floor(item.price * item.quantity) // 1 CHF = 1 point
          } else {
            pointsToAdd += Math.floor(item.price * item.quantity * 2) // 1 CHF = 2 points
          }
        }

        if (pointsToAdd > 0) {
          // Get current rewards
          const { data: userRewards } = await supabase
            .from('user_rewards')
            .select('points, lifetime_points, tier')
            .eq('user_id', user.id)
            .single()

          // Apply tier multiplier
          let multiplier = 1
          if (userRewards?.tier === 'Silver') multiplier = 1.2
          if (userRewards?.tier === 'Gold') multiplier = 1.5
          if (userRewards?.tier === 'Platinum') multiplier = 2

          const finalPoints = Math.floor(pointsToAdd * multiplier)

          if (userRewards) {
            // Update existing rewards
            await supabase
              .from('user_rewards')
              .update({
                points: userRewards.points + finalPoints,
                lifetime_points: userRewards.lifetime_points + finalPoints,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
          } else {
            // Create new rewards record
            await supabase
              .from('user_rewards')
              .insert({
                user_id: user.id,
                points: finalPoints,
                lifetime_points: finalPoints,
                tier: 'Bronze'
              })
          }
        }
      }
    } catch (pointsError) {
      console.error('Error awarding points:', pointsError)
      // Don't fail the order if points fail
    }

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
      paymentInstructions: getPaymentInstructions(body.payment_method, order.order_number, body.iban)
    })
  } catch (error: any) {
    console.error('Checkout exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getPaymentInstructions(method: string, orderNumber: string, iban?: string) {
  switch (method) {
    case 'twint':
      return {
        method: 'twint',
        title: 'Pay with TWINT',
        description: 'Open your TWINT app and send the payment to:',
        qrCode: true,
        phone: '+41 79 123 45 67',
        reference: orderNumber,
        steps: [
          'Open TWINT app',
          'Tap "Send Money"',
          `Enter phone: +41 79 123 45 67`,
          `Add reference: ${orderNumber}`,
          'Confirm payment'
        ]
      }
    case 'sepa':
      return {
        method: 'sepa',
        title: 'SEPA Direct Debit',
        description: 'We will debit the amount from your account within 1-3 business days.',
        iban: iban || 'Provided at checkout',
        reference: orderNumber,
        note: 'You will receive a confirmation email once the debit is processed.'
      }
    case 'bank_transfer':
      return {
        method: 'bank_transfer',
        title: 'Bank Transfer',
        description: 'Please transfer the amount to the following account:',
        iban: 'CH93 0076 2011 6238 5295 7',
        bic: 'BKBBCHBB',
        accountName: 'KINKER Basel GmbH',
        reference: orderNumber,
        note: 'Your order will be processed after payment is received.'
      }
    default:
      return null
  }
}
