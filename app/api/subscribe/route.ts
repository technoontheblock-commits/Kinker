import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resendApiKey = process.env.RESEND_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  // Check if services are configured
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

    // Check if email already exists
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

    // Add to Supabase
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

    // Send confirmation email if Resend is configured
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      
      await resend.emails.send({
        from: 'KINKER Basel <newsletter@kinker.ch>',
        to: email,
        subject: 'Welcome to KINKER Basel Newsletter',
        html: `
          <div style="background: #000; color: #fff; font-family: system-ui, sans-serif; padding: 40px; max-width: 600px;">
            <h1 style="font-size: 32px; margin-bottom: 20px;">KINKER<span style="color: #ef4444;">.</span></h1>
            <h2 style="font-size: 24px; margin-bottom: 20px;">Welcome to the Underground</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thanks for subscribing to the KINKER Basel newsletter. You'll be the first to know about:
            </p>
            <ul style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              <li>New events and lineups</li>
              <li>Ticket sales announcements</li>
              <li>Special offers</li>
              <li>Behind the scenes content</li>
            </ul>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              No racism. No hate. Just music.
            </p>
            <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 30px;">
              <p style="font-size: 12px; color: #666;">
                KINKER Basel | Klybeckstrasse 99, 4057 Basel<br>
                <a href="https://kinker.ch" style="color: #ef4444;">kinker.ch</a>
              </p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json(
      { message: 'Successfully subscribed!' },
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
