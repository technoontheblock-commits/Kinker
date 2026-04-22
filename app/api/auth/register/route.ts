import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendVerificationEmail(email: string, code: string, name: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured, skipping verification email')
    return
  }

  const resend = new Resend(apiKey)

  const html = `
  <!DOCTYPE html>
  <html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifiziere deine E-Mail</title>
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
                <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #ffffff;">Verifiziere deine E-Mail</h2>
                <p style="margin: 0 0 24px; font-size: 16px; color: #9CA3AF;">Hallo ${name},</p>
                <p style="margin: 0 0 32px; font-size: 16px; color: #9CA3AF;">Gib diesen Code auf der Webseite ein, um deine E-Mail-Adresse zu bestätigen:</p>
                <div style="background-color: #1a1a1a; border: 2px solid #FF4D00; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                  <p style="margin: 0; font-size: 42px; font-weight: 800; color: #FF4D00; letter-spacing: 8px; font-family: monospace;">${code}</p>
                </div>
                <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">Dieser Code ist 30 Minuten gültig.</p>
                <p style="margin: 0; font-size: 14px; color: #6B7280;">Falls du dich nicht bei KINKER registriert hast, ignoriere diese E-Mail.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center; border-top: 1px solid #333; background-color: #0d0d0d;">
                <p style="margin: 0; font-size: 12px; color: #4B5563;">KINKER Basel • Barcelona-Strasse 4 • 4142 Münchenstein</p>
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
    to: email,
    subject: 'Dein Verifizierungscode - KINKER',
    html
  })
}

// POST /api/auth/register - Register new user
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { name, email, password, newsletter } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser?.email_verified) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate verification code
    const verificationCode = generateCode()
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

    let userId: string

    if (existingUser && !existingUser.email_verified) {
      // Update unverified user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          password_hash: passwordHash,
          verification_code: verificationCode,
          verification_expires: verificationExpires,
          status: 'active'
        })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Update user error:', updateError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }
      userId = existingUser.id
    } else {
      // Create new user
      const { data: user, error: createError } = await supabase
        .from('users')
        .insert({
          name: name.trim(),
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role: 'user',
          status: 'active',
          email_verified: false,
          verification_code: verificationCode,
          verification_expires: verificationExpires
        })
        .select()
        .single()

      if (createError) {
        console.error('Create user error:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }
      userId = user.id

      // Create user profile
      await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          name: name.trim(),
          newsletter_opt_in: newsletter === true
        })

      // Create wallet
      await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          balance: 0
        })

      // Create rewards record
      await supabase
        .from('user_rewards')
        .insert({
          user_id: userId,
          points: 0,
          lifetime_points: 0,
          tier: 'Bronze'
        })
    }

    // Add to newsletter subscribers if opted in
    if (newsletter === true) {
      await supabase
        .from('newsletter_subscribers')
        .upsert({
          email: email.toLowerCase(),
          confirmed: false,
          subscribed_at: new Date().toISOString()
        }, { onConflict: 'email' })
    }

    // Send verification email
    try {
      await sendVerificationEmail(email.toLowerCase(), verificationCode, name.trim())
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue - user can request a new code
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      userId,
      email: email.toLowerCase()
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
