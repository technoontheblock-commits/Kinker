import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email')
      return NextResponse.json({ success: true, warning: 'Email service not configured' })
    }
    
    const resend = new Resend(apiKey)
    const body = await request.json()
    
    // Support both formats:
    // 1. Direct call: { to, orderNumber, items, total, discount }
    // 2. From checkout: { order, items, tickets }
    
    const to = body.to || body.order?.customer_email
    const orderNumber = body.orderNumber || body.order?.order_number
    const items = body.items || []
    const total = body.total || body.order?.total_amount
    const discount = body.discount || null

    if (!to || !orderNumber || !items.length) {
      return NextResponse.json(
        { error: 'Missing required fields: to, orderNumber, items' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + ((item.price || item.unit_price || 0) * (item.quantity || 1)), 0
    )

    const discountAmount = discount?.value || 0
    const finalTotal = total || subtotal - discountAmount

    // Format items HTML
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #333;">
          <div style="font-weight: 600; color: #ffffff;">${item.name || item.product_name}</div>
          ${item.variant ? `<div style="font-size: 13px; color: #9CA3AF;">${item.variant}</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center; color: #9CA3AF;">
          ${item.quantity || 1}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right; color: #ffffff;">
          CHF ${((item.price || item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
        </td>
      </tr>
    `).join('')

    const discountHtml = discount ? `
      <tr>
        <td colspan="2" style="padding: 12px; text-align: right; color: #10B981;">
          ${discount.name} (${discount.code})
        </td>
        <td style="padding: 12px; text-align: right; color: #10B981;">
          -CHF ${discountAmount.toFixed(2)}
        </td>
      </tr>
    ` : ''

    const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px 20px; text-align: center; border-bottom: 2px solid #FF4D00;">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #FF4D00; letter-spacing: 2px;">KINKER</h1>
                  <p style="margin: 8px 0 0; font-size: 14px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 4px;">BASEL</p>
                </td>
              </tr>
              
              <!-- Success Message -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                    ✓
                  </div>
                  <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #ffffff;">
                    Bestellung bestätigt!
                  </h2>
                  <p style="margin: 0 0 8px; font-size: 16px; color: #9CA3AF;">
                    Vielen Dank für deine Bestellung bei KINKER Basel.
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #6B7280;">
                    Bestellnummer: <span style="color: #FF4D00; font-family: monospace; font-weight: 600;">${orderNumber}</span>
                  </p>
                </td>
              </tr>
              
              <!-- Order Details -->
              <tr>
                <td style="padding: 0 30px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #262626;">
                        <th style="padding: 16px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;">Artikel</th>
                        <th style="padding: 16px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;">Menge</th>
                        <th style="padding: 16px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #9CA3AF; font-weight: 600; letter-spacing: 1px;">Preis</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      <tr style="border-top: 2px solid #333;">
                        <td colspan="2" style="padding: 12px; text-align: right; color: #9CA3AF;">
                          Zwischensumme
                        </td>
                        <td style="padding: 12px; text-align: right; color: #ffffff;">
                          CHF ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                      ${discountHtml}
                      <tr style="background-color: #FF4D00;">
                        <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 16px;">
                          GESAMT
                        </td>
                        <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 18px;">
                          CHF ${finalTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              
              <!-- Important Info -->
              <tr>
                <td style="padding: 0 30px 40px;">
                  <div style="background: linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05)); border: 1px solid rgba(255, 77, 0, 0.3); border-radius: 12px; padding: 24px;">
                    <h3 style="margin: 0 0 16px; font-size: 16px; color: #FF4D00; font-weight: 600;">
                      Wichtige Informationen
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #D1D5DB; font-size: 14px; line-height: 1.8;">
                      <li>Bitte bringe einen gültigen Ausweis mit</li>
                      <li>Deine Tickets sind übertragbar</li>
                      <li>Der Einlass erfolgt ab 23:00 Uhr</li>
                      <li>Bei Fragen: support@knkr.ch</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
                  <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280;">
                    Du hast Fragen zu deiner Bestellung?<br>
                    <a href="mailto:support@knkr.ch" style="color: #FF4D00; text-decoration: none;">support@knkr.ch</a>
                  </p>
                  <div style="margin: 24px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/shop" style="display: inline-block; padding: 12px 24px; background-color: #FF4D00; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Zum Shop</a>
                  </div>
                  <p style="margin: 16px 0 0; font-size: 12px; color: #4B5563;">
                    KINKER Basel • Steinenvorstadt 11 • 4051 Basel
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject: `Deine Bestellbestätigung - ${orderNumber}`,
      html
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order confirmation email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
