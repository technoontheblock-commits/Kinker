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
    const { to, name, eventType, eventDate, guests, rooms, inquiryId } = await request.json()

    const roomsList = Array.isArray(rooms) ? rooms.join(', ') : rooms

    const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rental Anfrage bestätigt</title>
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
                    Raumanfrage eingegangen!
                  </h2>
                  <p style="margin: 0; font-size: 16px; color: #9CA3AF;">
                    Vielen Dank für deine Anfrage bei KINKER Basel.
                  </p>
                </td>
              </tr>
              
              <!-- Inquiry Details -->
              <tr>
                <td style="padding: 0 30px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                    <tr style="background-color: #262626;">
                      <td colspan="2" style="padding: 16px; text-align: center;">
                        <span style="font-size: 12px; text-transform: uppercase; color: #9CA3AF; letter-spacing: 1px;">Anfragedetails</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Anfrage-ID</td>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #FF4D00; font-family: monospace; font-weight: 600; text-align: right;">
                        #${inquiryId?.slice(-8).toUpperCase() || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Anlass</td>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; font-weight: 600; text-align: right;">
                        ${eventType}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Datum</td>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; text-align: right;">
                        ${new Date(eventDate).toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Gästeanzahl</td>
                      <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; text-align: right;">
                        ${guests} Personen
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px; color: #9CA3AF; font-size: 14px;">Gewünschte Räume</td>
                      <td style="padding: 16px; color: #ffffff; text-align: right;">
                        ${roomsList}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Next Steps -->
              <tr>
                <td style="padding: 0 30px 40px;">
                  <div style="background: linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05)); border: 1px solid rgba(255, 77, 0, 0.3); border-radius: 12px; padding: 24px;">
                    <h3 style="margin: 0 0 16px; font-size: 16px; color: #FF4D00; font-weight: 600;">
                      Was passiert als Nächstes?
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #D1D5DB; font-size: 14px; line-height: 1.8;">
                      <li>Wir prüfen die Verfügbarkeit für dein gewünschtes Datum</li>
                      <li>Du erhältst innerhalb von 2-3 Werktagen eine Rückmeldung</li>
                      <li>Bei Verfügbarkeit senden wir dir ein Angebot</li>
                      <li>Fragen? Schreibe uns: events@knkr.ch</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Info Box -->
              <tr>
                <td style="padding: 0 30px 40px;">
                  <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #9CA3AF; text-align: center;">
                      <span style="color: #FF4D00; font-weight: 600;">Hinweis:</span> Diese Anfrage ist unverbindlich. Eine Buchung wird erst nach Bestätigung und Anzahlung gültig.
                    </p>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
                  <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280;">
                    Du hast Fragen zu deiner Anfrage?<br>
                    <a href="mailto:events@knkr.ch" style="color: #FF4D00; text-decoration: none;">events@knkr.ch</a>
                  </p>
                  <div style="margin: 24px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/rental" style="display: inline-block; padding: 12px 24px; background-color: #FF4D00; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Rental Info</a>
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
