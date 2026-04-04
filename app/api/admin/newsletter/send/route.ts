import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const fromName = process.env.RESEND_FROM_NAME || 'KINKER Basel'

function getCurrentUser() {
  const session = cookies().get('user_session')?.value
  if (!session) return null
  return JSON.parse(session)
}

// POST /api/admin/newsletter/send - Send newsletter to all subscribers
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const user = getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!resendApiKey) {
      return NextResponse.json({ error: 'Resend not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { subject, content, testOnly = false, testEmail } = body

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resend = new Resend(resendApiKey)

    let recipients: string[] = []

    if (testOnly && testEmail) {
      // Send only to test email
      recipients = [testEmail]
    } else {
      // Get all newsletter subscribers
      const { data: subscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('confirmed', true)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      recipients = subscribers?.map((s: any) => s.email) || []
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Send emails
    const results = []
    for (const email of recipients) {
      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: email,
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta name="color-scheme" content="dark">
              <meta name="supported-color-schemes" content="dark">
              <title>${subject}</title>
              <style>
                :root {
                  color-scheme: dark;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background-color: #000000 !important;
                  color: #ffffff !important;
                }
                .container {
                  background-color: #111111 !important;
                  border: 1px solid #333333 !important;
                }
                .header {
                  border-bottom: 1px solid #333333 !important;
                }
                .footer {
                  border-top: 1px solid #333333 !important;
                  color: #666666 !important;
                }
                a {
                  color: #ef4444 !important;
                }
              </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
              <!-- Wrapper -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <!-- Main Container -->
                    <table width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="max-width: 600px; width: 100%; background-color: #111111; border-radius: 16px; border: 1px solid #333333;">
                      
                      <!-- Header -->
                      <tr>
                        <td class="header" style="padding: 40px; text-align: center; border-bottom: 1px solid #333333;">
                          <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: -1px;">
                            KINKER<span style="color: #ef4444;">.</span>
                          </h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px; color: #ffffff;">
                          ${content}
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td class="footer" style="padding: 30px 40px; text-align: center; border-top: 1px solid #333333; color: #666666; font-size: 12px;">
                          <p style="margin: 0 0 10px 0; color: #666666;">
                            KINKER Basel | Barcelona-Strasse 4, 4142 Münchenstein
                          </p>
                          <p style="margin: 0;">
                            <a href="https://kinker.ch" style="color: #ef4444; text-decoration: none;">kinker.ch</a>
                          </p>
                          <p style="margin: 20px 0 0 0; font-size: 11px; color: #666666;">
                            Du erhältst diese E-Mail, weil du dich für den KINKER Newsletter angemeldet hast.
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        })
        results.push({ email, status: 'sent' })
      } catch (error) {
        results.push({ email, status: 'failed', error: String(error) })
      }
    }

    const sent = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      results: testOnly ? results : undefined
    })
  } catch (error: any) {
    console.error('Newsletter send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
