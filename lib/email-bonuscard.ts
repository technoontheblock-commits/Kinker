import { wrapEmail } from './email-layout'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'

interface BonusCardEmailData {
  holderName: string
  cardNumber: string
  cardViewUrl: string
  paymentMethod: string
  paymentStatus: string
  qrCodeDataUrl?: string
  purchasePrice?: number
}

function getPaymentInstructions(method: string, cardNumber: string, purchasePrice: number): string {
  const priceChf = (purchasePrice / 100).toFixed(2)
  switch (method) {
    case 'twint':
      return `
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">
          Bitte überweise <strong>CHF ${priceChf}</strong> via TWINT an:<br>
          <span style="color: #dc2626; font-weight: 600;">+41 79 123 45 67</span>
        </p>
        <p style="margin: 0; font-size: 13px; color: #888888;">
          Verwendungszweck: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">${cardNumber}</code>
        </p>
      `
    case 'bank_transfer':
      return `
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">
          Bitte überweise <strong>CHF ${priceChf}</strong> auf folgendes Konto:
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #111111; font-family: monospace;">
          IBAN: CH93 0076 2011 6238 5295 7<br>
          BIC: BKBKCH22<br>
          Konto: KINKER GmbH
        </p>
        <p style="margin: 0; font-size: 13px; color: #888888;">
          Verwendungszweck: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${cardNumber}</code>
        </p>
      `
    case 'sepa':
      return `
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">
          Wir ziehen den Betrag von <strong>CHF ${priceChf}</strong> per SEPA-Lastschrift von deinem Konto ein.
        </p>
        <p style="margin: 0; font-size: 13px; color: #888888;">
          Verwendungszweck: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">${cardNumber}</code>
        </p>
      `
    case 'cash':
      return `
        <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">
          Bitte bezahle <strong>CHF ${priceChf}</strong> bar an der Abendkasse.
        </p>
        <p style="margin: 0; font-size: 13px; color: #888888;">
          Verwendungszweck: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">${cardNumber}</code>
        </p>
      `
    default:
      return ''
  }
}

export function generateBonusCardEmail(data: BonusCardEmailData): string {
  const paymentInstructions = getPaymentInstructions(data.paymentMethod, data.cardNumber, data.purchasePrice || 10000)
  const isPaid = data.paymentStatus === 'paid'
  const priceChf = ((data.purchasePrice || 10000) / 100).toFixed(2)
  const hasDiscount = false

  const contentHtml = `
    <tr>
      <td style="padding: 40px 32px; text-align: center;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #dc2626, #ef4444); border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 64px; font-size: 32px; color: #ffffff;">
          🎫
        </div>
        <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
          Deine Kinker Membership
        </h2>
        <p style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: sans-serif;">
          Vielen Dank für deinen Kauf, ${data.holderName}!
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #888888; font-family: sans-serif;">
          Kartennummer: <span style="color: #dc2626; font-family: monospace; font-weight: 600;">${data.cardNumber}</span>
        </p>
        ${hasDiscount ? `
        ` : `
        <p style="margin: 0; font-size: 14px; color: #888888; font-family: sans-serif;">
          Preis: <strong>CHF ${priceChf}</strong>
        </p>
        `}
      </td>
    </tr>
    
    <tr>
      <td style="padding: 0 32px 32px; text-align: center;">
        <p style="margin: 0 0 16px; font-size: 14px; color: #666666;">
          Deine digitale Karte findest du im Anhang als PDF.
        </p>
        <a href="${data.cardViewUrl}" 
           style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #dc2626, #ef4444); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; font-family: sans-serif;">
          Karte online anzeigen
        </a>
      </td>
    </tr>
    
    ${!isPaid ? `
    <tr>
      <td style="padding: 0 32px 32px;">
        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #92400e;">
            ⏳ Zahlung ausstehend
          </h3>
          ${paymentInstructions}
        </div>
      </td>
    </tr>
    ` : ''}
    
    <tr>
      <td style="padding: 0 32px 32px;">
        <div style="background: #fafafa; border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #111111;">
            Was bringt dir die Membership?
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666666; line-height: 1.8;">
            <li>Preisermässigung an der Abendkasse</li>
            <li>Exklusive Stammgast-Vorteile</li>
            <li>Digitale Karte mit QR-Code für den schnellen Einlass</li>
            <li>Gültig für alle regulären Clubnights</li>
          </ul>
        </div>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 0 32px 40px;">
        <p style="margin: 0; font-size: 13px; color: #888888; text-align: center; line-height: 1.6;">
          Bei Fragen erreichst du uns unter <a href="mailto:support@kinker.ch" style="color: #dc2626; text-decoration: none;">support@kinker.ch</a><br>
          Wir freuen uns auf dich im KINKER!
        </p>
      </td>
    </tr>
  `

  return wrapEmail(contentHtml, 'Deine Kinker Membership')
}
