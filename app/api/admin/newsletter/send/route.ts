import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-layout'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const fromName = process.env.RESEND_FROM_NAME || 'KINKER Basel'

// Basic HTML escape to prevent XSS in newsletter emails
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// POST /api/admin/newsletter/send - Send newsletter to all subscribers
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

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
        const contentHtml = `
          <tr>
            <td style="padding: 40px 32px; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${escapeHtml(content)}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #888888; font-family: sans-serif;">
                Du erhältst diese E-Mail, weil du dich für den KINKER Newsletter angemeldet hast.
              </p>
            </td>
          </tr>`

        const html = wrapEmail(contentHtml, subject)

        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: email,
          subject: subject,
          html
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
