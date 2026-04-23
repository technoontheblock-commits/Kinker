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
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
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
        { message: 'You are already subscribed!' },
        { status: 200 }
      )
    }

    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email, confirmed: true } as any)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      )
    }

    if (resendApiKey) {
      const resend = new Resend(resendApiKey)

      const contentHtml = `
        <tr>
          <td style="padding: 40px 32px; text-align: center;">
            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
              Welcome to the Underground
            </h2>
            <p style="margin: 0 0 24px; font-size: 15px; color: #666666; line-height: 1.6; font-family: sans-serif;">
              Thanks for subscribing to the KINKER newsletter. You'll be the first to know about:
            </p>
            <ul style="font-size: 15px; line-height: 1.8; margin: 0 0 24px; padding-left: 24px; color: #555555; text-align: left; font-family: sans-serif;">
              <li>New events and lineups</li>
              <li>Ticket sales announcements</li>
              <li>Special offers</li>
              <li>Behind the scenes content</li>
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
        subject: 'Welcome to KINKER Newsletter',
        html: wrapEmail(contentHtml, 'Welcome to KINKER')
      })
    }

    return NextResponse.json(
      { message: 'Successfully subscribed! Welcome email sent.' },
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
