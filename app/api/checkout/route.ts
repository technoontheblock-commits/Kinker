import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-layout'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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

        console.log('Points to add:', pointsToAdd, 'for order:', orderNumber)

        if (pointsToAdd > 0) {
          // Get current rewards
          const { data: userRewards, error: rewardsError } = await supabase
            .from('user_rewards')
            .select('points, lifetime_points, tier')
            .eq('user_id', user.id)
            .single()
          
          console.log('Current rewards:', userRewards, 'Error:', rewardsError)

          // Apply tier multiplier
          let multiplier = 1
          if (userRewards?.tier === 'Silver') multiplier = 1.2
          if (userRewards?.tier === 'Gold') multiplier = 1.5
          if (userRewards?.tier === 'Platinum') multiplier = 2

          const finalPoints = Math.floor(pointsToAdd * multiplier)
          
          console.log('Final points with multiplier:', finalPoints)

          if (userRewards) {
            const newPoints = userRewards.points + finalPoints
            const newLifetime = userRewards.lifetime_points + finalPoints
            
            console.log('Updating rewards:', { newPoints, newLifetime })
            
            // Update existing rewards
            const { error: updateError } = await supabase
              .from('user_rewards')
              .update({
                points: newPoints,
                lifetime_points: newLifetime,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              
            if (updateError) {
              console.error('Error updating rewards:', updateError)
            }
          } else {
            console.log('Creating new rewards record with:', finalPoints)
            // Create new rewards record
            const { error: insertError } = await supabase
              .from('user_rewards')
              .insert({
                user_id: user.id,
                points: finalPoints,
                lifetime_points: finalPoints,
                tier: 'Bronze'
              })
              
            if (insertError) {
              console.error('Error creating rewards:', insertError)
            }
          }
          
          // Add to points history
          try {
            await supabase
              .from('points_history')
              .insert({
                user_id: user.id,
                points_change: finalPoints,
                reason: `Order ${orderNumber}`,
                reference_id: order.id,
                reference_type: 'order'
              })
          } catch (historyError) {
            console.log('Points history error (table may not exist):', historyError)
          }
        }
      }
    } catch (pointsError) {
      console.error('Error awarding points:', pointsError)
      // Don't fail the order if points fail
    }

    // Send confirmation email directly via Resend
    if (resend && order.customer_email) {
      try {
        const orderNumber = order.order_number
        const to = order.customer_email
        const items = createdItems || []
        const total = order.total_amount
        
        const subtotal = items.reduce((sum: number, item: any) => 
          sum + ((item.price || item.unit_price || 0) * (item.quantity || 1)), 0
        )

        const itemsHtml = items.map((item: any) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #333;">
              <div style="font-weight: 600; color: #ffffff;">${item.product_name || item.name}</div>
              ${item.variant ? `<div style="font-size: 13px; color: #9CA3AF;">${item.variant}</div>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center; color: #9CA3AF;">${item.quantity || 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right; color: #ffffff;">CHF ${((item.price || item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}</td>
          </tr>
        `).join('')

        const contentHtml = `
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 64px; font-size: 32px; color: #ffffff;">
                ✓
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
                Bestellung bestätigt!
              </h2>
              <p style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: sans-serif;">
                Vielen Dank für deine Bestellung bei KINKER.
              </p>
              <p style="margin: 0; font-size: 14px; color: #888888; font-family: sans-serif;">
                Bestellnummer: <span style="color: #dc2626; font-family: monospace; font-weight: 600;">${orderNumber}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 16px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 1px; font-family: sans-serif;">Artikel</th>
                    <th style="padding: 16px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 1px; font-family: sans-serif;">Menge</th>
                    <th style="padding: 16px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 1px; font-family: sans-serif;">Preis</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="border-top: 2px solid #e5e5e5;">
                    <td colspan="2" style="padding: 12px; text-align: right; color: #666666; font-family: sans-serif;">Zwischensumme</td>
                    <td style="padding: 12px; text-align: right; color: #111111; font-family: sans-serif;">CHF ${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr style="background-color: #dc2626;">
                    <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 16px; font-family: sans-serif;">GESAMT</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 18px; font-family: sans-serif;">CHF ${total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 16px; font-size: 16px; color: #dc2626; font-weight: 600; font-family: sans-serif;">
                  Wichtige Informationen
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8; font-family: sans-serif;">
                  <li>Bitte bringe einen gültigen Ausweis mit</li>
                  <li>Deine Tickets sind übertragbar</li>
                  <li>Der Einlass erfolgt ab 23:00 Uhr</li>
                  <li>Bei Fragen: <a href="mailto:support@kinker.ch" style="color: #dc2626; text-decoration: none;">support@kinker.ch</a></li>
                </ul>
              </div>
            </td>
          </tr>`

        const html = wrapEmail(contentHtml, 'Bestellbestätigung')

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to,
          subject: `Deine Bestellbestätigung - ${orderNumber}`,
          html
        })
      } catch (emailError) {
        console.error('Bestätigungs-E-Mail konnte nicht gesendet werden:', emailError)
      }
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
