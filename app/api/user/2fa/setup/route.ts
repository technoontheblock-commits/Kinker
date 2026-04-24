import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// POST /api/user/2fa/setup - Generate 2FA secret and QR code
export async function POST() {
  const { authorized, user, response } = await requireAuth()
  if (!authorized) return response

  const supabase = createServerSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `KINKER (${user.email})`,
    length: 32
  })

  // Store secret temporarily (not enabled yet)
  const { error } = await (supabase as any)
    .from('users')
    .update({ totp_secret: secret.base32 })
    .eq('id', user.id)

  if (error) {
    console.error('Error storing 2FA secret:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }

  // Generate QR code
  const otpauthUrl = secret.otpauth_url || `otpauth://totp/KINKER%20(${encodeURIComponent(user.email)})?secret=${secret.base32}&issuer=KINKER`
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

  return NextResponse.json({
    secret: secret.base32,
    qrCode: qrCodeDataUrl
  })
}
