import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import speakeasy from 'speakeasy'
import crypto from 'crypto'

// POST /api/user/2fa/verify - Verify code and enable 2FA
export async function POST(request: Request) {
  const { authorized, user, response } = await requireAuth()
  if (!authorized) return response

  const supabase = createServerSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const { code } = await request.json()
  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 })
  }

  // Get user's TOTP secret
  const { data: dbUser, error: userError } = await (supabase as any)
    .from('users')
    .select('totp_secret')
    .eq('id', user.id)
    .single()

  if (userError || !dbUser?.totp_secret) {
    return NextResponse.json({ error: '2FA not set up' }, { status: 400 })
  }

  // Verify code
  const verified = speakeasy.totp.verify({
    secret: dbUser.totp_secret,
    encoding: 'base32',
    token: code,
    window: 2
  })

  if (!verified) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  )

  // Enable 2FA
  const { error } = await (supabase as any)
    .from('users')
    .update({
      totp_enabled: true,
      totp_verified_at: new Date().toISOString(),
      totp_backup_codes: backupCodes
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error enabling 2FA:', error)
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    backupCodes
  })
}
