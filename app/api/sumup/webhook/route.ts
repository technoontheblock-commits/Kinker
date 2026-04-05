import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// SumUp Webhook Handler
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    console.log('SumUp Webhook received:', payload)

    // Verify webhook signature (optional but recommended)
    // In production, verify the signature using SumUp's secret

    const { event_type, checkout } = payload

    if (!checkout || !checkout.checkout_reference) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const orderNumber = checkout.checkout_reference

    // Handle different event types
    switch (event_type) {
      case 'checkout.paid':
        // Payment successful
        await handleSuccessfulPayment(supabase, orderNumber, checkout)
        break

      case 'checkout.failed':
        // Payment failed
        await handleFailedPayment(supabase, orderNumber, checkout)
        break

      case 'checkout.pending':
        // Payment pending (not used often)
        console.log(`Payment pending for order ${orderNumber}`)
        break

      default:
        console.log(`Unhandled event type: ${event_type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleSuccessfulPayment(supabase: any, orderNumber: string, checkout: any) {
  try {
    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
        payment_reference: checkout.id
      })
      .eq('order_number', orderNumber)
      .select()
      .single()

    if (orderError) {
      console.error('Error updating order:', orderError)
      return
    }

    // Update tickets to paid
    await supabase
      .from('tickets')
      .update({ payment_status: 'paid' })
      .eq('order_id', order.id)

    // Get order items for email
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    // Get tickets
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('order_id', order.id)

    // Send confirmation email
    if (resend && order.customer_email) {
      try {
        await sendOrderConfirmationEmail(order, items, tickets)
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
      }
    }

    console.log(`Order ${orderNumber} marked as paid`)

  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

async function handleFailedPayment(supabase: any, orderNumber: string, checkout: any) {
  try {
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        status: 'cancelled',
        payment_reference: checkout.id
      })
      .eq('order_number', orderNumber)

    console.log(`Order ${orderNumber} marked as failed`)

  } catch (error) {
      console.error('Error handling failed payment:', error)
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
