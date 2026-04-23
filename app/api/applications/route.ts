import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-layout'
import { getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null



// GET /api/applications - Get user's job applications
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:jobs(title, department, type, location)
      `)
      .eq('email', user.email)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/applications - Submit new application
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { job_id, message, cv_url } = body

    if (!job_id) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if already applied
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('email', user.email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 })
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name, phone')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id,
        name: profile?.name || user.email.split('@')[0],
        email: user.email,
        phone: profile?.phone || '',
        message: message || '',
        cv_url: cv_url || '',
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get job details for email
    const { data: jobData } = await supabase
      .from('jobs')
      .select('title, department')
      .eq('id', job_id)
      .single()

    // Send confirmation email directly via Resend
    if (resend) {
      try {
        const appName = profile?.name || user.email.split('@')[0]
        const jobTitle = jobData?.title || 'Position'
        const department = jobData?.department || 'N/A'
        const appId = data.id

        const contentHtml = `
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: #ffffff;">
                ✓
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
                Bewerbung eingereicht!
              </h2>
              <p style="margin: 0; font-size: 15px; color: #666666; font-family: sans-serif;">
                Vielen Dank für dein Interesse an KINKER.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
                <tr style="background-color: #f5f5f5;">
                  <td colspan="2" style="padding: 16px; text-align: center;">
                    <span style="font-size: 12px; text-transform: uppercase; color: #666666; letter-spacing: 1px; font-family: sans-serif; font-weight: 600;">Bewerbungsdetails</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Bewerbungs-ID</td>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #dc2626; font-family: monospace; font-weight: 600; text-align: right; font-size: 14px;">#${appId.slice(-8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Position</td>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; font-weight: 600; text-align: right; font-size: 14px; font-family: sans-serif;">${jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #666666; font-size: 14px; font-family: sans-serif;">Abteilung</td>
                  <td style="padding: 16px; border-bottom: 1px solid #e5e5e5; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">${department}</td>
                </tr>
                <tr>
                  <td style="padding: 16px; color: #666666; font-size: 14px; font-family: sans-serif;">Bewerber</td>
                  <td style="padding: 16px; color: #111111; text-align: right; font-size: 14px; font-family: sans-serif;">${appName}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 16px; font-size: 16px; color: #dc2626; font-weight: 600; font-family: sans-serif;">
                  Was passiert als Nächstes?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8; font-family: sans-serif;">
                  <li>Wir prüfen deine Bewerbung sorgfältig</li>
                  <li>Du erhältst innerhalb von 5-7 Werktagen eine Rückmeldung</li>
                  <li>Bei positivem Interesse laden wir dich zum Gespräch ein</li>
                  <li>Fragen? Schreibe uns: <a href="mailto:jobs@knkr.ch" style="color: #dc2626; text-decoration: none;">jobs@knkr.ch</a></li>
                </ul>
              </div>
            </td>
          </tr>`

        const html = wrapEmail(contentHtml, 'Bewerbung bestätigt')

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: user.email,
          subject: `Bewerbung bestätigt - ${jobTitle}`,
          html
        })
      } catch (emailError) {
        console.error('Failed to send application confirmation email:', emailError)
      }
    }

    return NextResponse.json({ success: true, application: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/applications - Withdraw application
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify ownership
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('id', id)
      .eq('email', user.email)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (existing.status === 'hired' || existing.status === 'rejected') {
      return NextResponse.json({ error: 'Cannot withdraw processed application' }, { status: 400 })
    }

    const { error } = await supabase
      .from('job_applications')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
