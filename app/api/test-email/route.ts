import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getLightFooter } from '@/lib/email-footer'

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
      html: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e5e5e5">
        <tr><td style="padding:40px 32px 16px;text-align:center">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#dc2626;letter-spacing:3px;font-family:sans-serif">KINKER</h1>
        </td></tr>
        <tr><td style="padding:0 32px"><div style="height:2px;background:linear-gradient(90deg,transparent,#dc2626,transparent)"></div></td></tr>
        <tr><td style="padding:40px 32px;text-align:center">
          <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111111;font-family:sans-serif">Test E-Mail</h2>
          <p style="margin:0;font-size:15px;color:#666666;line-height:1.5;font-family:sans-serif">Dies ist eine Test-E-Mail vom KINKER Email Test Dashboard.</p>
        </td></tr>
        ${getLightFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`
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
