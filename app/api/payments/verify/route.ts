import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const sumupApiKey = process.env.SUMUP_API_KEY
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Helper function to generate QR code URL
function generateQRCode(ticketId: string, secret: string): string {
  const data = `${ticketId}:${secret}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`
}

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, checkoutId } = await request.json()

    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify payment with SumUp if checkoutId is provided
    let paymentVerified = false
    let sumupStatus = 'unknown'
    
    if (checkoutId && sumupApiKey) {
      try {
        const sumupRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
          headers: {
            'Authorization': `Bearer ${sumupApiKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (sumupRes.ok) {
          const sumupData = await sumupRes.json()
          console.log('SumUp checkout status:', sumupData.status)
          sumupStatus = sumupData.status
          
          // Check if payment was successful
          const successStatuses = ['PAID', 'SUCCESS', 'COMPLETED', 'CAPTURED']
          if (successStatuses.includes(sumupData.status)) {
            paymentVerified = true
          }
        }
      } catch (err) {
        console.error('Error verifying with SumUp:', err)
      }
    }

    // If payment not verified via API, check if it was already marked as paid
    if (!paymentVerified && order.payment_status === 'paid') {
      paymentVerified = true
    }

    if (!paymentVerified) {
      // Payment failed or not verified
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          status: 'cancelled'
        })
        .eq('id', order.id)
      
      return NextResponse.json({ 
        error: 'Payment not verified', 
        status: sumupStatus,
        verified: false 
      }, { status: 400 })
    }

    // Payment verified - update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Get order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    // Create tickets for event tickets (only after successful payment)
    const tickets = []
    for (const item of items || []) {
      if (item.is_ticket && item.event_ticket_id) {
        // Check if tickets already exist
        const { data: existingTickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('order_item_id', item.id)
        
        if (existingTickets && existingTickets.length > 0) {
          // Update existing tickets to paid
          await supabase
            .from('tickets')
            .update({ payment_status: 'paid' })
            .eq('order_item_id', item.id)
          tickets.push(...existingTickets)
        } else {
          // Create new tickets
          for (let i = 0; i < item.quantity; i++) {
            const ticketSecret = randomUUID().replace(/-/g, '').substring(0, 16)
            const { data: ticket } = await supabase
              .from('tickets')
              .insert([{
                order_id: order.id,
                order_item_id: item.id,
                event_id: item.event_id,
                event_ticket_id: item.event_ticket_id,
                ticket_number: `${order.order_number}-T${String(i + 1).padStart(2, '0')}`,
                qr_code: generateQRCode(randomUUID(), ticketSecret),
                qr_secret: ticketSecret,
                holder_name: order.customer_name,
                holder_email: order.customer_email,
                payment_status: 'paid'
              }])
              .select()
              .single()
            
            if (ticket) tickets.push(ticket)
          }
        }
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

    // Send confirmation email
    if (resend && order.customer_email) {
      try {
        await sendOrderConfirmationEmail(order, items || [], tickets || [])
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      order: {
        ...order,
        payment_status: 'paid'
      }
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendOrderConfirmationEmail(order: any, items: any[], tickets: any[]) {
  if (!resend) return

  const orderNumber = order.order_number
  const to = order.customer_email
  
  const itemsHtml = items?.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #333;">
        <div style="font-weight: 600; color: #ffffff;">${item.name}</div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center; color: #9CA3AF;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right; color: #ffffff;">CHF ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('') || ''

  const ticketsHtml = tickets?.length > 0 ? `
    <div style="background: linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05)); border: 1px solid rgba(255, 77, 0, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 16px; font-size: 16px; color: #FF4D00; font-weight: 600;">Deine Tickets</h3>
      ${tickets.map((ticket: any) => `
        <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
          <p style="margin: 0 0 4px; color: #ffffff; font-weight: 600;">${ticket.ticket_number}</p>
          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">QR: ${ticket.qr_code}</p>
        </div>
      `).join('')}
    </div>
  ` : ''

  const html = `
  <!DOCTYPE html>
  <html lang="de">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Zahlung bestätigt</title></head>
  <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center; border-bottom: 2px solid #FF4D00;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #FF4D00; letter-spacing: 2px;">KINKER</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 4px;">BASEL</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 64px; font-size: 32px; color: white;">✓</div>
              <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #ffffff;">Zahlung erfolgreich!</h2>
              <p style="margin: 0 0 8px; font-size: 16px; color: #9CA3AF;">Vielen Dank für deine Bestellung bei KINKER Basel.</p>
              <p style="margin: 0; font-size: 14px; color: #6B7280;">Bestellnummer: <span style="color: #FF4D00; font-family: monospace; font-weight: 600;">${orderNumber}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                <thead><tr style="background-color: #262626;">
                  <th style="padding: 16px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;">Artikel</th>
                  <th style="padding: 16px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;">Menge</th>
                  <th style="padding: 16px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;">Preis</th>
                </tr></thead>
                <tbody>${itemsHtml}
                  <tr style="background-color: #FF4D00;">
                    <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 16px;">GESAMT</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 18px;">CHF ${order.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 0 30px 40px;">${ticketsHtml}</td></tr>
          <tr>
            <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
              <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280;">Du hast Fragen?<br><a href="mailto:support@knkr.ch" style="color: #FF4D00; text-decoration: none;">support@knkr.ch</a></p>
              <p style="margin: 16px 0 0; font-size: 12px; color: #4B5563;">KINKER Basel • Steinenvorstadt 11 • 4051 Basel</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to,
    subject: `Zahlung bestätigt - ${orderNumber}`,
    html
  })
}
