import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const toEmail = body.email || 'technoontheblock@gmail.com'
    
    // Removed API key logging for security

    if (!resendApiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    const resend = new Resend(resendApiKey)

    const { data, error } = await resend.emails.send({
      from: `KINKER Basel <${fromEmail}>`,
      to: toEmail,
      subject: 'Test Email from KINKER',
      html: '<h1>Test</h1><p>This is a test email.</p>'
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Email sent:', data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
