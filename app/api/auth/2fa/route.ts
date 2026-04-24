import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setSessionCookie, createSignedSession } from '@/lib/auth'
import speakeasy from 'speakeasy'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getDeviceInfo(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || 'Unknown'
  if (ua.includes('Mobile')) return 'Mobile Browser'
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'Mac'
  if (ua.includes('Linux')) return 'Linux'
  return 'Browser'
}

// POST /api/auth/2fa - Verify 2FA code during login
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 401 })
    }

    if (!user.totp_enabled || !user.totp_secret) {
      return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
    }

    // Check backup code
    const isBackupCode = user.totp_backup_codes?.includes(code.toUpperCase())
    let verified = false

    if (isBackupCode) {
      verified = true
      const newBackupCodes = user.totp_backup_codes.filter((c: string) => c !== code.toUpperCase())
      await supabase
        .from('users')
        .update({ totp_backup_codes: newBackupCodes })
        .eq('id', user.id)
    } else {
      verified = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: code,
        window: 2
      })
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Create session
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'user' as const
    }
    const token = createSignedSession(sessionUser)
    setSessionCookie(sessionUser)

    // Store session in database
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : request.ip || 'unknown'
    
    await supabase.from('user_sessions').insert({
      user_id: user.id,
      session_token: token,
      device_info: getDeviceInfo(request),
      ip_address: ip
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('2FA verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
