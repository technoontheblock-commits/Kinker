import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-layout'

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

        const contentHtml = `
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 64px; font-size: 32px; color: #ffffff;">
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
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #dc2626; font-family: monospace; font-weight: 600; text-align: right; font-size: 14px;">#${data.id.slice(-8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Anlass</td>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; font-weight: 600; text-align: right; font-size: 14px; font-family: sans-serif;">${body.eventType}</td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Datum</td>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Gästeanzahl</td>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">${body.guests} Personen</td>
                </tr>
                <tr>
                  <td style="padding: 16px; color: #666666; font-size: 14px; font-family: sans-serif;">Gewünschte Räume</td>
                  <td style="padding: 16px; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">${roomsList}</td>
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
