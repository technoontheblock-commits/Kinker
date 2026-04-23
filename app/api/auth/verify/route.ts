import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSignedSession } from '@/lib/auth'
import { getLightFooter } from '@/lib/email-footer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/auth/verify - Verify email with code
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find user by email and code
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('verification_code', code)
      .single()

    if (findError || !user) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Check if code is expired
    if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
      return NextResponse.json({ error: 'Verification code expired. Please register again.' }, { status: 410 })
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_code: null,
        verification_expires: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Verify error:', updateError)
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
    }

    // Confirm newsletter subscription
    await supabase
      .from('newsletter_subscribers')
      .update({ confirmed: true })
      .eq('email', email.toLowerCase())

    // Create session
    const sessionToken = createSignedSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'user'
    })

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

    response.cookies.set('user_session', sessionToken, {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/auth/verify/resend - Resend verification code
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (!user || user.email_verified) {
      return NextResponse.json({ error: 'User not found or already verified' }, { status: 400 })
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    await supabase
      .from('users')
      .update({ verification_code: verificationCode, verification_expires: verificationExpires })
      .eq('id', user.id)

    // Send email
    const { Resend } = await import('resend')
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: email.toLowerCase(),
        subject: 'Dein Verifizierungscode - KINKER',
        html: `<!DOCTYPE html><html><head><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body style="margin:0;padding:0;background-color:#f5f5f5"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;border:1px solid #e5e5e5"><tr><td style="padding:48px 32px 24px;text-align:center"><h1 style="margin:0;font-size:28px;font-weight:800;color:#dc2626;letter-spacing:3px;font-family:sans-serif">KINKER</h1><p style="margin:6px 0 0;font-size:12px;color:#999999;text-transform:uppercase;letter-spacing:4px;font-family:sans-serif">BASEL</p></td></tr><tr><td style="padding:0 32px"><div style="height:2px;background:linear-gradient(90deg,transparent,#dc2626,transparent)"></div></td></tr><tr><td style="padding:40px 32px 32px;text-align:center"><p style="margin:0 0 8px;font-size:15px;color:#666666;font-family:sans-serif">Hallo <strong style="color:#111111">${user.name}</strong>,</p><p style="margin:0 0 32px;font-size:15px;color:#666666;line-height:1.5;font-family:sans-serif">Dein neuer Verifizierungscode:</p><div style="background-color:#fafafa;border:2px solid #dc2626;border-radius:12px;padding:28px;margin-bottom:28px"><p style="margin:0;font-size:40px;font-weight:800;color:#dc2626;letter-spacing:10px;font-family:monospace">${verificationCode}</p></div><p style="margin:0;font-size:13px;color:#888888;font-family:sans-serif">Gültig für <strong style="color:#111111">30 Minuten</strong>.</p></td></tr>${getLightFooter()}</table></td></tr></table></body></html>`
      })
    }

    return NextResponse.json({ success: true, message: 'Code resent' })
  } catch (error: any) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
