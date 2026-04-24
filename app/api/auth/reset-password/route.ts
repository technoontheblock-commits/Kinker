import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find user by token
    const { data: user } = await supabase
      .from('users')
      .select('id, reset_expires')
      .eq('reset_token', token)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // Check expiry
    if (new Date(user.reset_expires) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update password and clear token
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Reset password update error:', error)
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 })
  }
}

// GET /api/auth/reset-password?token=xxx - Validate token
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_expires')
      .eq('reset_token', token)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    if (new Date(user.reset_expires) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch (error: any) {
    console.error('Validate token error:', error)
    return NextResponse.json({ error: error.message || 'Failed to validate token' }, { status: 500 })
  }
}
