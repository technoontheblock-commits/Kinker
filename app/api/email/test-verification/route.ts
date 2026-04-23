import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/auth'
import { getLightFooter } from '@/lib/email-footer'

// POST /api/email/test-verification - Send test verification email
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Gültige E-Mail erforderlich' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY nicht konfiguriert' }, { status: 500 })
    }

    const resend = new Resend(apiKey)
    const testCode = Math.floor(100000 + Math.random() * 900000).toString()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Test Verifizierungscode - KINKER</title>
  <style>
    :root { color-scheme: light; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e5e5e5">
          <tr>
            <td style="padding:40px 32px 16px;text-align:center">
              <img src="${siteUrl}/images/logo.png" alt="KINKER" width="100" height="75" style="display:block;margin:0 auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px">
              <div style="height:2px;background:linear-gradient(90deg,transparent,#dc2626,transparent)"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 32px;text-align:center">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;font-family:sans-serif">Test Verifizierungscode</h2>
              <p style="margin:0 0 8px;font-size:15px;color:#666666;font-family:sans-serif">Dies ist eine <strong style="color:#dc2626">Test-E-Mail</strong> vom Developer Dashboard.</p>
              <p style="margin:0 0 32px;font-size:15px;color:#666666;line-height:1.5;font-family:sans-serif">Empfänger: <strong style="color:#111111">${email}</strong></p>
              <div style="background-color:#fafafa;border:2px solid #dc2626;border-radius:12px;padding:28px;margin-bottom:28px">
                <p style="margin:0;font-size:40px;font-weight:800;color:#dc2626;letter-spacing:10px;font-family:monospace">${testCode}</p>
              </div>
              <p style="margin:0;font-size:13px;color:#888888;font-family:sans-serif">Gültig für <strong style="color:#111111">30 Minuten</strong>.</p>
            </td>
          </tr>
          ${getLightFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: '[TEST] Verifizierungscode - KINKER',
      html
    })

    return NextResponse.json({ success: true, code: testCode })
  } catch (error: any) {
    console.error('Test verification email error:', error)
    return NextResponse.json({ error: error.message || 'Senden fehlgeschlagen' }, { status: 500 })
  }
}
