import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-layout'

const resendApiKey = process.env.RESEND_API_KEY
const DUMMY_EMAIL = 'technoontheblock@gmail.com'

export async function POST(request: Request) {
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    return NextResponse.json(
      { error: 'E-Mail-Service nicht konfiguriert' },
      { status: 503 }
    )
  }

  const resend = new Resend(resendApiKey)

  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      )
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      )
    }

    // Send email to club (simple internal notification)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: DUMMY_EMAIL,
      subject: `Kontaktformular: ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family: system-ui, sans-serif; padding: 20px;">
          <h2 style="font-size: 24px; margin-bottom: 20px;">Neue Kontaktanfrage</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">E-Mail:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Betreff:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; vertical-align: top;">Nachricht:</td>
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
            Danke für deine Nachricht!
          </h2>
          <p style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: sans-serif;">
            Hallo <strong style="color: #111111;">${name}</strong>,
          </p>
          <p style="margin: 0 0 32px; font-size: 15px; color: #666666; line-height: 1.5; font-family: sans-serif;">
            Wir haben deine Nachricht erhalten und melden uns so schnell wie möglich bei dir.
          </p>
          <div style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px;">
            <p style="margin: 0 0 8px; color: #888888; font-size: 13px; font-family: sans-serif;">Deine Nachricht:</p>
            <p style="margin: 0; font-size: 15px; color: #111111; font-style: italic; font-family: sans-serif;">${subject}</p>
          </div>
        </td>
      </tr>`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: DUMMY_EMAIL,
      subject: 'Wir haben deine Nachricht erhalten',
      html: wrapEmail(contentHtml, 'Message Received')
    })

    return NextResponse.json(
      { message: 'Nachricht erfolgreich gesendet!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Nachricht konnte nicht gesendet werden' },
      { status: 500 }
    )
  }
}
