import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-layout'

const resendApiKey = process.env.RESEND_API_KEY
const DUMMY_EMAIL = 'technoontheblock@gmail.com'

export async function POST(request: Request) {
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 }
    )
  }

  const resend = new Resend(resendApiKey)

  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Send email to club (simple internal notification)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: DUMMY_EMAIL,
      subject: `Contact Form: ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family: system-ui, sans-serif; padding: 20px;">
          <h2 style="font-size: 24px; margin-bottom: 20px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 10px; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
        </div>
      `,
    })

    // Send confirmation to user
    const contentHtml = `
      <tr>
        <td style="padding: 40px 32px; text-align: center;">
          <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
            Thanks for reaching out!
          </h2>
          <p style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: sans-serif;">
            Hi <strong style="color: #111111;">${name}</strong>,
          </p>
          <p style="margin: 0 0 32px; font-size: 15px; color: #666666; line-height: 1.5; font-family: sans-serif;">
            We've received your message and will get back to you as soon as possible.
          </p>
          <div style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px;">
            <p style="margin: 0 0 8px; color: #888888; font-size: 13px; font-family: sans-serif;">Your message:</p>
            <p style="margin: 0; font-size: 15px; color: #111111; font-style: italic; font-family: sans-serif;">${subject}</p>
          </div>
        </td>
      </tr>`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: DUMMY_EMAIL,
      subject: 'We received your message',
      html: wrapEmail(contentHtml, 'Message Received')
    })

    return NextResponse.json(
      { message: 'Message sent successfully!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
