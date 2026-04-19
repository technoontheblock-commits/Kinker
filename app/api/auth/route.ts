import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setSessionCookie } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/auth/login - Login user or scanner
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check scanner_users for staff login
    const { data: scannerUser } = await supabase
      .from('scanner_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('active', true)
      .single()

    if (scannerUser) {
      const isValidPassword = await bcrypt.compare(password, scannerUser.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Update last login
      await supabase
        .from('scanner_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', scannerUser.id)

      // Set signed session cookie
      setSessionCookie({
        id: scannerUser.id,
        email: scannerUser.email,
        name: scannerUser.name,
        role: scannerUser.role,
        type: 'staff'
      })

      return NextResponse.json({
        user: {
          id: scannerUser.id,
          email: scannerUser.email,
          name: scannerUser.name,
          role: scannerUser.role
        },
        role: scannerUser.role
      })
    }

    // Check regular users table
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Set signed session cookie
    setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'user'
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      role: user.role
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { getCurrentUser, clearSessionCookie } from '@/lib/auth'

// GET /api/auth/session - Get current session
export async function GET() {
  try {
    const user = getCurrentUser()
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}

// DELETE /api/auth/logout - Logout
export async function DELETE() {
  clearSessionCookie()
  return NextResponse.json({ success: true })
}
