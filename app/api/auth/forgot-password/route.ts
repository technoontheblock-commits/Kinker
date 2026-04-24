import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { wrapEmail } from '@/lib/email-layout'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .single()

    // Always return success — don't reveal if email exists
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
    }

    // Generate reset token
    const resetToken = crypto.randomUUID()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Save token to user
    await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_expires: resetExpires })
      .eq('id', user.id)

    // Send reset email
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      const resend = new Resend(apiKey)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'
      const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`

      const contentHtml = `
        <tr>
          <td style="padding: 40px 32px; text-align: center;">
            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
              Reset Your Password
            </h2>
            <p style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: sans-serif;">
              Hello <strong style="color: #111111;">${user.name || ''}</strong>,
            </p>
            <p style="margin: 0 0 32px; font-size: 15px; color: #666666; line-height: 1.5; font-family: sans-serif;">
              You requested a password reset. Click the button below to set a new password. This link is valid for 1 hour.
            </p>
            <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; font-family: sans-serif;">
              Reset Password
            </a>
            <p style="margin: 32px 0 0; font-size: 13px; color: #888888; font-family: sans-serif;">
              If you didn&apos;t request this, you can ignore this email.
            </p>
          </td>
        </tr>`

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: user.email,
        subject: 'Password Reset - KINKER',
        html: wrapEmail(contentHtml, 'Password Reset')
      })
    }

    return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 })
  }
}
