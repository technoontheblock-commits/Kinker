import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { wrapEmail } from '@/lib/email-layout'

const resendApiKey = process.env.RESEND_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase not configured')
    return NextResponse.json(
      { error: 'Datenbank nicht konfiguriert' },
      { status: 503 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'Du bist bereits angemeldet!' },
        { status: 200 }
      )
    }

    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, confirmed: true } as any)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Anmeldung fehlgeschlagen' },
        { status: 500 }
      )
    }

    if (resendApiKey) {
      const resend = new Resend(resendApiKey)

      const contentHtml = `
        <tr>
          <td style="padding: 40px 32px; text-align: center;">
            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
              Willkommen im Underground
            </h2>
            <p style="margin: 0 0 24px; font-size: 15px; color: #666666; line-height: 1.6; font-family: sans-serif;">
              Danke für deine Anmeldung zum KINKER Newsletter. Du erfährst als Erstes von:
            </p>
            <ul style="font-size: 15px; line-height: 1.8; margin: 0 0 24px; padding-left: 24px; color: #555555; text-align: left; font-family: sans-serif;">
              <li>Neuen Events und Lineups</li>
              <li>Ticketverkaufs-Ankündigungen</li>
              <li>Spezialangeboten</li>
              <li>Behind-the-Scenes-Inhalten</li>
            </ul>
            <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 16px; color: #dc2626; font-weight: 600; font-family: sans-serif;">
                No racism. No hate. Just music.
              </p>
            </div>
          </td>
        </tr>`

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email,
        subject: 'Willkommen beim KINKER Newsletter',
        html: wrapEmail(contentHtml, 'Welcome to KINKER')
      })
    }

    return NextResponse.json(
      { message: 'Erfolgreich angemeldet! Willkommens-E-Mail wurde gesendet.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
