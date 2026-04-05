import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const DUMMY_EMAIL = 'technoontheblock@gmail.com'

export async function POST(request: Request) {
  // Check if Resend is configured
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

    // Send email to club
    await resend.emails.send({
      from: 'onboarding@resend.dev',
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
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: DUMMY_EMAIL,
      subject: 'We received your message',
      html: `
        <div style="background: #000; color: #fff; font-family: system-ui, sans-serif; padding: 40px; max-width: 600px;">
          <h1 style="font-size: 32px; margin-bottom: 20px;">KINKER<span style="color: #ef4444;">.</span></h1>
          <h2 style="font-size: 24px; margin-bottom: 20px;">Thanks for reaching out!</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hi ${name},
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We've received your message and will get back to you as soon as possible.
          </p>
          <div style="background: #111; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">Your message:</p>
            <p style="margin: 10px 0 0 0; font-style: italic;">${subject}</p>
          </div>
          <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 30px;">
            <p style="font-size: 12px; color: #666;">
              KINKER Basel | Barcelona-Strasse 4, 4142 Münchenstein<br>
              <a href="https://knkr.ch" style="color: #ef4444;">knkr.ch</a>
            </p>
          </div>
        </div>
      `,
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
