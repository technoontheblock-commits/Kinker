import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resendApiKey = process.env.RESEND_API_KEY
const DUMMY_EMAIL = 'technoontheblock@gmail.com'
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
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email,
        subject: 'Welcome to KINKER Basel Newsletter',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to KINKER</title>
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
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="font-size: 24px; margin: 0 0 20px; color: #ffffff; font-weight: 700;">
                          Welcome to the Underground
                        </h2>
                        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #D1D5DB;">
                          Thanks for subscribing to the KINKER Basel newsletter. You'll be the first to know about:
                        </p>
                        <ul style="font-size: 16px; line-height: 1.8; margin: 0 0 24px; padding-left: 24px; color: #D1D5DB;">
                          <li>New events and lineups</li>
                          <li>Ticket sales announcements</li>
                          <li>Special offers</li>
                          <li>Behind the scenes content</li>
                        </ul>
                        <div style="background: linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05)); border: 1px solid rgba(255, 77, 0, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                          <p style="margin: 0; font-size: 16px; color: #FF4D00; font-weight: 600;">
                            No racism. No hate. Just music.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
                        <p style="margin: 0 0 8px; color: #6B7280; font-size: 14px;">
                          KINKER Basel • Steinenvorstadt 11 • 4051 Basel
                        </p>
                        <p style="margin: 0;">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #FF4D00; text-decoration: none; font-weight: 600;">knkr.ch</a>
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
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
