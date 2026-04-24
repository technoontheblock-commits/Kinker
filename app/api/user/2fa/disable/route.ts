import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import speakeasy from 'speakeasy'

// POST /api/user/2fa/disable - Disable 2FA after verification
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
    .select('totp_secret, totp_enabled, totp_backup_codes')
    .eq('id', user.id)
    .single()

  if (userError || !dbUser?.totp_enabled) {
    return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
  }

  // Check if it's a backup code
  const isBackupCode = dbUser.totp_backup_codes?.includes(code.toUpperCase())

  let verified = false
  if (isBackupCode) {
    verified = true
    // Remove used backup code
    const newBackupCodes = dbUser.totp_backup_codes.filter((c: string) => c !== code.toUpperCase())
    await (supabase as any)
      .from('users')
      .update({ totp_backup_codes: newBackupCodes })
      .eq('id', user.id)
  } else if (dbUser.totp_secret) {
    verified = speakeasy.totp.verify({
      secret: dbUser.totp_secret,
      encoding: 'base32',
      token: code,
      window: 2
    })
  }

  if (!verified) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  // Disable 2FA
  const { error } = await (supabase as any)
    .from('users')
    .update({
      totp_enabled: false,
      totp_secret: null,
      totp_verified_at: null,
      totp_backup_codes: []
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error disabling 2FA:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
