import { Resend } from 'resend'
import { wrapEmail } from './email-layout'

export interface BarReceiptEmailData {
  to: string
  customerName: string
  orderNumber: string
  items: { name: string; price: number; quantity: number; total: number }[]
  subtotal: number
  tip: number
  total: number
  remainingBalance: number
  currency?: string
}

export async function sendBarReceiptEmail(data: BarReceiptEmailData): Promise<{ success: boolean; warning?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY nicht konfiguriert, Bar-Beleg-E-Mail wird übersprungen')
    return { success: true, warning: 'E-Mail-Service nicht konfiguriert' }
  }

  const resend = new Resend(apiKey)
  const currency = data.currency || 'CHF'

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; color: #111111;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: center; color: #666666;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right; color: #111111;">${currency} ${item.total.toFixed(2)}</td>
    </tr>
  `).join('')

  const tipHtml = data.tip > 0 ? `
    <tr>
      <td colspan="2" style="padding: 10px; text-align: right; color: #666666;">Trinkgeld</td>
      <td style="padding: 10px; text-align: right; color: #111111;">${currency} ${data.tip.toFixed(2)}</td>
    </tr>
  ` : ''

  const contentHtml = `
    <tr>
      <td style="padding: 40px 32px; text-align: center;">
        <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
          Dein Bar-Beleg
        </h2>
        <p style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: sans-serif;">
          Hallo ${data.customerName},
        </p>
        <p style="margin: 0; font-size: 14px; color: #888888; font-family: sans-serif;">
          Vielen Dank für deinen Besuch. Hier ist dein Beleg für die Bar-Zahlung.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 16px;">
        <p style="margin: 0 0 24px; font-size: 14px; color: #888888; font-family: sans-serif; text-align: center;">
          Bestellnummer: <span style="color: #dc2626; font-family: monospace; font-weight: 600;">${data.orderNumber}</span>
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 14px 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 1px; font-family: sans-serif;">Artikel</th>
              <th style="padding: 14px 10px; text-align: center; font-size: 12px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 1px; font-family: sans-serif;">Menge</th>
              <th style="padding: 14px 10px; text-align: right; font-size: 12px; text-transform: uppercase; color: #666666; font-weight: 600; letter-spacing: 1px; font-family: sans-serif;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="border-top: 2px solid #e5e5e5;">
              <td colspan="2" style="padding: 10px; text-align: right; color: #666666; font-family: sans-serif;">Zwischensumme</td>
              <td style="padding: 10px; text-align: right; color: #111111; font-family: sans-serif;">${currency} ${data.subtotal.toFixed(2)}</td>
            </tr>
            ${tipHtml}
            <tr style="background-color: #dc2626;">
              <td colspan="2" style="padding: 14px 10px; text-align: right; font-weight: 700; color: #ffffff; font-size: 16px; font-family: sans-serif;">BEZAHLT</td>
              <td style="padding: 14px 10px; text-align: right; font-weight: 700; color: #ffffff; font-size: 18px; font-family: sans-serif;">${currency} ${data.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 32px;">
        <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-family: sans-serif;">Restguthaben auf deinem Wallet</p>
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #10B981; font-family: sans-serif;">${currency} ${data.remainingBalance.toFixed(2)}</p>
        </div>
      </td>
    </tr>
  `

  const html = wrapEmail(contentHtml, 'Dein Bar-Beleg')

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: data.to,
    subject: `Dein Bar-Beleg - ${data.orderNumber}`,
    html,
  })

  return { success: true }
}
