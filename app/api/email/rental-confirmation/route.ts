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
    const { to, name, eventType, eventDate, guests, rooms, inquiryId } = await request.json()

    const roomsList = Array.isArray(rooms) ? rooms.join(', ') : rooms

    const contentHtml = `
      <tr>
        <td style="padding: 40px 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #ffffff;">
            ✓
          </div>
          <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
            Raumanfrage eingegangen!
          </h2>
          <p style="margin: 0; font-size: 15px; color: #666666; font-family: sans-serif;">
            Vielen Dank für deine Anfrage bei KINKER.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
            <tr style="background-color: #f5f5f5;">
              <td colspan="2" style="padding: 16px; text-align: center;">
                <span style="font-size: 12px; text-transform: uppercase; color: #666666; letter-spacing: 1px; font-family: sans-serif; font-weight: 600;">Anfragedetails</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Anfrage-ID</td>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #dc2626; font-family: monospace; font-weight: 600; text-align: right; font-size: 14px;">
                #${inquiryId?.slice(-8).toUpperCase() || 'N/A'}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Anlass</td>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; font-weight: 600; text-align: right; font-size: 14px; font-family: sans-serif;">
                ${eventType}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Datum</td>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">
                ${new Date(eventDate).toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Gästeanzahl</td>
              <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">
                ${guests} Personen
              </td>
            </tr>
            <tr>
              <td style="padding: 16px; color: #666666; font-size: 14px; font-family: sans-serif;">Gewünschte Räume</td>
              <td style="padding: 16px; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">
                ${roomsList}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px 32px;">
          <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px;">
            <h3 style="margin: 0 0 16px; font-size: 16px; color: #dc2626; font-weight: 600; font-family: sans-serif;">
              Was passiert als Nächstes?
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8; font-family: sans-serif;">
              <li>Wir prüfen die Verfügbarkeit für dein gewünschtes Datum</li>
              <li>Du erhältst innerhalb von 2-3 Werktagen eine Rückmeldung</li>
              <li>Bei Verfügbarkeit senden wir dir ein Angebot</li>
              <li>Fragen? Schreibe uns: <a href="mailto:events@knkr.ch" style="color: #dc2626; text-decoration: none;">events@knkr.ch</a></li>
            </ul>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px 32px;">
          <div style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px;">
            <p style="margin: 0; font-size: 14px; color: #666666; text-align: center; font-family: sans-serif;">
              <span style="color: #dc2626; font-weight: 600;">Hinweis:</span> Diese Anfrage ist unverbindlich. Eine Buchung wird erst nach Bestätigung und Anzahlung gültig.
            </p>
          </div>
        </td>
      </tr>`

    const html = wrapEmail(contentHtml, 'Raumanfrage bestätigt')

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject: `Raumanfrage bestätigt - ${eventType}`,
      html
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rental confirmation email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
