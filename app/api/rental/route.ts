import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// GET /api/rental - Get all rental inquiries
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('rental_inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET rental inquiries error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET rental inquiries exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/rental - Create new rental inquiry
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('rental_inquiries')
      .insert([{
        name: body.name,
        email: body.email,
        phone: body.phone,
        event_type: body.eventType,
        event_date: body.date,
        guests: parseInt(body.guests) || 0,
        rooms: body.rooms,
        extras: body.extras,
        message: body.message,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('POST rental inquiry error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for admin
    await supabase.from('notifications').insert([{
      type: 'booking',
      title: 'Neue Raumanfrage',
      message: `Neue Anfrage für ${body.rooms?.join(', ') || 'Räume'} am ${body.date}`,
      read: false
    }])

    // Send confirmation email directly via Resend
    if (resend) {
      try {
        const roomsList = Array.isArray(body.rooms) ? body.rooms.join(', ') : body.rooms
        const eventDate = new Date(body.date).toLocaleDateString('de-CH', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })

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
                  <tr>
                    <td style="padding: 40px 30px 20px; text-align: center; border-bottom: 2px solid #FF4D00;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #FF4D00; letter-spacing: 2px;">KINKER</h1>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 4px;">BASEL</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 64px; font-size: 32px; color: white;">✓</div>
                      <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #ffffff;">Raumanfrage eingegangen!</h2>
                      <p style="margin: 0; font-size: 16px; color: #9CA3AF;">Vielen Dank für deine Anfrage bei KINKER Basel.</p>
                    </td>
                  </tr>
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
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #FF4D00; font-family: monospace; font-weight: 600; text-align: right;">#${data.id.slice(-8).toUpperCase()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Anlass</td>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; font-weight: 600; text-align: right;">${body.eventType}</td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Datum</td>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; text-align: right;">${eventDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Gästeanzahl</td>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; text-align: right;">${body.guests} Personen</td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; color: #9CA3AF; font-size: 14px;">Gewünschte Räume</td>
                          <td style="padding: 16px; color: #ffffff; text-align: right;">${roomsList}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 30px 40px;">
                      <div style="background: linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05)); border: 1px solid rgba(255, 77, 0, 0.3); border-radius: 12px; padding: 24px;">
                        <h3 style="margin: 0 0 16px; font-size: 16px; color: #FF4D00; font-weight: 600;">Was passiert als Nächstes?</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #D1D5DB; font-size: 14px; line-height: 1.8;">
                          <li>Wir prüfen die Verfügbarkeit für dein gewünschtes Datum</li>
                          <li>Du erhältst innerhalb von 2-3 Werktagen eine Rückmeldung</li>
                          <li>Bei Verfügbarkeit senden wir dir ein Angebot</li>
                          <li>Fragen? Schreibe uns: events@kinker.ch</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 30px 40px;">
                      <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px;">
                        <p style="margin: 0; font-size: 14px; color: #9CA3AF; text-align: center;"><span style="color: #FF4D00; font-weight: 600;">Hinweis:</span> Diese Anfrage ist unverbindlich. Eine Buchung wird erst nach Bestätigung und Anzahlung gültig.</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
                      <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280;">Du hast Fragen zu deiner Anfrage?<br><a href="mailto:events@kinker.ch" style="color: #FF4D00; text-decoration: none;">events@kinker.ch</a></p>
                      <p style="margin: 16px 0 0; font-size: 12px; color: #4B5563;">KINKER Basel • Steinenvorstadt 11 • 4051 Basel</p>
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
          to: body.email,
          subject: `Raumanfrage bestätigt - ${body.eventType}`,
          html
        })
      } catch (emailError) {
        console.error('Failed to send rental confirmation email:', emailError)
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST rental inquiry exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
