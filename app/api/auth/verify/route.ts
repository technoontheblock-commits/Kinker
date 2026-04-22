import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSignedSession } from '@/lib/auth'

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
        html: `<div style="text-align:center;font-family:sans-serif;padding:40px;background:#0a0a0a;color:#fff"><h1 style="color:#FF4D00">KINKER</h1><p>Hallo ${user.name},</p><p>Dein neuer Code:</p><div style="font-size:42px;font-weight:800;color:#FF4D00;letter-spacing:8px;margin:24px 0">${verificationCode}</div><p style="color:#6B7280">Gültig für 30 Minuten.</p></div>`
      })
    }

    return NextResponse.json({ success: true, message: 'Code resent' })
  } catch (error: any) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
