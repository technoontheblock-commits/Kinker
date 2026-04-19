import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
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

        const html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bewerbung bestätigt</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                  <tr>
                    <td style="padding: 40px 30px 20px; text-align: center; border-bottom: 2px solid #FF4D00;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #FF4D00; letter-spacing: 2px;">KINKER</h1>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 4px;">BASEL</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 64px; font-size: 32px; color: white;">✓</div>
                      <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #ffffff;">Bewerbung eingereicht!</h2>
                      <p style="margin: 0; font-size: 16px; color: #9CA3AF;">Vielen Dank für dein Interesse an KINKER Basel.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 30px 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
                        <tr style="background-color: #262626;">
                          <td colspan="2" style="padding: 16px; text-align: center;">
                            <span style="font-size: 12px; text-transform: uppercase; color: #9CA3AF; letter-spacing: 1px;">Bewerbungsdetails</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Bewerbungs-ID</td>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #FF4D00; font-family: monospace; font-weight: 600; text-align: right;">#${appId.slice(-8).toUpperCase()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Position</td>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; font-weight: 600; text-align: right;">${jobTitle}</td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #9CA3AF; font-size: 14px;">Abteilung</td>
                          <td style="padding: 16px; border-bottom: 1px solid #333; color: #ffffff; text-align: right;">${department}</td>
                        </tr>
                        <tr>
                          <td style="padding: 16px; color: #9CA3AF; font-size: 14px;">Bewerber</td>
                          <td style="padding: 16px; color: #ffffff; text-align: right;">${appName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 30px 40px;">
                      <div style="background: linear-gradient(135deg, rgba(255, 77, 0, 0.1), rgba(255, 77, 0, 0.05)); border: 1px solid rgba(255, 77, 0, 0.3); border-radius: 12px; padding: 24px;">
                        <h3 style="margin: 0 0 16px; font-size: 16px; color: #FF4D00; font-weight: 600;">Was passiert als Nächstes?</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #D1D5DB; font-size: 14px; line-height: 1.8;">
                          <li>Wir prüfen deine Bewerbung sorgfältig</li>
                          <li>Du erhältst innerhalb von 5-7 Werktagen eine Rückmeldung</li>
                          <li>Bei positivem Interesse laden wir dich zum Gespräch ein</li>
                          <li>Fragen? Schreibe uns: jobs@knkr.ch</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
                      <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280;">Du hast Fragen zu deiner Bewerbung?<br><a href="mailto:jobs@knkr.ch" style="color: #FF4D00; text-decoration: none;">jobs@knkr.ch</a></p>
                      <p style="margin: 16px 0 0; font-size: 12px; color: #4B5563;">KINKER Basel • Steinenvorstadt 11 • 4051 Basel</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `

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
