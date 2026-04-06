import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sumupApiKey = process.env.SUMUP_API_KEY
const sumupMerchantCode = process.env.SUMUP_MERCHANT_CODE

// Helper to generate QR code data
function generateQRCode(ticketId: string, secret: string): string {
  return `KINKER-${ticketId}-${secret}`
}

// POST /api/checkout/sumup - Create SumUp checkout
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    if (!sumupApiKey) {
      return NextResponse.json({ error: 'SumUp not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const cookieStore = cookies()
    const sessionId = cookieStore.get('session_id')?.value
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get cart items (simplified query to avoid join issues)
    const { data: cartItemsRaw, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)

    if (cartError || !cartItemsRaw || cartItemsRaw.length === 0) {
      console.error('Cart error or empty:', cartError, cartItemsRaw)
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    
    // Fetch related data manually
    const cartItems = await Promise.all(cartItemsRaw.map(async (item: any) => {
      const result: any = { ...item }
      
      if (item.product_id) {
        const { data: product } = await supabase
          .from('merchandise')
          .select('*')
          .eq('id', item.product_id)
          .single()
        result.product = product
      }
      
      if (item.event_ticket_id) {
        const { data: ticket } = await supabase
          .from('event_tickets')
          .select('*, event:events(*)')
          .eq('id', item.event_ticket_id)
          .single()
        result.event_ticket = ticket
      }
      
      if (item.vip_booking_id) {
        const { data: vip } = await supabase
          .from('vip_bookings')
          .select('*, event:events(*)')
          .eq('id', item.vip_booking_id)
          .single()
        result.vip_booking = vip
      }
      
      return result
    }))

    // Calculate totals
    let subtotal = 0
    const orderItems = cartItems.map((item: any) => {
      const isTicket = !!item.event_ticket
      const isVIP = !!item.vip_booking || item.metadata?.type === 'vip_booking'
      
      let price = 0
      let name = ''
      let eventId = null
      let eventName = null
      let eventDate = null
      
      if (isTicket) {
        price = item.event_ticket.price
        name = item.event_ticket.name
        eventId = item.event_ticket.event_id
        eventName = item.event_ticket.event?.name
        eventDate = item.event_ticket.event?.date
      } else if (isVIP) {
        price = item.metadata?.price || 0
        name = `VIP ${item.metadata?.package || item.selected_size} Package`
        eventId = item.vip_booking?.event_id || item.metadata?.event_id
        eventName = item.metadata?.event_name || item.vip_booking?.event?.name
        eventDate = item.metadata?.event_date || item.vip_booking?.event?.date
      } else {
        price = item.product.price
        name = item.product.name
      }
      
      subtotal += price * item.quantity

      return {
        product_id: item.product_id,
        event_ticket_id: item.event_ticket_id,
        vip_booking_id: item.vip_booking_id,
        name: name,
        price: price,
        quantity: item.quantity,
        selected_size: item.selected_size,
        is_ticket: isTicket,
        is_vip: isVIP,
        event_id: eventId,
        event_name: eventName,
        event_date: eventDate,
        metadata: item.metadata
      }
    })

    const shippingCost = body.shipping_cost || 0
    
    // Get discount from cookie
    const discountCookie = cookieStore.get('cart_discount')?.value
    let discountAmount = 0
    let discountInfo = null
    
    if (discountCookie) {
      try {
        const discount = JSON.parse(discountCookie)
        discountInfo = discount
        
        if (discount.type === 'discount') {
          let discountPercent = 0
          if (typeof discount.value === 'object' && discount.value?.discount_percent) {
            discountPercent = discount.value.discount_percent
          } else if (typeof discount.value === 'number') {
            discountPercent = discount.value
          }
          
          if (discountPercent > 0) {
            discountAmount = (subtotal * discountPercent) / 100
          }
        } else if (discount.type === 'free_ticket') {
          const tickets = orderItems.filter((item: any) => item.is_ticket)
          if (tickets.length > 0) {
            const cheapestTicket = tickets.reduce((min: any, item: any) => 
              item.price < min.price ? item : min
            )
            discountAmount = cheapestTicket.price * cheapestTicket.quantity
          }
        }
      } catch {
        // Invalid discount
      }
    }
    
    const total = Math.max(0, subtotal + shippingCost - discountAmount)

    // Generate unique order number with timestamp to avoid SumUp duplicate reference errors
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase()
    const { data: orderCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', `${year}-01-01`)
    
    const sequence = (orderCount?.length || 0) + 1
    const orderNumber = `KINKER-${year}-${String(sequence).padStart(4, '0')}-${timestamp}`

    // Get merchant info for pay_to_email
    const merchantRes = await fetch('https://api.sumup.com/v0.1/me', {
      headers: { 'Authorization': `Bearer ${sumupApiKey}` }
    })
    
    let payToEmail = body.email
    if (merchantRes.ok) {
      const merchantData = await merchantRes.json()
      payToEmail = merchantData.merchant_profile?.doing_business_as?.email || 
                   merchantData.account?.username || 
                   body.email
    }

    // Create SumUp checkout (amount as DECIMAL!)
    const sumupCheckout = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sumupApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkout_reference: orderNumber,
        amount: Number(total.toFixed(2)), // SumUp v0.1 expects decimal (e.g. 1.00), not cents!
        currency: 'CHF',
        pay_to_email: payToEmail,
        description: `Order ${orderNumber} - KINKER Basel`,
        merchant_code: sumupMerchantCode,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://knkr.ch'}/checkout/pending?order=${orderNumber}`
      })
    })

    if (!sumupCheckout.ok) {
      const errorText = await sumupCheckout.text()
      console.error('SumUp checkout error:', errorText)
      let errorMessage = 'Payment provider error'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error_code || errorText
      } catch {
        errorMessage = errorText
      }
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    const sumupData = await sumupCheckout.json()

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_email: body.email,
        customer_name: body.name,
        customer_phone: body.phone || null,
        shipping_address: body.shipping_address || null,
        billing_address: body.billing_address || null,
        payment_method: 'sumup',
        payment_status: 'pending',
        payment_reference: sumupData.id,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        discount_code: discountInfo?.code || null,
        total: total,
        status: 'pending'
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

    // Create tickets for event tickets and update VIP bookings
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
              holder_name: body.name,
              holder_email: body.email,
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
      
      // Update VIP booking status to approved
      if (item.vip_booking_id) {
        await supabase
          .from('vip_bookings')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.vip_booking_id)
      }
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('session_id', sessionId)

    // Mark redemption as used if discount was applied
    if (discountInfo?.redemption_id) {
      try {
        await supabase
          .from('reward_redemptions')
          .update({
            status: 'used',
            used_at: new Date().toISOString()
          })
          .eq('id', discountInfo.redemption_id)
        
        cookieStore.delete('cart_discount')
      } catch (error) {
        console.error('Error marking redemption as used:', error)
      }
    }

    return NextResponse.json({
      success: true,
      order,
      items: createdItems,
      tickets,
      sumup: {
        checkout_id: sumupData.id,
        checkout_url: sumupData.checkout_url
      }
    })
  } catch (error: any) {
    console.error('Checkout exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
