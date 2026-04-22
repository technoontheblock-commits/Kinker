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

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Verifiziere deine E-Mail</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; padding: 0; background-color: #f5f5f5 !important; }
    .wrapper { background-color: #f5f5f5 !important; }
    .card { background-color: #ffffff !important; border: 1px solid #e5e5e5 !important; }
    .text-dark { color: #111111 !important; }
    .text-muted { color: #666666 !important; }
    .code-box { background-color: #fafafa !important; border: 2px solid #dc2626 !important; }
    .code-text { color: #dc2626 !important; }
    .footer { background-color: #fafafa !important; border-top: 1px solid #e5e5e5 !important; }
  </style>
</head>
<body>
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="card" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5;">
          <!-- Header -->
          <tr>
            <td style="padding: 48px 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #dc2626; letter-spacing: 3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">KINKER</h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">BASEL</p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 2px; background: linear-gradient(90deg, transparent, #dc2626, transparent);"></div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px 32px; text-align: center;">
              <h2 class="text-dark" style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Verifiziere deine E-Mail</h2>
              <p class="text-muted" style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Hallo <strong style="color: #111111;">${name}</strong>,</p>
              <p class="text-muted" style="margin: 0 0 32px; font-size: 15px; color: #666666; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Gib diesen Code auf der Webseite ein, um dein KINKER-Konto zu aktivieren:</p>
              <div class="code-box" style="background-color: #fafafa; border: 2px solid #dc2626; border-radius: 12px; padding: 28px; margin-bottom: 28px;">
                <p class="code-text" style="margin: 0; font-size: 40px; font-weight: 800; color: #dc2626; letter-spacing: 10px; font-family: 'SF Mono', Monaco, monospace;">${code}</p>
              </div>
              <p class="text-muted" style="margin: 0 0 4px; font-size: 13px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Dieser Code ist <strong style="color: #111111;">30 Minuten</strong> gültig.</p>
              <p class="text-muted" style="margin: 0; font-size: 13px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 24px 32px; text-align: center; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">KINKER Basel</p>
              <p style="margin: 0; font-size: 12px; color: #bbbbbb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Barcelona-Strasse 4, 4142 Münchenstein</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

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
