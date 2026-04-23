import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { wrapEmail } from '@/lib/email-layout'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email')
      return NextResponse.json({ success: true, warning: 'Email service not configured' })
    }

    const resend = new Resend(apiKey)
    const body = await request.json()

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

    const subtotal = items.reduce((sum: number, item: any) =>
      sum + ((item.price || item.unit_price || 0) * (item.quantity || 1)), 0
    )

    const discountAmount = discount?.value || 0
    const finalTotal = total || subtotal - discountAmount

    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
          <div style="font-weight: 600; color: #111111;">${item.name || item.product_name}</div>
          ${item.variant ? `<div style="font-size: 13px; color: #666666;">${item.variant}</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center; color: #666666;">
          ${item.quantity || 1}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right; color: #111111;">
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

    const contentHtml = `
      <tr>
        <td style="padding: 40px 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #ffffff;">
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
                <td colspan="2" style="padding: 12px; text-align: right; color: #666666; font-family: sans-serif;">
                  Zwischensumme
                </td>
                <td style="padding: 12px; text-align: right; color: #111111; font-family: sans-serif;">
                  CHF ${subtotal.toFixed(2)}
                </td>
              </tr>
              ${discountHtml}
              <tr style="background-color: #dc2626;">
                <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 16px; font-family: sans-serif;">
                  GESAMT
                </td>
                <td style="padding: 16px 12px; text-align: right; font-weight: 700; color: #ffffff; font-size: 18px; font-family: sans-serif;">
                  CHF ${finalTotal.toFixed(2)}
                </td>
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order confirmation email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
